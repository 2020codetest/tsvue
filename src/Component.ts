import { defineReactive, INotifier } from "./Reactive";

export interface Component{
    children: Component[];
    type: string;
    props: any;
    node: Node;
    render(): RenderComponent;
    flush(parent: Node): Node;
    unmount(): void;
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

    unmount(): void{
    }
}

export class ElementWrapper implements Component{
    children: Component[];
    type: string;
    props: any;
    node: Node;
    listeners: {[index: string]: any};
    constructor(tag: string, props: any, children: Component[]){
        this.children = children;
        this.props = props;
        this.type = tag;
        this.listeners = {}
    }


    unmount(): void{
        for (let key in this.listeners){
            this.node.removeEventListener(key, this.listeners[key])
        }

        this.listeners = {}
    }

    render(): RenderComponent{
        return this;
    }

    flush(parent: Node): Node{
        let node = document.createElement(this.type)
        if (this.node){
            this.unmount()
            parent.replaceChild(node, this.node)
        }
        else{
            parent.appendChild(node)
        }

        this.node = node
        if (this.props){
            for (let prop in this.props){
                let value = this.props[prop]
                if (prop === "className"){
                    node.setAttribute("class", value)
                }
                else if (prop.match(/^on([\s\S]+)/)){
                    let event = prop.substr(2).toLowerCase()
                    this.listeners[event] = value
                    node.addEventListener(event, this.listeners[event])
                    continue;
                }
                else{
                    node.setAttribute(prop, value)
                }
            }
        }

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
        this.renderedComp = this.render()
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

    update(): void {
        this.flush(this.parent)
    }

    notify() {
        if (!this.promiseIssued){
            this.promiseIssued = true
            Promise.resolve().then(() => {
                this.update()
                this.promiseIssued = false
            })
        }
    }
}