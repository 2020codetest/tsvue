import { RenderComponent, Vue } from "./Component";
import {MyVue} from "./MyVue";

export interface MyProps{

}

export interface MyData{
    text: string;
    arr: string[];
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
    data: MyData = {text: "hello", arr: ["cnt1", "cnt2", "cnt3"]}
    constructor(props: MyProps, data: MyData){
        super(props, data)
    }

    render(): RenderComponent{
        let arr = this.data.arr
        let list = []
        for (let item of arr){
            list.push(<InnerComp txt={item} />)
        }

        return (
            <div>
                <button onClick={() => { 
                    if (this.data.arr.length){
                        this.data.arr.pop()
                    }
                    else{
                        this.data.arr.push(new Date().toString())
                    }
            }} className="green">Click to update time</button>
                {list}
            </div>
        )
    }
}