/* @flow */

import { nativeWatch } from './env'
import { set } from '../observer/index'

import {
    ASSET_TYPES,
    LIFECYCLE_HOOKS
} from '../shared/constants'

import {
  extend,
  hasOwn,
  camelize,
  capitalize,
  isBuiltInTag,
  isPlainObject
} from 'shared/util'

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
const strats = {}


/**
 * 默认合并策略
 * 因为是不会对parentVal和childVal进行分解的。
 * 所以默认策略一般用于合并比较简单，不包含函数的属性，例如el。
 */
const defaultStrat = function (parentVal, childVal) {
    return childVal === undefined
    ? parentVal
    : childVal
}


/**
 * Options with restrictions
 */
strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
        'creation with the `new` keyword.'
      )
    }
    return defaultStrat(parent, child)
}



/**
 * Helper that recursively merges two data objects together.
 */
function mergeData (to, from) {
    if (!from) return to
    let key, toVal, fromVal
    const keys = Object.keys(from)

    for (let i = 0; i < keys.length; i++) {
        key = keys[i]
        toVal = to[key]
        fromVal = from[key]
        if (!hasOwn(to, key)) {
            set(to, key, fromVal)
        } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
            mergeData(toVal, fromVal)
        }
    }
    return to
}

/**
 * Data
 * 无论是vm存在与否最后都调用了mergeDataOrFn函数。
 * 1.如果from【childVal】中的某个属性to【parentVal】中也有，保留to中的，什么也不做
 * 2.如果to中没有，将这个属性添加到to中
 * 3.如果to和from中的某个属性值都是对象，则递归调用，进行深度合并。
 * 无论vm存在不存在mergeDataOrFn最终都会调用mergeData函数，将parentVal和childVal合并成最终值。
 * 那么接下来看mergeDataOrFn中对parentVal和childVal做了什么处理。
 */
export function mergeDataOrFn (parentVal,childVal,vm) {
    if (!vm) {
        // in a Vue.extend merge, both should be functions
        if (!childVal) {
            return parentVal
        }
        if (!parentVal) {
            return childVal
        }
        // when parentVal & childVal are both present,
        // we need to return a function that returns the
        // merged result of both functions... no need to
        // check if parentVal is a function here because
        // it has to be a function to pass previous merges.
        return function mergedDataFn () {
            return mergeData(
                typeof childVal === 'function' ? childVal.call(this) : childVal,
                parentVal.call(this)
            )
        }
    } else if (parentVal || childVal) {
        return function mergedInstanceDataFn () {
            // instance merge
            const instanceData = typeof childVal === 'function'
            ? childVal.call(vm)
            : childVal
            
            const defaultData = typeof parentVal === 'function'
            ? parentVal.call(vm)
            : undefined
            
            if (instanceData) {
                return mergeData(instanceData, defaultData)
            } else {
                return defaultData
            }
        }
    }
}
strats.data = function (parentVal,childVal,vm) {
    if (!vm) {
        // in a Vue.extend merge
        if (childVal && typeof childVal !== 'function') {
            // process.env.NODE_ENV !== 'production' && warn(
            // 'The "data" option should be a function ' +
            // 'that returns a per-instance value in component ' +
            // 'definitions.',
            // vm
            // )

            return parentVal
        }
        return mergeDataOrFn.call(this, parentVal, childVal)
    }
    // instance merge
    return mergeDataOrFn(parentVal, childVal, vm)
}
strats.provide = mergeDataOrFn

/**
 * Hooks and props are merged as arrays.
 * 只有父时返回父，只有子时返回数组类型的子。父、子都存在时，将子添加在父的后面返回组合而成的数组。
 * 这也是父子均有钩子函数的时候，先执行父的后执行子的的原因
 * 
 */
function mergeHook (parentVal,childVal) {
    return childVal
    ? parentVal
        ? parentVal.concat(childVal)
        : Array.isArray(childVal)
            ? childVal
            : [childVal]
    : parentVal
}
LIFECYCLE_HOOKS.forEach(hook => {
    strats[hook] = mergeHook
})


/**
 * Assets
 *
 * 将childVal的全部属性通过原型委托在parentVal上。parentVal成为了childVal的原型对象。
 * 所以需要查找某个component、directive、filter，首先会在childVal中查找，如果没有就在其原型对象上查找。
 * 即子组件有就用子组件的，子组件没有向上在父组件中寻找。
 */
function mergeAssets (parentVal, childVal) {
    const res = Object.create(parentVal || null)
    return childVal
    ? extend(res, childVal)
    : res
}
ASSET_TYPES.forEach(function (type) {
    strats[type + 's'] = mergeAssets
})



