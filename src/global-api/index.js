/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
// import { set, del } from '../observer/index'
import { ASSET_TYPES } from '../shared/constants'
// import builtInComponents from '../components/index'

// 没有递归的深拷贝
import { extend } from 'shared/util'

// import {
//   warn,
//   nextTick,
//   mergeOptions,
//   defineReactive
// } from '../util/index'

export function initGlobalAPI (Vue) {
    // config
    Object.defineProperty(Vue, 'config', {
        set:() => {
            console.log('Do not replace the Vue.config object, set individual fields instead.')
        },
        get:() => {
            //先这样写 vue全局config配置
            return config
        }
    })

    // exposed util methods.
    // NOTE: these are not considered part of the public API - avoid relying on
    // them unless you are aware of the risk.
    
    // Vue.util = {
    //     warn,
    //     extend,
    //     mergeOptions,
    //     defineReactive
    // }

    // Vue.set = set
    // Vue.delete = del
    
    // Vue.nextTick = nextTick


    Vue.options = Object.create(null)
    
    // Vue.options.components Vue.options.directives Vue.options.filters
    // new instance时对应this.$options.components
    // 但是全局暴露方法没有(s)  Vue.component  Vue.directive  Vue.filter
    ASSET_TYPES.forEach(type => {
        Vue.options[type + 's'] = Object.create(null)
    })

    // this.$options._base = Vue
    // 给实例对象一个接口暴露对应的构造函数
    Vue.options._base = Vue
    
    //内建组件入口  先Ban了
    // builtInComponents :{KeepAlive:KeepAlive}
    // runtime里那两个内建动效组件先忽略
    // extend(Vue.options.components, builtInComponents)

    initUse(Vue)
    initMixin(Vue)
    initExtend(Vue)
    initAssetRegisters(Vue)
}
