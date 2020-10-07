export interface INotifier{
    notify(): void;
}


export function defineReactive<Data>(data: Data, notifier: INotifier){
    if (!data){
        return;
    }

    if (typeof data !== "object"){
        return;
    }

    let keys = Object.keys(data)
    for (let key of keys){
        let value = data[key]
        Object.defineProperty(data, key, {
            get: () => {
                return value
            },
            set: (val: any) => {
                value = val;
                notifier.notify()
                defineReactive(val, notifier)
            }
        })

        if (typeof value === 'object'){
            defineReactive(value, notifier)
        }
    }
}