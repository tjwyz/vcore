/* @flow */

import {
    warn,
    nextTick,
    toNumber,
    toString,
    looseEqual,
    emptyObject,
    handleError,
    looseIndexOf,
    defineReactive
} from '../util/index'

import VNode, {
    cloneVNodes,
    createTextVNode,
    createEmptyVNode
} from '../vdom/vnode'

import { isUpdatingChildComponent } from './lifecycle'


import { createElement } from '../vdom/create-element'
import { renderList } from './render-helpers/render-list'
import { renderSlot } from './render-helpers/render-slot'
import { resolveFilter } from './render-helpers/resolve-filter'
import { checkKeyCodes } from './render-helpers/check-keycodes'
import { bindObjectProps } from './render-helpers/bind-object-props'
import { renderStatic, markOnce } from './render-helpers/render-static'
import { bindObjectListeners } from './render-helpers/bind-object-listeners'
import { resolveSlots, resolveScopedSlots } from './render-helpers/resolve-slots'

//在Vue init函数中使用
export function initRender (vm) {
    // the root of the child tree
    
    // render
    vm._vnode = null 
    // staticRenderFns
    vm._staticTrees = null
    
    const parentVnode = vm.$vnode = vm.$options._parentVnode // the placeholder node in parent tree
    const renderContext = parentVnode && parentVnode.context
    vm.$slots = resolveSlots(vm.$options._renderChildren, renderContext)
    vm.$scopedSlots = emptyObject
    // bind the createElement fn to this instance
    // so that we get proper render context inside it.
    // args order: tag, data, children, normalizationType, alwaysNormalize
    // internal version is used by render functions compiled from templates
    vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
    // normalization is always applied for the public version, used in
    // user-written render functions.
    vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

    // $attrs & $listeners are exposed for easier HOC creation.
    // they need to be reactive so that HOCs using them are always updated
    const parentData = parentVnode && parentVnode.data
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, '$attrs', parentData && parentData.attrs, () => {
            !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
        }, true)
        defineReactive(vm, '$listeners', parentData && parentData.on, () => {
            !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
        }, true)
    } else {
        defineReactive(vm, '$attrs', parentData && parentData.attrs, null, true)
        defineReactive(vm, '$listeners', parentData && parentData.on, null, true)
    }
}

export function renderMixin (Vue) {
    Vue.prototype.$nextTick = function (fn: Function) {
        return nextTick(fn, this)
    }

    //triggerFrom  this.$mount
    //return VNode
    Vue.prototype._render = function () {
        const vm: Component = this
        const {
            render,
            staticRenderFns,
            _parentVnode
        } = vm.$options

        if (vm._isMounted) {
            // clone slot nodes on re-renders
            for (const key in vm.$slots) {
                vm.$slots[key] = cloneVNodes(vm.$slots[key])
            }
        }

        vm.$scopedSlots = (_parentVnode && _parentVnode.data.scopedSlots) || emptyObject

        if (staticRenderFns && !vm._staticTrees) {
            vm._staticTrees = []
        }
        // set parent vnode. this allows render functions to have access
        // to the data on the placeholder node.
        vm.$vnode = _parentVnode
        
        // render self
        let vnode = render.call(vm._renderProxy, vm.$createElement)

        // set parent
        vnode.parent = _parentVnode
        return vnode
    }

    // internal render helpers.
    // these are exposed on the instance prototype to reduce generated render
    // code size.
    Vue.prototype._o = markOnce
    Vue.prototype._n = toNumber
    Vue.prototype._s = toString
    Vue.prototype._l = renderList
    Vue.prototype._t = renderSlot
    Vue.prototype._q = looseEqual
    Vue.prototype._i = looseIndexOf
    Vue.prototype._m = renderStatic
    Vue.prototype._f = resolveFilter
    Vue.prototype._k = checkKeyCodes
    Vue.prototype._b = bindObjectProps
    Vue.prototype._v = createTextVNode
    Vue.prototype._e = createEmptyVNode
    Vue.prototype._u = resolveScopedSlots
    Vue.prototype._g = bindObjectListeners
}
