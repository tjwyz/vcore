/* @flow */

import Dep from './dep'
import {
    def,
    warn,
    hasOwn,
    hasProto,
    isObject,
    isPlainObject,
    isValidArrayIndex,
    isServerRendering
} from '../util/index'



/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 */
export class Observer {

    constructor (value) {
        this.value = value
        this.dep = new Dep()
        
        // number of vms that has this object as root $data
        this.vmCount = 0
        //def 没第四个参数    value中__ob__是不可枚举的，Object.keys不出
        def(value, '__ob__', this)

        if (Array.isArray(value)) {
            this.observeArray(value)
        } else {
            this.walk(value)
        }
    }

    /**
    * Walk through each property and convert them into
    * getter/setters. This method should only be called when
    * value type is Object.
    */
    walk (obj) {
        const keys = Object.keys(obj)
        for (let i = 0; i < keys.length; i++) {
            defineReactive(obj, keys[i], obj[keys[i]])
        }
    }

    /**
    * Observe a list of Array items.
    */
    observeArray (items) {
        for (let i = 0, l = items.length; i < l; i++) {
            observe(items[i])
        }
    }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 * value : vm._data {a:1}
 */
export function observe (value, asRootData) {
    // value是实例对象
    if (!isObject(value)) {
        return
    }
    let ob
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
        ob = value.__ob__
    } else if ( (Array.isArray(value) || isPlainObject(value)) && Object.isExtensible(value) && !value._isVue
    ) {
        ob = new Observer(value)
    }


    if (asRootData && ob) {
        ob.vmCount++
    }
    return ob
}



/**
 * Define a reactive property on an Object.
 * obj:vm._props
 * 暂时取消了深度监听！！！！！
 */
export function defineReactive (obj, key, val, customSetter) {

    // 四个地方调用了dep.notify
    // 1.对数组push等七个方法重写的函数中
    // 2.set方法，为一个对象添加一个属性
    // 3.del方法，为对象删除一个属性
    // 4.在此
    const dep = new Dep()

    const property = Object.getOwnPropertyDescriptor(obj, key)
    //能否使用delete、能否需改属性特性、或能否修改访问器属性、，false为不可重新定义，默认值为true
    if (property && property.configurable === false) {
        return
    }

    // cater for pre-defined getter/setters
    // const getter = property && property.get
    // const setter = property && property.set
    // 递归！
    // 暂时不收集子元素
    // let childOb = observe(val)
    
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter () {
            // const value = getter ? getter.call(obj) : val
            // const value = val
            
            // 很重要. 首次收集时才有  
            // 后续get都不在了  直接返回val
            if (Dep.target) {
                dep.depend()
                // if (childOb) {
                //     childOb.dep.depend()
                // }
                // if (Array.isArray(value)) {
                //     dependArray(value)
                // }
            }
            return val
        },
        set: function reactiveSetter (newVal) {
            // const value = getter ? getter.call(obj) : val
            // const value = val
            
            // if (newVal === value || (newVal !== newVal && value !== value)) {
            //     return
            // }
            if (val === value) {
                return
            }

            val = newVal

            // childOb = observe(newVal)
            dep.notify()
        }
    })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target, key, val) {
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.length = Math.max(target.length, key)
        target.splice(key, 1, val)
        return val
    }
    if (hasOwn(target, key)) {
        target[key] = val
        return val
    }
    const ob = (target: any).__ob__
    if (target._isVue || (ob && ob.vmCount)) {
        process.env.NODE_ENV !== 'production' && warn(
        'Avoid adding reactive properties to a Vue instance or its root $data ' +
        'at runtime - declare it upfront in the data option.'
        )
        return val
    }
    if (!ob) {
        target[key] = val
        return val
    }
    defineReactive(ob.value, key, val)
    ob.dep.notify()
    return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target, key) {
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.splice(key, 1)
        return
    }
    const ob = (target: any).__ob__
    if (target._isVue || (ob && ob.vmCount)) {
        process.env.NODE_ENV !== 'production' && warn(
          'Avoid deleting properties on a Vue instance or its root $data ' +
          '- just set it to null.'
        )
        return
    }
    if (!hasOwn(target, key)) {
        return
    }
    delete target[key]
    if (!ob) {
        return
    }
    ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
// function dependArray (value) {
//     for (let e, i = 0, l = value.length; i < l; i++) {
//         e = value[i]
//         e && e.__ob__ && e.__ob__.dep.depend()
//         if (Array.isArray(e)) {
//             dependArray(e)
//         }
//     }
// }
