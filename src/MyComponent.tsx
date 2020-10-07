import { RenderComponent, Vue } from "./Component";
import {MyVue} from "./MyVue";

export interface MyProps{

}

export interface MyData{
    text: string;
    label: string;
}

interface InnerData{
    cnt: number;
}

interface InnerProps{
    txt: string;
}

class InnerComp extends Vue<InnerData, InnerProps> {
    data: InnerData = {cnt: 0}
    constructor(props: InnerProps, data: InnerData){
        super(props, data)
    }

    render(): RenderComponent{
        return (
            <div className="blue" onClick={() => {this.data.cnt++}}>{this.props.txt} {this.data.cnt} click to add count</div>
        )
    }
}

export class MyComponent extends Vue<MyData, MyProps> {
    data: MyData = {text: "hello", label: "current count"}
    constructor(props: MyProps, data: MyData){
        super(props, data)
    }

    render(): RenderComponent{
        return (
            <div>
                <button onClick={() => {this.data.label = "current count " + new Date().toString() + "  "}} className="green">Click to update time</button>
                <InnerComp txt={this.data.label} />
            </div>
        )
    }
}