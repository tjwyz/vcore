import { renderMixin } from './render'

function Vue (options) {
	this._init(options)
}

renderMixin(Vue)

export default Vue