/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function (parentVal: ?Object, childVal: ?Object): ?Object {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) parentVal = undefined
  if (childVal === nativeWatch) childVal = undefined
  /* istanbul ignore if */
  if (!childVal) return Object.create(parentVal || null)
  if (!parentVal) return childVal
  const ret = {}
  extend(ret, parentVal)
  for (const key in childVal) {
    let parent = ret[key]
    const child = childVal[key]
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    ret[key] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child]
  }
  return ret
}


/**
 * Other object hashes.
 * 这种合并策略的特点就是子会覆盖父。
 * 1.先将parentVal的所有属性扩展给res
 * 2.再将childVal的所有属性扩展给res。
 * 此时，若是parentVal和childVal拥有同名属性的话，子的属性就会覆盖父的。也就是同名方法只会执行子的。
 */
strats.props =
strats.methods =
strats.inject =
strats.computed = function (parentVal, childVal) {
    if (!childVal) return Object.create(parentVal || null)
    if (!parentVal) return childVal
    const ret = Object.create(null)
    extend(ret, parentVal)
    extend(ret, childVal)
    return ret
}



/**
 * Validate component names
 */
function checkComponents (options) {
    // options.components = {
    //     "c-title": obj,
    //     "c-slink": obj
    // };

    for (const key in options.components) {
        const lower = key.toLowerCase()
        if (isBuiltInTag(lower) || isReservedTag(lower)) {
            console.log(
            'Do not use built-in or reserved HTML elements as component ' +
            'id: ' + key
            )
        }
    }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps (options) {
    const props = options.props
    if (!props) return
    
    const res = {}
    let i, val, name
    if (Array.isArray(props)) {
        i = props.length
        while (i--) {
            val = props[i]
            if (typeof val === 'string') {
                name = camelize(val)
                res[name] = { type: null }
            } else if (process.env.NODE_ENV !== 'production') {
                warn('props must be strings when using array syntax.')
            }
        }
    } else if (isPlainObject(props)) {
        for (const key in props) {
            val = props[key]
            name = camelize(key)
            res[name] = isPlainObject(val)
            ? val
            : { type: val }
        }
    }
    options.props = res
}

/**
 * Normalize all injections into Object-based format
 */
function normalizeInject (options) {
    const inject = options.inject
    
    if (Array.isArray(inject)) {
        const normalized = options.inject = {}
        for (let i = 0; i < inject.length; i++) {
            normalized[inject[i]] = inject[i]
        }
    }
}

/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives (options) {
    const dirs = options.directives
    
    if (dirs) {
        for (const key in dirs) {
            const def = dirs[key]
            if (typeof def === 'function') {
                dirs[key] = { bind: def, update: def }
            }
        }
    }
}

/**
 * 入口
 *                           parent         /  child 
 * new Vue(options)          Vue.options    /  param options
 * Vue.extend(extendOptions) Super.options  /  param extendOptions
 * 
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
export function mergeOptions (parent,child,vm) {

    // 组件名不能是 内建组件名(slot/component) / HTML标签名
    checkComponents(child)
    
    //此后child一定是options了
    if (typeof child === 'function') {
        child = child.options
    }
    
    //格式化prop为基于对象的格式
    normalizeProps(child)
    //格式化Inject为基于对象的格式
    normalizeInject(child)
    //格式化directives为对象的格式
    normalizeDirectives(child)

    // 递归的都先ban了...
    // const extendsFrom = child.extends

    // if (extendsFrom) {
    //     parent = mergeOptions(parent, extendsFrom, vm)
    // }

    // if (child.mixins) {
    //     for (let i = 0, l = child.mixins.length; i < l; i++) {
    //         parent = mergeOptions(parent, child.mixins[i], vm)
    //     }
    // }

    // 返回新对象
    const options = {}
    let key
    for (key in parent) {
        mergeField(key)
    }
    for (key in child) {
        if (!hasOwn(parent, key)) {
            mergeField(key)
        }
    }
    // strats绑定处理参数中的各种数据的方法，统一在入口方法mergeOptions中被调用
    function mergeField (key) {
        const strat = strats[key] || defaultStrat
        options[key] = strat(parent[key], child[key], vm, key)
    }
    return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
// export function resolveAsset (
// options: Object,
// type: string,
// id: string,
// warnMissing?: boolean
// ): any {
//   /* istanbul ignore if */
//   if (typeof id !== 'string') {
//     return
//   }
//   const assets = options[type]
//   // check local registration variations first
//   if (hasOwn(assets, id)) return assets[id]
//   const camelizedId = camelize(id)
//   if (hasOwn(assets, camelizedId)) return assets[camelizedId]
//   const PascalCaseId = capitalize(camelizedId)
//   if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
//   // fallback to prototype chain
//   const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
//   if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
//     warn(
//       'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
//       options
//     )
//   }
//   return res
// }
