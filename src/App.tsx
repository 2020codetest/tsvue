import { RenderComponent, Vue } from "./Component";
import { MyComponent } from "./MyComponent";
import { MyVue } from "./MyVue";

export class App extends Vue<{}, {}>{
    constructor(props: {}){
        super(props)
    }

    render(): RenderComponent{
        return <MyComponent />
    }
}