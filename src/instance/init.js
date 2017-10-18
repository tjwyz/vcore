/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { initLifecycle, callHook } from './lifecycle'
// import { mark, measure } from '../util/perf'
import { initProvide, initInjections } from './inject'
import { formatComponentName } from '../util/index'

import { mergeOptions } from '../shared/options'
import { extend } from 'shared/util'

let uid = 0

export function initMixin (Vue) {
    Vue.prototype._init = function (options) {
        const vm = this
        // a uid
        vm._uid = uid++

        // let startTag, endTag
        // /* istanbul ignore if */
        // if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        //   startTag = `vue-perf-init:${vm._uid}`
        //   endTag = `vue-perf-end:${vm._uid}`
        //   mark(startTag)
        // }

        // a flag to avoid this being observed
        vm._isVue = true


        // createComponentInstanceForVnode  options._isComponent == true
        // _isComponent是内部创建子组件时才会添加为true的属性
        if (options && options._isComponent) {
            initInternalComponent(vm, options)
        } else {
            //收集 实例对应构造函数 挂载的options和传入的options
            vm.$options = mergeOptions(
                //构造函数及父类所有构造函数上挂载的所有options
                //
                //vm.constructor.options
                resolveConstructorOptions(vm.constructor),
                //传入的options
                options || {},
                vm
            )
        }


        if (process.env.NODE_ENV !== 'production') {
            //服务端渲染的this有区别
            initProxy(vm)
        } else {
            vm._renderProxy = vm
        }

        // expose real self
        vm._self = vm

        initLifecycle(vm)
        initEvents(vm)
        initRender(vm)
        callHook(vm, 'beforeCreate')
        initInjections(vm) // resolve injections before data/props
        initState(vm)
        initProvide(vm) // resolve provide after data/props
        callHook(vm, 'created')

        // /* istanbul ignore if */
        // if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        //   vm._name = formatComponentName(vm, false)
        //   mark(endTag)
        //   measure(`${vm._name} init`, startTag, endTag)
        // }

        if (vm.$options.el) {
            //挂载  在index中定义
            vm.$mount(vm.$options.el)
        }

    }
}

function initInternalComponent (vm, options) {
    //注意这段...子组件template以外的option都在_proto_里
    const opts = vm.$options = Object.create(vm.constructor.options)

    opts.parent = options.parent
    opts.propsData = options.propsData
    opts._parentVnode = options._parentVnode
    opts._parentListeners = options._parentListeners
    opts._renderChildren = options._renderChildren
    opts._componentTag = options._componentTag
    opts._parentElm = options._parentElm
    opts._refElm = options._refElm
    //inline-template渲染函数 先ban了ban了.....
    // if (options.render) {
    //     opts.render = options.render
    //     opts.staticRenderFns = options.staticRenderFns
    // }
}

//核心
//合并当前构造函数上 全局的一些指令/组件/过滤器到 当前构造函数上
export function resolveConstructorOptions (Ctor) {
    //收集在global-api挂载的options
    let options = Ctor.options
    
    // 每extend一次 子构造函数已经把父构造函数的options继承过来了
    // 为什么还要递归呢...先注释
    
    // if (Ctor.super) {
    //     //递归
    //     const superOptions = resolveConstructorOptions(Ctor.super)

    //     const cachedSuperOptions = Ctor.superOptions

    //     if (superOptions !== cachedSuperOptions) {
    //         // super option changed,
    //         // need to resolve new options.
    //         Ctor.superOptions = superOptions
    //         // check if there are any late-modified/attached options (#4976)
    //         const modifiedOptions = resolveModifiedOptions(Ctor)
    //         // update base extend options
    //         if (modifiedOptions) {
    //             extend(Ctor.extendOptions, modifiedOptions)
    //         }

    //         options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)

    //         if (options.name) {
    //             options.components[options.name] = Ctor
    //         }
    //     }
    // }
  return options
}

function resolveModifiedOptions (Ctor) {
    let modified
    const latest = Ctor.options
    const extended = Ctor.extendOptions
    const sealed = Ctor.sealedOptions
    for (const key in latest) {
        if (latest[key] !== sealed[key]) {
            if (!modified) modified = {}
            modified[key] = dedupe(latest[key], extended[key], sealed[key])
        }
    }
    return modified
}

function dedupe (latest, extended, sealed) {
    // compare latest and sealed to ensure lifecycle hooks won't be duplicated
    // between merges
    if (Array.isArray(latest)) {
        const res = []
        sealed = Array.isArray(sealed) ? sealed : [sealed]
        extended = Array.isArray(extended) ? extended : [extended]
        for (let i = 0; i < latest.length; i++) {
            // push original options and not sealed options to exclude duplicated options
            if (extended.indexOf(latest[i]) >= 0 || sealed.indexOf(latest[i]) < 0) {
                res.push(latest[i])
            }
        }
        return res
    } else {
        return latest
    }
}
