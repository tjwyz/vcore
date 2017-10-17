/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { defineComputed, proxy } from '../instance/state'

import { extend } from 'shared/util'
import { mergeOptions } from '../shared/options'
export function initExtend (Vue) {
    /**
    * Each instance constructor, including Vue, has a unique
    * cid. This enables us to create wrapped "child
    * constructors" for prototypal inheritance and cache them.
    */
    Vue.cid = 0
    let cid = 1

    /**
    * Class inheritance
    */
    //创建一个“子类(subclass)”。参数是一个包含组件选项的对象
    // var Profile = Vue.extend({
    //     template: '<p>{{firstName}} {{lastName}} aka {{alias}}</p>',
    //     data: function () {
    //         return {
    //             firstName: 'Walter',
    //             lastName: 'White',
    //             alias: 'Heisenberg'
    //         }
    //     }
    // })
    // new Profile().$mount('#mount-point')
    // 
    // new Vue({
    //     template: '<p>{{firstName}} {{lastName}} aka {{alias}}</p>',
    //     data: function () {
    //         return {
    //             firstName: 'Walter',
    //             lastName: 'White',
    //             alias: 'Heisenberg'
    //         }
    //     }
    // })

    Vue.extend = function (extendOptions) {
        extendOptions = extendOptions || {}
        const Super = this
        const SuperId = Super.cid
        const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
        if (cachedCtors[SuperId]) {
            return cachedCtors[SuperId]
        }

        const name = extendOptions.name || Super.options.name
        // if (process.env.NODE_ENV !== 'production') {
        //     if (!/^[a-zA-Z][\w-]*$/.test(name)) {
        //         warn(
        //         'Invalid component name: "' + name + '". Component names ' +
        //         'can only contain alphanumeric characters and the hyphen, ' +
        //         'and must start with a letter.'
        //         )
        //     }
        // }

        const Sub = function VueComponent (options) {
            this._init(options)
        }
        Sub.prototype = Object.create(Super.prototype)
        Sub.prototype.constructor = Sub
        Sub.cid = cid++
        Sub.options = mergeOptions(
            Super.options,
            extendOptions
        )
        Sub['super'] = Super

        // For props and computed properties, we define the proxy getters on
        // the Vue instances at extension time, on the extended prototype. This
        // avoids Object.defineProperty calls for each instance created.
        if (Sub.options.props) {
            initProps(Sub)
        }
        if (Sub.options.computed) {
            initComputed(Sub)
        }

        // allow further extension/mixin/plugin usage
        Sub.extend = Super.extend
        Sub.mixin = Super.mixin
        Sub.use = Super.use

        // create asset registers, so extended classes
        // can have their private assets too.
        ASSET_TYPES.forEach(function (type) {
            Sub[type] = Super[type]
        })
        // enable recursive self-lookup
        if (name) {
            Sub.options.components[name] = Sub
        }

        // keep a reference to the super options at extension time.
        // later at instantiation we can check if Super's options have
        // been updated.
        Sub.superOptions = Super.options
        Sub.extendOptions = extendOptions
        Sub.sealedOptions = extend({}, Sub.options)

        // cache constructor
        cachedCtors[SuperId] = Sub
        return Sub
    }
}

function initProps (Comp) {
    const props = Comp.options.props
    for (const key in props) {
        proxy(Comp.prototype, `_props`, key)
    }
}

function initComputed (Comp) {
    const computed = Comp.options.computed
    for (const key in computed) {
        defineComputed(Comp.prototype, key, computed[key])
    }
}
