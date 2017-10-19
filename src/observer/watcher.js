/* @flow */

import { queueWatcher } from './scheduler'
import Dep, { pushTarget, popTarget } from './dep'

import {
  remove,
  isObject,
} from '../util/index'

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
    constructor (vm, expOrFn, cb, options) {
        //vm:vue实例
        this.vm = vm
        vm._watchers.push(this)

        
        // options
        if (options) {
            this.deep = !!options.deep
            this.user = !!options.user
            this.lazy = !!options.lazy
            this.sync = !!options.sync
        } else {
            this.deep = this.user = this.lazy = this.sync = false
        }
        this.cb = cb
        this.id = ++uid // uid for batching
        this.active = true
        this.dirty = this.lazy // for lazy watchers
        this.deps = []
        this.newDeps = []
        // this.depIds = new Set()
        // this.newDepIds = new Set()
        // this.expression = expOrFn.toString()
        // parse expression for getter
        if (typeof expOrFn === 'function') {
            this.getter = expOrFn
        } else {
            // this.getter = parsePath(expOrFn)
                this.getter = function () {
                    let temp
                    temp = this[expOrFn]
                    return temp
                }
                // process.env.NODE_ENV !== 'production' && warn(
                //     `Failed watching path: "${expOrFn}" ` +
                //     'Watcher only accepts simple dot-delimited paths. ' +
                //     'For full control, use a function instead.',
                //     vm
                // )
        }
        //初始化
        this.value = this.lazy
        ? undefined
        : this.get()
    }

    /**
    * Evaluate the getter, and re-collect dependencies.
    * get只在初始化时使用
    * 调用caller并收集watcher后清空Dep.target
    * 后续再怎么使用this._data.xxx this._prop_xxx 都没事儿了
    * 因为Dep.target没了
    */
    get () {
        pushTarget(this)
        let value
        const vm = this.vm
        try {
            value = this.getter.call(vm, vm)
        } catch (e) {
            console.log(e)
        } finally {
            // "touch" every property so they are all tracked as
            // dependencies for deep watching
            // if (this.deep) {
            //     traverse(value)
            // }
            popTarget()
            // this.cleanupDeps()
        }
        return value
    }

    /**
    * Add a dependency to this directive.
    */
    addDep (dep) {
        // const id = dep.id
        // if (!this.newDepIds.has(id)) {
        //     this.newDepIds.add(id)
        //     this.newDeps.push(dep)
        //     if (!this.depIds.has(id)) {
                dep.addSub(this)
            // }
        }
    }

    /**
    * Clean up for dependency collection.
    */
    // cleanupDeps () {
    //     let i = this.deps.length
    //     while (i--) {
    //         const dep = this.deps[i]
    //         if (!this.newDepIds.has(dep.id)) {
    //             dep.removeSub(this)
    //         }
    //     }
    //     let tmp = this.depIds
    //     this.depIds = this.newDepIds
    //     this.newDepIds = tmp
    //     this.newDepIds.clear()
    //     tmp = this.deps
    //     this.deps = this.newDeps
    //     this.newDeps = tmp
    //     this.newDeps.length = 0
    // }

    /**
    * Subscriber interface.
    * Will be called when a dependency changes.
    */
    update () {
        /* istanbul ignore else */
        if (this.lazy) {
            this.dirty = true
        } else if (this.sync) {
            //立刻执行
            this.run()
        } else {
            //nextTick
            // queueWatcher(this)
            // 暂时先立即执行
            this.run()
        }
    }

    /**
    * Scheduler job interface.
    * Will be called by the scheduler.
    */
    run () {
        if (this.active) {
            const value = this.get()
            if (
                value !== this.value ||
                // Deep watchers and watchers on Object/Arrays should fire even
                // when the value is the same, because the value may
                // have mutated.
                isObject(value) ||
                this.deep
            ) {
                // set new value
                const oldValue = this.value
                this.value = value
                this.cb && this.cb.call(this.vm, value, oldValue)
            }
        }
    }

    /**
    * Evaluate the value of the watcher.
    * This only gets called for lazy watchers.
    */
    // evaluate () {
    //     this.value = this.get()
    //     this.dirty = false
    // }

    /**
    * Depend on all deps collected by this watcher.
    */
    // depend () {
    //     let i = this.deps.length
    //     while (i--) {
    //         this.deps[i].depend()
    //     }
    // }

    /**
    * Remove self from all dependencies' subscriber list.
    */
    // teardown () {
    //     if (this.active) {
    //         // remove self from vm's watcher list
    //         // this is a somewhat expensive operation so we skip it
    //         // if the vm is being destroyed.
    //         if (!this.vm._isBeingDestroyed) {
    //             remove(this.vm._watchers, this)
    //         }
    //         let i = this.deps.length
    //         while (i--) {
    //             this.deps[i].removeSub(this)
    //         }
    //         this.active = false
    //     }
    // }
}

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
// const seenObjects = new Set()
// function traverse (val: any) {
//     seenObjects.clear()
//     _traverse(val, seenObjects)
// }

// function _traverse (val: any, seen: ISet) {
//     let i, keys
//     const isA = Array.isArray(val)
//     if ((!isA && !isObject(val)) || !Object.isExtensible(val)) {
//         return
//     }
//     if (val.__ob__) {
//         const depId = val.__ob__.dep.id
//         if (seen.has(depId)) {
//             return
//         }
//         seen.add(depId)
//     }
//     if (isA) {
//         i = val.length
//         while (i--) _traverse(val[i], seen)
//     } else {
//         keys = Object.keys(val)
//         i = keys.length
//         while (i--) _traverse(val[keys[i]], seen)
//     }
// }
