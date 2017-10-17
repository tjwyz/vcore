/* @flow */

import config from '../config'
import VNode, { createEmptyVNode } from './vnode'
import { createComponent } from './create-component'

import {
    warn,
    isDef,
    isUndef,
    isTrue,
    isPrimitive,
    resolveAsset
} from '../util/index'

import {
    normalizeChildren,
    simpleNormalizeChildren
} from './helpers/index'

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

// 万恶之源
export function createElement (context, tag, data, children, normalizationType, alwaysNormalize) {
    //没第二个参数(data)
    if (Array.isArray(data) || isPrimitive(data)) {
        normalizationType = children
        children = data
        data = undefined
    }
    // normalizationType == SIMPLE_NORMALIZE
    if (isTrue(alwaysNormalize)) {
        normalizationType = ALWAYS_NORMALIZE
    }
    return _createElement(context, tag, data, children, normalizationType)
}


export function _createElement (context,tag,data,children,normalizationType) {
    /**
    * 如果存在data.__ob__，说明data是被Observer观察的数据
    * 不能用作虚拟节点的data
    * 需要抛出警告，并返回一个空节点
    * 
    * 被监控的data不能被用作vnode渲染的数据的原因是：
    * data在vnode渲染过程中可能会被改变，这样会触发监控，导致不符合预期的操作
    */
    if (isDef(data) && isDef((data).__ob__)) {
        // process.env.NODE_ENV !== 'production' && warn(
        //   `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
        //   'Always create fresh vnode data objects in each render!',
        //   context
        // )
        return createEmptyVNode()
    }
    // 动态组件
    // object syntax in v-bind
    if (isDef(data) && isDef(data.is)) {
        tag = data.is
    }
    // 当组件的is属性被设置为一个false的值
    // Vue将不会知道要把这个组件渲染成什么
    // 所以渲染一个空节点
    if (!tag) {
        // in case of component :is set to falsy value
        return createEmptyVNode()
    }

    // // warn against non-primitive key
    // if (process.env.NODE_ENV !== 'production' &&
    //     isDef(data) && isDef(data.key) && !isPrimitive(data.key)
    // ) {
    //     warn(
    //       'Avoid using non-primitive value as key, ' +
    //       'use string/number value instead.',
    //       context
    //     )
    // }
    

    // 作用域插槽
    // support single function children as default scoped slot
    // if (Array.isArray(children) &&
    //     typeof children[0] === 'function'
    // ) {
    //     data = data || {}
    //     data.scopedSlots = { default: children[0] }
    //     children.length = 0
    // }

    // 根据normalizationType的值，选择不同的处理children方法
    if (normalizationType === ALWAYS_NORMALIZE) {
        children = normalizeChildren(children)
    } else if (normalizationType === SIMPLE_NORMALIZE) {
        children = simpleNormalizeChildren(children)
    }
    
    let vnode, ns
    // 如果标签名是字符串类型
    if (typeof tag === 'string') {
        let Ctor
        // 获取标签名的命名空间
        // ns = config.getTagNamespace(tag)
        
        // 如果是保留标签,就创建一个这样的vnode
        if (config.isReservedTag(tag)) {
            // platform built-in elements
            vnode = new VNode(config.parsePlatformTagName(tag), data, children, undefined, undefined, context)
        // 如果不是保留标签，那么我们将尝试从vm的components上查找是否有这个标签的定义
        } else if (isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
            //此时的Ctor可能函数  eg:Vue.component(options)  new Vue
            //此时存在Vue.options.components就是构造函数形式的

            // 此时的Ctor是子组件实例化需要用的Option 对象
            vnode = createComponent(Ctor, data, context, children, tag)
        } else {
            // 兜底方案，正常创建一个vnode
            vnode = new VNode(tag, data, children,undefined, undefined, context)
        }
    } else {
        // 当tag不是字符串的时候，我们认为tag是组件的构造类
        // 所以直接创建
        vnode = createComponent(tag, data, context, children)
    }

    
    if (isDef(vnode)) {
        // if (ns) applyNS(vnode, ns)
        return vnode
    } else {
        return createEmptyVNode()
    }
}

// function applyNS (vnode, ns) {
//     vnode.ns = ns
//     if (vnode.tag === 'foreignObject') {
//         // use default namespace inside foreignObject
//         return
//     }
//     if (isDef(vnode.children)) {
//         for (let i = 0, l = vnode.children.length; i < l; i++) {
//             const child = vnode.children[i]
//             if (isDef(child.tag) && isUndef(child.ns)) {
//                 applyNS(child, ns)
//             }
//         }
//     }
// }
