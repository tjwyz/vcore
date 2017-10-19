/* @flow */

import config from '../config'
import Dep from '../observer/dep'
import Watcher from '../observer/watcher'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  observerState,
  defineReactive
} from '../observer/index'

import {
    warn,
    bind,
    noop,
    hasOwn,
    isReserved,
    handleError,
    nativeWatch,
    isPlainObject,
    isReservedAttribute
} from '../util/index'

const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true
}

//代理挂载到this上
//target:this sourceKey:_data  key:tjwyz
export function proxy (target, sourceKey, key) {
    sharedPropertyDefinition.get = function proxyGetter () {
        return this[sourceKey][key]
    }
    sharedPropertyDefinition.set = function proxySetter (val) {
        this[sourceKey][key] = val
    }
    Object.defineProperty(target, key, sharedPropertyDefinition)
}

export function initState (vm) {
    vm._watchers = []
    const opts = vm.$options
    if (opts.props) initProps(vm)
    if (opts.methods) initMethods(vm)
    if (opts.data) {
        initData(vm)
    } else {
        observe(vm._data = {}, true /* asRootData */)
    }
    if (opts.computed) initComputed(vm)
    if (opts.watch && opts.watch !== nativeWatch) {
        initWatch(vm)
    }
}

function initProps (vm) {
    //规定希望从父组件得到的值
    const propsOptions = vm.$options.props
    //子组件确实得到的值(想要的值父组件不一定给)
    const propsData = vm.$options.propsData || {}
    
    const props = vm._props = {}
    // cache prop keys so that future props updates can iterate using Array
    // instead of dynamic object key enumeration.
    // const keys = vm.$options._propKeys = []
    
    const isRoot = !vm.$parent
    // root instance props should be converted
    observerState.shouldConvert = isRoot
    for (const key in propsOptions) {
        // keys.push(key)
        
        // 检查期望属性/值是否为空等 不做这个逻辑了
        // const value = validateProp(key, propsOptions, propsData, vm)
        value = propsData[key]

        //vm._props 挂回调
        defineReactive(vm._props, key, value)

        if (!(key in vm)) {
            proxy(vm, `_props`, key)
        }
    }
    observerState.shouldConvert = true
}

function initData (vm) {
    let data = vm.$options.data
    data = vm._data = typeof data === 'function'
    ? data.call(vm)
    : data || {}

    if (!isPlainObject(data)) {
        data = {}
    }
    // proxy data on instance
    const keys = Object.keys(data)

    let i = keys.length
    while (i--) {
        const key = keys[i]
        proxy(vm, `_data`, key)
    }
    // observe vm._data  注意这个true
    // vm._data.__ob__ == observer
    // observer.value = vm._data
    // observer.dep
    observe(vm._data, true /* asRootData */)
}

const computedWatcherOptions = { lazy: true }


/*
computed: {
    // 仅读取
    aDouble: function () {
        return this.a * 2
    },
    // 读取和设置
    aPlus: {
        get: function () {
            return this.a + 1
        },
        set: function (v) {
            this.a = v - 1
        }
    }
}
 */
function initComputed (vm) {
    computed = vm.$options.computed
    const watchers = vm._computedWatchers = Object.create(null)

    for (const key in computed) {
        const userDef = computed[key]
        let getter = typeof userDef === 'function' ? userDef : userDef.get
        if (process.env.NODE_ENV !== 'production') {
          if (getter === undefined) {
            warn(
              `No getter function has been defined for computed property "${key}".`,
              vm
            )
            getter = noop
          }
        }
        // create internal watcher for the computed property.
        watchers[key] = new Watcher(vm, getter, noop, computedWatcherOptions)

        // component-defined computed properties are already defined on the
        // component prototype. We only need to define computed properties defined
        // at instantiation here.
        if (!(key in vm)) {
            defineComputed(vm, key, userDef)
        }
    }
}

export function defineComputed (target: any, key: string, userDef: Object | Function) {
    if (typeof userDef === 'function') {
        sharedPropertyDefinition.get = createComputedGetter(key)
        sharedPropertyDefinition.set = noop
    } else {
        sharedPropertyDefinition.get = userDef.get
          ? userDef.cache !== false
            ? createComputedGetter(key)
            : userDef.get
          : noop
        sharedPropertyDefinition.set = userDef.set
          ? userDef.set
          : noop
    }
    Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter (key) {
    return function computedGetter () {
        const watcher = this._computedWatchers && this._computedWatchers[key]
        if (watcher) {
            if (watcher.dirty) {
                watcher.evaluate()
            }
            if (Dep.target) {
                watcher.depend()
            }
            return watcher.value
        }
    }
}

function initMethods (vm) {
    const methods = vm.$options.methods
    for (const key in methods) {
        vm[key] = bind(methods[key], vm)
    }
}

// watch: {
//     firstName: function (val) {
//         this.fullName = val + ' ' + this.lastName
//     },
//     lastName: function (val) {
//         this.fullName = this.firstName + ' ' + val
//     }
// }
function initWatch (vm) {
    const watch = vm.$options.watch
    for (const key in watch) {
        const handler = watch[key]
        if (Array.isArray(handler)) {
            for (let i = 0; i < handler.length; i++) {
                createWatcher(vm, key, handler[i])
            }
        } else {
            createWatcher(vm, key, handler)
        }
    }
}

function createWatcher (vm,keyOrFn,handler,options) {
    //回调函数写到options里的情况 
    if (isPlainObject(handler)) {
        options = handler
        handler = handler.handler
    }
    //回调是个method
    if (typeof handler === 'string') {
        handler = vm[handler]
    }
    return vm.$watch(keyOrFn, handler, options)
}


export function stateMixin (Vue) {
    // flow somehow has problems with directly declared definition object
    // when using Object.defineProperty, so we have to procedurally build up
    // the object here.
    const dataDef = {}
    dataDef.get = function () { return this._data }
    dataDef.set = function () {
        console.log("$data cant be change  but _data  can")
    }

    const propsDef = {}
    propsDef.get = function () { return this._props }
    propsDef.set = function () {
        console.log("$props cant be change  but _props  can")
    }

    Object.defineProperty(Vue.prototype, '$data', dataDef)
    Object.defineProperty(Vue.prototype, '$props', propsDef)

    Vue.prototype.$set = set
    Vue.prototype.$delete = del

    Vue.prototype.$watch = function (expOrFn, cb, options) {
        const vm = this
        //回调函数写到options里的情况 
        if (isPlainObject(cb)) {
            return createWatcher(vm, expOrFn, cb, options)
        }
        options = options || {}
        options.user = true
        const watcher = new Watcher(vm, expOrFn, cb, options)
        if (options.immediate) {
            cb.call(vm, watcher.value)
        }
        return function unwatchFn () {
            watcher.teardown()
        }
    }
}
