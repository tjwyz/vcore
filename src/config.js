// import {
//   no,
//   noop,
//   identity
// } from 'shared/util'

// import { LIFECYCLE_HOOKS } from 'shared/constants'

// export type Config = {
//   // user
//   optionMergeStrategies: { [key: string]: Function };
//   silent: boolean;
//   productionTip: boolean;
//   performance: boolean;
//   devtools: boolean;
//   errorHandler: ?(err: Error, vm: Component, info: string) => void;
//   warnHandler: ?(msg: string, vm: Component, trace: string) => void;
//   ignoredElements: Array<string>;
//   keyCodes: { [key: string]: number | Array<number> };

//   // platform
//   isReservedTag: (x?: string) => boolean;
//   isReservedAttr: (x?: string) => boolean;
//   parsePlatformTagName: (x: string) => string;
//   isUnknownElement: (x?: string) => boolean;
//   getTagNamespace: (x?: string) => string | void;
//   mustUseProp: (tag: string, type: ?string, name: string) => boolean;

//   // legacy
//   _lifecycleHooks: Array<string>;
// };
/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/)
 */
export function noop (a, b, c) {}

/**
 * Always return false.
 */
export const no = (a, b, c) => false

/**
 * Return same value
 */
export const identity = (_: any) => _

export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated'
]

export default ({
    /**
    * Option merge strategies (used in core/util/options)
    */
    optionMergeStrategies: Object.create(null),

    /**
    * Whether to suppress warnings.
    */
    silent: false,

    /**
    * Show production mode tip message on boot?
    */
    productionTip: process.env.NODE_ENV !== 'production',

    /**
    * Whether to enable devtools
    */
    devtools: process.env.NODE_ENV !== 'production',

    /**
    * Whether to record perf
    */
    performance: false,

    /**
    * Error handler for watcher errors
    */
    errorHandler: null,

    /**
    * Warn handler for watcher warns
    */
    warnHandler: null,

    /**
    * Ignore certain custom elements
    */
    ignoredElements: [],

    /**
    * Custom user key aliases for v-on
    */
    keyCodes: Object.create(null),

    /**
    * Check if a tag is reserved so that it cannot be registered as a
    * component. This is platform-dependent and may be overwritten.
    */
    isReservedTag: no,
    // isReservedTag: false,

    /**
    * Check if an attribute is reserved so that it cannot be used as a component
    * prop. This is platform-dependent and may be overwritten.
    */
    isReservedAttr: no,
    // isReservedTag: false,

    /**
    * Check if a tag is an unknown element.
    * Platform-dependent.
    */
    isUnknownElement: no,
    // isReservedTag: false,

    /**
    * Get the namespace of an element
    */
    getTagNamespace: noop,

    /**
    * Parse the real tag name for the specific platform.
    */
    parsePlatformTagName: identity,

    /**
    * Check if an attribute must be bound using property, e.g. value
    * Platform-dependent.
    */
    mustUseProp: no,
    // mustUseProp: false,

    /**
    * Exposed for legacy reasons
    */
    _lifecycleHooks: LIFECYCLE_HOOKS
})
