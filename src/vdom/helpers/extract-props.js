/* @flow */

import {
  tip,
  hasOwn,
  isDef,
  isUndef,
  hyphenate,
  formatComponentName
} from 'core/util/index'

// data是当前组件的data  也就是父组件的data
// Ctor是刚刚根据父组件component值extend出的子组件构造函数
// tag子组件标签名
// 
// 父组件内 attrs/props 才有资格传递给子组件
export function extractPropsFromVNodeData (data,Ctor,tag) {

    //子组件要接收的值props
    const propOptions = Ctor.options.props
    
    if (isUndef(propOptions)) {
        return
    }

    const res = {}
    const { attrs, props } = data
    if (isDef(attrs) || isDef(props)) {
        for (const key in propOptions) {
            const altKey = hyphenate(key)
            // if (process.env.NODE_ENV !== 'production') {
            // const keyInLowerCase = key.toLowerCase()
            // if (
            //     key !== keyInLowerCase &&
            //     attrs && hasOwn(attrs, keyInLowerCase)
            // ) {
            //     // tip(
            //     //     `Prop "${keyInLowerCase}" is passed to component ` +
            //     //     `${formatComponentName(tag || Ctor)}, but the declared prop name is` +
            //     //     ` "${key}". ` +
            //     //     `Note that HTML attributes are case-insensitive and camelCased ` +
            //     //     `props need to use their kebab-case equivalents when using in-DOM ` +
            //     //     `templates. You should probably use "${altKey}" instead of "${key}".`
            //     // )
            // }
            // }
            checkProp(res, props, key, altKey, true) ||
            checkProp(res, attrs, key, altKey, false)
        }
    }
    return res
}

function checkProp (res, hash, key, altKey, preserve) {
    if (isDef(hash)) {
        if (hasOwn(hash, key)) {
            res[key] = hash[key]
            if (!preserve) {
                delete hash[key]
            }
            return true
        } else if (hasOwn(hash, altKey)) {
            res[key] = hash[altKey]
            if (!preserve) {
                delete hash[altKey]
            }
            return true
        }
    }
    return false
}
