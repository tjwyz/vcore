/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import { mark, measure } from '../util/perf'
import { createEmptyVNode } from '../vdom/vnode'
import { observerState } from '../observer/index'
import { updateComponentListeners } from './events'
import { resolveSlots } from './render-helpers/resolve-slots'

import {
  warn,
  noop,
  remove,
  handleError,
  emptyObject,
  validateProp
} from '../util/index'

//当前活跃实例..
export let activeInstance = null

export let isUpdatingChildComponent = false

export function callHook (vm, hook) {
    const handlers = vm.$options[hook]
    if (handlers) {
        for (let i = 0, j = handlers.length; i < j; i++) {
            handlers[i].call(vm)
        }
    }
    // if (vm._hasHookEvent) {
    //     vm.$emit('hook:' + hook)
    // }
}

export function initLifecycle (vm) {
    const options = vm.$options

    // activeInstance
    let parent = options.parent
    
    // if (parent && !options.abstract) {
    //     while (parent.$options.abstract && parent.$parent) {
    //         parent = parent.$parent
    //     }
    
    // parent 也是实例..
    // 组件才进实例的$children
    if (parent) {
        parent.$children.push(vm)
    }

    vm.$parent = parent
    vm.$root = parent ? parent.$root : vm

    vm.$children = []
    vm.$refs = {}

    vm._watcher = null
    vm._inactive = null
    vm._directInactive = false
    vm._isMounted = false
    vm._isDestroyed = false
    vm._isBeingDestroyed = false
}

export function lifecycleMixin (Vue: Class<Component>) {
    // public mount method
    // 返回值是个组件
    Vue.prototype.$mount = function (el) {
        let query = function (el) {
            if (typeof el === 'string') {
                const selected = document.querySelector(el)
                if (!selected) {
                    return document.createElement('div')
                }
                return selected
            } else {
                return el
            }
        }
        el = query(el)

        vm.$el = el

        if (!vm.$options.render) {
            vm.$options.render = createEmptyVNode
        }
        callHook(vm, 'beforeMount')

        let updateComponent

        updateComponent = () => {
            vm._update(vm._render())
        }

        vm._watcher = new Watcher(vm, updateComponent, noop)
        // hydrating = false

        // manually mounted instance, call mounted on self
        // mounted is called for render-created child components in its inserted hook
        if (vm.$vnode == null) {
            vm._isMounted = true
            callHook(vm, 'mounted')
        }
    }

    Vue.prototype._update = function (vnode) {
        const vm = this
        if (vm._isMounted) {
            callHook(vm, 'beforeUpdate')
        }
        const prevEl = vm.$el
        const prevVnode = vm._vnode
        const prevActiveInstance = activeInstance
        activeInstance = vm
        vm._vnode = vnode
        // Vue.prototype.__patch__ is injected in entry points
        // based on the rendering backend used.
        if (!prevVnode) {
            // initial render
            vm.$el = vm.__patch__(
                vm.$el, vnode, hydrating, false /* removeOnly */,
                vm.$options._parentElm,
                vm.$options._refElm
            )
            // no need for the ref nodes after initial patch
            // this prevents keeping a detached DOM tree in memory (#5851)
            vm.$options._parentElm = vm.$options._refElm = null
        } else {
            // updates
            vm.$el = vm.__patch__(prevVnode, vnode)
        }
        activeInstance = prevActiveInstance
        // update __vue__ reference
        if (prevEl) {
            prevEl.__vue__ = null
        }
        if (vm.$el) {
            vm.$el.__vue__ = vm
        }
        // if parent is an HOC, update its $el as well
        if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
            vm.$parent.$el = vm.$el
        }
        // updated hook is called by the scheduler to ensure that children are
        // updated in a parent's updated hook.
    }

    Vue.prototype.$forceUpdate = function () {
        const vm: Component = this
        if (vm._watcher) {
            vm._watcher.update()
        }
    }

    Vue.prototype.$destroy = function () {
        const vm: Component = this
        if (vm._isBeingDestroyed) {
            return
        }
        callHook(vm, 'beforeDestroy')
        vm._isBeingDestroyed = true
        // remove self from parent
        const parent = vm.$parent
        if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
            remove(parent.$children, vm)
        }
        // teardown watchers
        if (vm._watcher) {
            vm._watcher.teardown()
        }
        let i = vm._watchers.length
        while (i--) {
            vm._watchers[i].teardown()
        }
        // remove reference from data ob
        // frozen object may not have observer.
        if (vm._data.__ob__) {
            vm._data.__ob__.vmCount--
        }
        // call the last hook...
        vm._isDestroyed = true
        // invoke destroy hooks on current rendered tree
        vm.__patch__(vm._vnode, null)
        // fire destroyed hook
        callHook(vm, 'destroyed')
        // turn off all instance listeners.
        vm.$off()
        // remove __vue__ reference
        if (vm.$el) {
            vm.$el.__vue__ = null
        }
    }
}



