/* @flow */

import VNode from './vnode'
import { resolveConstructorOptions } from 'core/instance/init'
import { queueActivatedComponent } from 'core/observer/scheduler'
// import { createFunctionalComponent } from './create-functional-component'

import {
    warn,
    isDef,
    isUndef,
    isTrue,
    isObject
} from '../util/index'

import {
    // resolveAsyncComponent,
    // createAsyncPlaceholder,
    extractPropsFromVNodeData
} from './helpers/index'

import {
    callHook,
    activeInstance,
    updateChildComponent,
    activateChildComponent,
    deactivateChildComponent
} from '../instance/lifecycle'


export function createComponentInstanceForVnode (vnode, parent, parentElm,refElm) {
    // componentOptions：{ Ctor, propsData, listeners, tag, children }
    // 子组件本来的option都在Ctor里
    const vnodeComponentOptions = vnode.componentOptions
    
    // InternalComponentOptions
    const options = {
        _isComponent: true,
        parent,
        propsData: vnodeComponentOptions.propsData,
        _componentTag: vnodeComponentOptions.tag,
        _parentVnode: vnode,
        _parentListeners: vnodeComponentOptions.listeners,
        _renderChildren: vnodeComponentOptions.children,
        _parentElm: parentElm || null,
        _refElm: refElm || null
    }
    // check inline-template render functions
    // const inlineTemplate = vnode.data.inlineTemplate
    // if (isDef(inlineTemplate)) {
    //     options.render = inlineTemplate.render
    //     options.staticRenderFns = inlineTemplate.staticRenderFns
    // }
    
    //new Vue(optons)
    return new vnodeComponentOptions.Ctor(options)
}



// hooks to be invoked on component VNodes during patch
// vue组件的生命周期底层其实就依赖于vnode的生命周期
const componentVNodeHooks = {
    init (vnode, hydrating, parentElm, refElm) {
        if (!vnode.componentInstance || vnode.componentInstance._isDestroyed) {
            //parent  activeInstance   当前活跃实例   父实例 
            const child = vnode.componentInstance = createComponentInstanceForVnode(
                vnode,
                activeInstance,
                parentElm,
                refElm
            )
            child.$mount(hydrating ? vnode.elm : undefined, hydrating)
        } else if (vnode.data.keepAlive) {
            // kept-alive components, treat as a patch
            // 
            // 
            // const mountedNode: any = vnode // work around flow
            // componentVNodeHooks.prepatch(mountedNode, mountedNode)
        }
    },

    prepatch (oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
        const options = vnode.componentOptions
        const child = vnode.componentInstance = oldVnode.componentInstance
        
        //updateChildComponent在lifeCycle中
        updateChildComponent(
            child,
            options.propsData, // updated props
            options.listeners, // updated listeners
            vnode, // new parent vnode
            options.children // new children
        )
    },

    //vue组件的mounted就是在insert中触发的
    insert (vnode: MountedComponentVNode) {
        const { context, componentInstance } = vnode
        if (!componentInstance._isMounted) {
            componentInstance._isMounted = true
            callHook(componentInstance, 'mounted')
        }
        if (vnode.data.keepAlive) {
            if (context._isMounted) {
                // vue-router#1212
                // During updates, a kept-alive component's child components may
                // change, so directly walking the tree here may call activated hooks
                // on incorrect children. Instead we push them into a queue which will
                // be processed after the whole patch process ended.
                queueActivatedComponent(componentInstance)
            } else {
                activateChildComponent(componentInstance, true /* direct */)
            }
        }
    },

    destroy (vnode: MountedComponentVNode) {
        const { componentInstance } = vnode
        if (!componentInstance._isDestroyed) {
            if (!vnode.data.keepAlive) {
                componentInstance.$destroy()
            } else {
                deactivateChildComponent(componentInstance, true /* direct */)
            }
        }
    }
}

const hooksToMerge = Object.keys(componentVNodeHooks)




