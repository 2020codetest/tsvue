export interface INotifier{
    notify(): void;
}

const arrayMethod: string[] = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
]

function defineArray(arr: Array<any>, notifier: INotifier){
    arrayMethod.forEach((method: string) => {
        const original = arr[method]
        Object.defineProperty(arr, method, {
            value: (...args: any) => {
                const result = original.apply(arr, args)
                let inserted;
                switch(method){
                    case 'push':
                    case 'unshift':
                        inserted = args;
                        break;
                    case 'splice':
                        inserted = args.slice(2)
                        break
                }

                if (inserted){
                    for (let item of inserted){
                        defineReactive(item, notifier)
                    }
                }

                notifier.notify()
                return result;
            },
            enumerable: true,
            writable: true,
            configurable: true
        })
    })
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

        if (Array.isArray(value)){
            // watch method operations
            defineArray(value, notifier)
            for (let item of value){
                defineReactive(item, notifier)
            }
        }
    }
}