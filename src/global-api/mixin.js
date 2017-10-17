/* @flow */

import { mergeOptions } from '../shared/options'

//在此把options挂载到构造函数中
//与new Vue时 传递options效果一致
export function initMixin (Vue) {
	
	Vue.mixin = function (mixin) {
		//Vue.options = ......;
		this.options = mergeOptions(this.options, mixin)
		//链式
		return this
	}
}