// data:vnode.data
function mergeHooks (data) {
    if (!data.hook) {
        data.hook = {}
    }
    for (let i = 0; i < hooksToMerge.length; i++) {
        const key = hooksToMerge[i]
        const fromParent = data.hook[key]
        const ours = componentVNodeHooks[key]
        // 手写渲染函数的时候  fromParent 才可能为true吗？
        // 在此给VNodeData挂载四个vnode生命周期函数
        data.hook[key] = fromParent ? mergeHook(ours, fromParent) : ours
    }
}

function mergeHook (one, two) {
    return function (a, b, c, d) {
        one(a, b, c, d)
        two(a, b, c, d)
    }
}


export function createComponent (Ctor, data, context, children, tag) {
    if (isUndef(Ctor)) {
        return
    }

    //context 当前组件实例 
    //_base   当前实例的构造方法Vue
    const baseCtor = context.$options._base

    // plain options object: turn it into a constructor
    //                       此时的Ctor是子组件实例化需要用的Option
    //                       构造子组件自己的Vue构造函数
    if (isObject(Ctor)) {
        Ctor = baseCtor.extend(Ctor)
    }

    //此时Ctor一定是子组件的Vue函数 如果不是则跳出
    if (typeof Ctor !== 'function') {
        // if (process.env.NODE_ENV !== 'production') {
        // warn(`Invalid Component definition: ${String(Ctor)}`, context)
        // }
        // 
        return
    }

    // async component
    // let asyncFactory
    // if (isUndef(Ctor.cid)) {
    //     asyncFactory = Ctor
    //     Ctor = resolveAsyncComponent(asyncFactory, baseCtor, context)
    //     if (Ctor === undefined) {
    //         // return a placeholder node for async component, which is rendered
    //         // as a comment node but preserves all the raw information for the node.
    //         // the information will be used for async server-rendering and hydration.
    //         return createAsyncPlaceholder(
    //             asyncFactory,
    //             data,
    //             context,
    //             children,
    //             tag
    //         )
    //     }
    // }

    data = data || {}

    // resolve constructor options in case global mixins are applied after
    // component constructor creation
    // 核心：这里会再次合并一下vue上的全局的一些指令或则组件或则过滤器到组件的构造函数上
    resolveConstructorOptions(Ctor)

    // transform component v-model data into props & events
    if (isDef(data.model)) {
        transformModel(Ctor.options, data)
    }

    // extract props
    // 获取子组件需要接收的值
    const propsData = extractPropsFromVNodeData(data, Ctor, tag)


    // functional component
    // if (isTrue(Ctor.options.functional)) {
    //     return createFunctionalComponent(Ctor, propsData, data, context, children)
    // }


    // keep listeners
    // 注意！  是data而不是context.$options.data(context.$options.xxx)
    // data是渲染函数里的那个
    const listeners = data.on

    // if (isTrue(Ctor.options.abstract)) {
    //     // abstract components do not keep anything
    //     // other than props & listeners & slot

    //     // work around flow
    //     const slot = data.slot
    //     data = {}
    //     if (slot) {
    //         data.slot = slot
    //     }
    // }

    // merge component management hooks onto the placeholder node
    // 装饰vnode.data
    // vnode.data.hook.init 
    // vnode.data.hook.prepatch
    // vnode.data.hook.insert
    // vnode.data.hook.destroy
    mergeHooks(data)


    // return a placeholder vnode
    const name = Ctor.options.name || tag
    // const vnode = new VNode(
    //     `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    //     data, undefined, undefined, undefined, context,
    //     { Ctor, propsData, listeners, tag, children },
    //     asyncFactory
    //     )
    const vnode = new VNode(`vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
        data, undefined, undefined, undefined, context,
        { Ctor, propsData, listeners, tag, children }
        )
    return vnode
}
// transform component v-model info (value and callback) into
// prop and event handler respectively.
function transformModel (options, data) {
    const prop = (options.model && options.model.prop) || 'value';
    const event = (options.model && options.model.event) || 'input';
    (data.props || (data.props = {}))[prop] = data.model.value
    const on = data.on || (data.on = {})
    if (isDef(on[event])) {
        on[event] = [data.model.callback].concat(on[event])
    } else {
        on[event] = data.model.callback
    }
}
