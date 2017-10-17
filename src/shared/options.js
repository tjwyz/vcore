//Vue.options ==> this.$options

import { isBuiltInTag, isReservedTag } from './util'
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
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
export function mergeOptions (parent,child,vm) {

    // 组件名不能是 内建组件名(slot/component) / HTML标签名
    checkComponents(child)

    if (typeof child === 'function') {
        child = child.options
    }
    //此时child一定是options了
    
    //格式化prop为基于对象的格式
    normalizeProps(child)
    //格式化Inject为基于对象的格式
    normalizeInject(child)
    //格式化directives为对象的格式
    normalizeDirectives(child)

    const extendsFrom = child.extends

    if (extendsFrom) {
        parent = mergeOptions(parent, extendsFrom, vm)
    }

    if (child.mixins) {
        for (let i = 0, l = child.mixins.length; i < l; i++) {
            parent = mergeOptions(parent, child.mixins[i], vm)
        }
    }

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
    function mergeField (key) {
        const strat = strats[key] || defaultStrat
        options[key] = strat(parent[key], child[key], vm, key)
    }
    return options
}