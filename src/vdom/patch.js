/* @flow */

import * as nodeOps from './node-ops'
import { createPatchFunction } from './patchFun'
import baseModules from './modulesBase/index'
import platformModules from './modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)

export const patch = createPatchFunction({ nodeOps, modules })
