/* @flow */

import config from '../config'
import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject } from '../shared/util'

export function initAssetRegisters (Vue) {
  /**
   * Create asset registration methods.
   */
    ASSET_TYPES.forEach(type => {
        
        //可不是 Vue[type+'s']
        Vue[type] = function (id, definition) {
            // definition 希望是个对象

            // set   definition == set
            // unset definition == get
            if (!definition) {
                return this.options[type + 's'][id]
            } else {
                /* istanbul ignore if */
                // if (process.env.NODE_ENV !== 'production') {
                //     if (type === 'component' && config.isReservedTag(id)) {
                //         warn(
                //         'Do not use built-in or reserved HTML elements as component ' +
                //         'id: ' + id
                //         )
                //     }
                // }
                if (type === 'component' && isPlainObject(definition)) {
                    // 优先用组件内部的name 再用 New Vue 参数中components的key
                    // Vue.component('App', {
                    //      name:''
                    //      props: ['size', 'myMessage']
                    // })
                    // new Vue()
                    // -------------------------------------
                    // a = Vue.extend({
                    //    component:{
                    //      App:{
                    //          name:''
                    //          props: ['size', 'myMessage']
                    //      }
                    //    }
                    // })
                    // new a()
                    // -------------------------------------
                    // var vm = new Vue({
                    //     el: $(el)[0],
                    //     components: {
                    //         App: App
                    //     },
                    //     data: data
                    // });
                    // App = {
                    //      name:''
                    //      props: ['size', 'myMessage']
                    // })
                    
                    definition.name = definition.name || id
                    // this.options._base  == Vue.options._base == Vue == this
                    definition = this.options._base.extend(definition)
                }
                if (type === 'directive' && typeof definition === 'function') {
                    definition = { bind: definition, update: definition }
                }

                //真正有效的逻辑
                this.options[type + 's'][id] = definition
                return definition
            }
        }
    })
}
