/* @flow */

import { toArray } from '../shared/util'


//#！就是个入口....
//
//Vue.js 官方提供的一些插件（例如 vue-router），
//如果检测到 Vue 是可访问的全局变量，这些插件会自动调用 Vue.use()。
//然而在例如 CommonJS 的模块环境中，你应该始终显式地调用 Vue.use()：

/**
    VueRouter.install = function (Vue, options) {
        // 1. 添加全局方法或属性
        Vue.myGlobalMethod = function () {
        // 一些逻辑……
        }

        // 2. 添加一个全局资源(asset)
        Vue.directive('my-directive', {
        bind (el, binding, vnode, oldVnode) {
          // 一些逻辑……
        }
        ...
        })

        // 3. 注入一些组件选项
        Vue.mixin({
        created: function () {
          // 一些逻辑……
        }
        ...
        })

        // 4. 添加一个实例方法
        Vue.prototype.$myMethod = function (methodOptions) {
        // 一些逻辑……
        }
    }
    if (inBrowser && window.Vue) {
        window.Vue.use(VueRouter)
    }
 */

export function initUse (Vue) {
    //function test1(a,b){
    // 　　console.log(a,b);//Vue hello
    // }
    //Vue.use(test1,'hello');
    
    Vue.use = function (plugin) {
        //{Object | Function} plugin
        //如果插件是一个对象，必须提供 install 方法。
        //如果插件是一个函数，它会被作为 install 方法。
        //当 install 方法被同一个插件多次调用，插件将只会被安装一次。
        
        const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
        if (installedPlugins.indexOf(plugin) > -1) {
            return this
        }

        // toArray 类数组变数组从1开始  参数0是plugin
        const args = toArray(arguments, 1)

        //this  Vue构造函数本身
        //将 Vue 构造函数作为第一个参数传入
        args.unshift(this)

        // plugin是个对象
        // 函数内部this.xxx => plugin.xxx
        if (typeof plugin.install === 'function') {
            plugin.install.apply(plugin, args)
        } else if (typeof plugin === 'function') {
            plugin.apply(null, args)
        }

        installedPlugins.push(plugin)
        //链式调用  Vue.A().B().C().D();
        return this
    }
}
