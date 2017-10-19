/* @flow */

import { callHook, activateChildComponent } from '../instance/lifecycle'


/**
 * Defer a task to execute it asynchronously.
 */
export const nextTick = (function () {
    const callbacks = []
    let pending = false
    let timerFunc

    function nextTickHandler () {
        pending = false
        const copies = callbacks.slice(0)
        callbacks.length = 0
        for (let i = 0; i < copies.length; i++) {
          copies[i]()
        }
    }

    // the nextTick behavior leverages the microtask queue, which can be accessed
    // via either native Promise.then or MutationObserver.
    // MutationObserver has wider support, however it is seriously bugged in
    // UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
    // completely stops working after triggering a few times... so, if native
    // Promise is available, we will use it:
    /* istanbul ignore if */
    if (typeof Promise !== 'undefined' && isNative(Promise)) {
        var p = Promise.resolve()
        var logError = err => { console.error(err) }
        timerFunc = () => {
          p.then(nextTickHandler).catch(logError)
          // in problematic UIWebViews, Promise.then doesn't completely break, but
          // it can get stuck in a weird state where callbacks are pushed into the
          // microtask queue but the queue isn't being flushed, until the browser
          // needs to do some other work, e.g. handle a timer. Therefore we can
          // "force" the microtask queue to be flushed by adding an empty timer.
          if (isIOS) setTimeout(noop)
        }
    } else if (typeof MutationObserver !== 'undefined' && (
        isNative(MutationObserver) ||
        // PhantomJS and iOS 7.x
        MutationObserver.toString() === '[object MutationObserverConstructor]'
    )) {
        // use MutationObserver where native Promise is not available,
        // e.g. PhantomJS IE11, iOS7, Android 4.4
        var counter = 1
        var observer = new MutationObserver(nextTickHandler)
        var textNode = document.createTextNode(String(counter))
        observer.observe(textNode, {
          characterData: true
        })
        timerFunc = () => {
          counter = (counter + 1) % 2
          textNode.data = String(counter)
        }
    } else {
        // fallback to setTimeout
        /* istanbul ignore next */
        timerFunc = () => {
          setTimeout(nextTickHandler, 0)
        }
    }

    return function queueNextTick (cb?: Function, ctx?: Object) {
        let _resolve
        callbacks.push(() => {
          if (cb) {
            try {
              cb.call(ctx)
            } catch (e) {
              handleError(e, ctx, 'nextTick')
            }
          } else if (_resolve) {
            _resolve(ctx)
          }
        })
        if (!pending) {
          pending = true
          timerFunc()
        }
        if (!cb && typeof Promise !== 'undefined') {
          return new Promise((resolve, reject) => {
            _resolve = resolve
          })
        }
    }
})()


export const MAX_UPDATE_COUNT = 100

const queue = []
const activatedChildren = []
let has = {}
let circular = {}

let waiting = false
let flushing = false
let index = 0

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
    index = queue.length = activatedChildren.length = 0
    has = {}
    if (process.env.NODE_ENV !== 'production') {
        circular = {}
    }
    waiting = flushing = false
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
    flushing = true
    let watcher, id

    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child)
    // 2. A component's user watchers are run before its render watcher (because
    //    user watchers are created before the render watcher)
    // 3. If a component is destroyed during a parent component's watcher run,
    //    its watchers can be skipped.
    queue.sort((a, b) => a.id - b.id)

    // do not cache length because more watchers might be pushed
    // as we run existing watchers
    for (index = 0; index < queue.length; index++) {
        watcher = queue[index]
        id = watcher.id
        has[id] = null
        watcher.run()
        // in dev build, check and stop circular updates.
        if (process.env.NODE_ENV !== 'production' && has[id] != null) {
            circular[id] = (circular[id] || 0) + 1
            if (circular[id] > MAX_UPDATE_COUNT) {
                warn(
                  'You may have an infinite update loop ' + (
                    watcher.user
                      ? `in watcher with expression "${watcher.expression}"`
                      : `in a component render function.`
                  ),
                  watcher.vm
                )
                break
            }
        }
    }

    // keep copies of post queues before resetting state
    const activatedQueue = activatedChildren.slice()
    const updatedQueue = queue.slice()

    resetSchedulerState()

    // call component updated and activated hooks
    callActivatedHooks(activatedQueue)
    callUpdatedHooks(updatedQueue)

    // devtool hook
    /* istanbul ignore if */
    // if (devtools && config.devtools) {
    //     devtools.emit('flush')
    // }
}

function callUpdatedHooks (queue) {
    let i = queue.length
    while (i--) {
        const watcher = queue[i]
        const vm = watcher.vm
        if (vm._watcher === watcher && vm._isMounted) {
            callHook(vm, 'updated')
        }
    }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
export function queueActivatedComponent (vm: Component) {
    // setting _inactive to false here so that a render function can
    // rely on checking whether it's in an inactive tree (e.g. router-view)
    vm._inactive = false
    activatedChildren.push(vm)
}

function callActivatedHooks (queue) {
    for (let i = 0; i < queue.length; i++) {
        queue[i]._inactive = true
        activateChildComponent(queue[i], true /* true */)
    }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher (watcher) {
    const id = watcher.id
    if (has[id] == null) {
        has[id] = true
        if (!flushing) {
            queue.push(watcher)
        } else {
            // if already flushing, splice the watcher based on its id
            // if already past its id, it will be run next immediately.
            let i = queue.length - 1
            while (i > index && queue[i].id > watcher.id) {
                i--
            }
            queue.splice(i + 1, 0, watcher)
        }
        // queue the flush
        if (!waiting) {
            waiting = true
            nextTick(flushSchedulerQueue)
        }
    }
}