export function updateChildComponent (vm, propsData, listeners, parentVnode, renderChildren) {
    if (process.env.NODE_ENV !== 'production') {
        isUpdatingChildComponent = true
    }

    // determine whether component has slot children
    // we need to do this before overwriting $options._renderChildren
    const hasChildren = !!(
        renderChildren ||               // has new static slots
        vm.$options._renderChildren ||  // has old static slots
        parentVnode.data.scopedSlots || // has new scoped slots
        vm.$scopedSlots !== emptyObject // has old scoped slots
    )

    vm.$options._parentVnode = parentVnode
    vm.$vnode = parentVnode // update vm's placeholder node without re-render

    if (vm._vnode) { // update child tree's parent
        vm._vnode.parent = parentVnode
    }
    vm.$options._renderChildren = renderChildren

    // update $attrs and $listensers hash
    // these are also reactive so they may trigger child update if the child
    // used them during render
    vm.$attrs = parentVnode.data && parentVnode.data.attrs
    vm.$listeners = listeners

    // update props
    if (propsData && vm.$options.props) {
        observerState.shouldConvert = false
        const props = vm._props
        const propKeys = vm.$options._propKeys || []
        for (let i = 0; i < propKeys.length; i++) {
            const key = propKeys[i]
            props[key] = validateProp(key, vm.$options.props, propsData, vm)
        }
        observerState.shouldConvert = true
        // keep a copy of raw propsData
        vm.$options.propsData = propsData
    }

    // update listeners
    if (listeners) {
        const oldListeners = vm.$options._parentListeners
        vm.$options._parentListeners = listeners
        updateComponentListeners(vm, listeners, oldListeners)
    }
    // resolve slots + force update if has children
    if (hasChildren) {
        vm.$slots = resolveSlots(renderChildren, parentVnode.context)
        vm.$forceUpdate()
    }

    if (process.env.NODE_ENV !== 'production') {
        isUpdatingChildComponent = false
    }
}

function isInInactiveTree (vm) {
    while (vm && (vm = vm.$parent)) {
        if (vm._inactive) return true
    }
    return false
}

export function activateChildComponent (vm: Component, direct?: boolean) {
    if (direct) {
        vm._directInactive = false
        if (isInInactiveTree(vm)) {
            return
        }
    } else if (vm._directInactive) {
        return
    }
    if (vm._inactive || vm._inactive === null) {
        vm._inactive = false
        for (let i = 0; i < vm.$children.length; i++) {
            activateChildComponent(vm.$children[i])
        }
        callHook(vm, 'activated')
    }
}

export function deactivateChildComponent (vm: Component, direct?: boolean) {
    if (direct) {
        vm._directInactive = true
        if (isInInactiveTree(vm)) {
            return
        }
    }
    if (!vm._inactive) {
        vm._inactive = true
        for (let i = 0; i < vm.$children.length; i++) {
            deactivateChildComponent(vm.$children[i])
        }
        callHook(vm, 'deactivated')
    }
}
