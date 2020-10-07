import { MyProps } from "./MyComponent";
import { defineReactive, INotifier } from "./Reactive";

export interface Component{
    children: Component[];
    type: string;
    props: any;
    node: Node;
    render(): RenderComponent;
    flush(parent: Node): Node;
    unmount(): void;
    update(newComp: RenderComponent): void;
}

export type RenderComponent = Component | null;

export class TextWrapper implements Component{
    content: string;
    type: string;
    children: Component[];
    props: any;
    node: Node;
    constructor(content: string){
        this.content = content;
        this.children = []
        this.type = "#text";
        this.props = undefined;
    }

    render(): RenderComponent{
        return this;
    }

    flush(parent: Node): Node{
        let node = document.createTextNode(this.content)
        if (this.node){
            parent.replaceChild(node, this.node)
        }
        else{
            parent.appendChild(node)
        }

        this.node = node
        return this.node
    }

    update(newComp: RenderComponent){
        if (this.content !== (newComp as TextWrapper).content){
            (this.node as Text).textContent = (newComp as TextWrapper).content
        }
    }

    unmount(): void{
    }
}

export class ElementWrapper implements Component{
    children: Component[];
    type: string;
    props: any;
    node: Node;
    parent: Node;
    listeners: {[index: string]: any};
    constructor(tag: string, props: any, children: Component[]){
        this.children = children;
        this.props = props;
        this.type = tag;
        this.listeners = {}
    }

    releaseEvents(){
        for (let key in this.listeners){
            this.node.removeEventListener(key, this.listeners[key])
        }

        this.listeners = {}
    }

    diffProps(oldProps: MyProps, newProps: MyProps){
        if (!oldProps){
            this.updateProps(newProps)
            return;
        }
        
        if (!newProps){
            // remove all attributes
            for (let key in oldProps){
                (this.node as HTMLElement).setAttribute(key, undefined)
            }
        }
        else{
            for (let prop in oldProps){
                if (prop in newProps){
                    let oldValue = oldProps[prop]
                    let newValue = newProps[prop]
                    if (oldValue !== newValue){
                        this.updatePropsInternal(prop, newValue)
                    }
                }
                else{
                    (this.node as HTMLElement).setAttribute(prop, undefined)
                }
            }

            for (let prop in newProps){
                if (!(prop in oldProps)){
                    let value = newProps[prop]
                    this.updatePropsInternal(prop, value)
                }
            }
        }
    }

    updatePropsInternal(prop: string, value: any){
        if (prop === "className"){
            (this.node as HTMLElement).setAttribute("class", value)
        }
        else if (prop.match(/^on([\s\S]+)/)){
            let event = prop.substr(2).toLowerCase()
            this.listeners[event] = value
            this.node.addEventListener(event, this.listeners[event])
        }
        else{
            (this.node as HTMLElement).setAttribute(prop, value)
        }

    }

    updateProps(props: MyProps){
        if (props){
            for (let prop in props){
                let value = props[prop]
                this.updatePropsInternal(prop, value)
            }
        }
    }

    unmount(): void{
        this.releaseEvents()
    }

    render(): RenderComponent{
        return this;
    }

    update(newComp: Component): void{
        if (newComp.type !== this.type){
            // different type, just flush the whole tree
            this.parent.removeChild(this.node)
            this.node = newComp.flush(this.parent)
        }
        else{
            this.releaseEvents()
            // check the diff props, no need to add/delete/update attributes
            this.diffProps(this.props, newComp.props)
            // check children here
            let minLength = Math.min(this.children.length, newComp.children.length)
            for (let inx = 0; inx < minLength; ++inx){
                // try to update same node
                this.children[inx].update(newComp.children[inx].render())
            }

            // if there are more children in original comp, just remove them
            if (this.children.length > minLength){
                for (let inx = minLength; inx < this.children.length; ++inx){
                    this.node.removeChild(this.children[inx].node)
                }

                this.children.splice(minLength, this.children.length - minLength)
            }
            // if there are more children in new comp, just flush them
            else if (newComp.children.length > minLength){
                for (let inx = minLength; inx < newComp.children.length; ++inx){
                    newComp.children[inx].flush(this.node)
                    this.children.push(newComp.children[inx])
                }
            }
        }

        this.type = newComp.type
        this.props = newComp.props
    }

    flush(parent: Node): Node{
        this.parent = parent;
        let node = document.createElement(this.type)
        if (this.node){
            this.unmount()
            parent.replaceChild(node, this.node)
        }
        else{
            parent.appendChild(node)
        }

        this.node = node
        this.updateProps(this.props)
        for (let child of this.children){
            child.flush(node)
        }

        return this.node
    }
}

export class Vue<Data = {}, Props = {}> implements Component, INotifier{
    children: Component[];
    type: string;
    props: Props;
    data: Data;
    node: Node;
    parent: Node;
    promiseIssued: boolean;
    watched: boolean;
    renderedComp?: Component;
    cachedComp?: Component;
    constructor(props: Props) {
        this.children = [];
        this.type = "#custom";
        this.props = props;
        this.promiseIssued = false
        this.watched = false
        let render = this.render
        Object.defineProperty(this, "render", {
            get: () => {
                // add watcher here
                if (!this.watched){
                    defineReactive(this.data, this)
                    this.watched = true
                }

                return render
            }
        })
    }

    unmount(): void {
        if (this.renderedComp){
            this.renderedComp.unmount()
        }
    }

    mount(id: string): void {
        this.flush(document.getElementById(id))
    }

    render(): RenderComponent {
        return this;
    }

    flush(parent: Node): Node{
        this.unmount()
        this.parent = parent;
        // maybe it could be fetched from cache
        if (this.cachedComp){
            this.renderedComp = this.cachedComp
            this.cachedComp = null
        }
        else{
            this.renderedComp = this.render()
        }

        let node = this.renderedComp.flush(parent)
        if (this.node){
            this.parent.replaceChild(node, this.node)
        }
        else{
            this.parent.appendChild(node)
        }

        for (let child of this.children){
            child.flush(node)
        }

        this.node = node
        return this.node
    }

    update(newComp: Component): void {
        this.renderedComp.update(newComp)
    }

    notify() {
        if (!this.promiseIssued){
            this.promiseIssued = true
            Promise.resolve().then(() => {
                this.cachedComp = this.render()
                this.update(this.cachedComp)
                this.cachedComp = null
                this.promiseIssued = false
            })
        }
    }
}