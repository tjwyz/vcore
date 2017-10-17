import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'

import config from 'core/config'
import { extend, noop } from 'shared/util'
import { mountComponent } from 'core/instance/lifecycle'
import { devtools, inBrowser, isChrome } from 'core/util/index'

import {
	mustUseProp,
	isReservedTag,
	isReservedAttr,
	getTagNamespace,
	isUnknownElement
} from 'web/util/index'

import { patch } from './vdom/patch'
import platformDirectives from './directives/index'
// import platformComponents from './components/index'

initGlobalAPI(Vue)

// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives)
// extend(Vue.options.components, platformComponents)

// install platform patch function
Vue.prototype.__patch__ =  patch 