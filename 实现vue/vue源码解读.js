var config = ({
	/**
	 * Option merge strategies (used in core/util/options)
	 */
	// $flow-disable-line
	optionMergeStrategies: Object.create(null),

	/**
	 * Whether to suppress warnings.
	 */
	silent: false,

	/**
	 * Show production mode tip message on boot?
	 */
	productionTip: "development" !== 'production',

	/**
	 * Whether to enable devtools
	 */
	devtools: "development" !== 'production',

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
	// $flow-disable-line
	keyCodes: Object.create(null),

	/**
	 * Check if a tag is reserved so that it cannot be registered as a
	 * component. This is platform-dependent and may be overwritten.
	 */
	isReservedTag: no,

	/**
	 * Check if an attribute is reserved so that it cannot be used as a component
	 * prop. This is platform-dependent and may be overwritten.
	 */
	isReservedAttr: no,

	/**
	 * Check if a tag is an unknown element.
	 * Platform-dependent.
	 */
	isUnknownElement: no,

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

	/**
	 * Perform updates asynchronously. Intended to be used by Vue Test Utils
	 * This will significantly reduce performance if set to false.
	 */
	async: true,

	/**
	 * Exposed for legacy reasons
	 */
	_lifecycleHooks: LIFECYCLE_HOOKS
});

function Vue(options) {
	if (!(this instanceof Vue)
	) {
		warn('Vue is a constructor and should be called with the `new` keyword');
	}
	this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

function initMixin(Vue) {
	Vue.prototype._init = function (options) {
		var vm = this;
		// a uid
		vm._uid = uid$3++;

		var startTag, endTag;
		/* istanbul ignore if */
		if (config.performance && mark) {
			startTag = "vue-perf-start:" + (vm._uid);
			endTag = "vue-perf-end:" + (vm._uid);
			mark(startTag);
		}

		// a flag to avoid this being observed
		vm._isVue = true;
		// merge options
		if (options && options._isComponent) {
			// optimize internal component instantiation
			// since dynamic options merging is pretty slow, and none of the
			// internal component options needs special treatment.
			initInternalComponent(vm, options);
		} else {
			vm.$options = mergeOptions(
				resolveConstructorOptions(vm.constructor),
				options || {},
				vm
			);
		}
		/* istanbul ignore else */
		{
			initProxy(vm);
		}
		// expose real self
		vm._self = vm;
		initLifecycle(vm);
		initEvents(vm);
		initRender(vm);
		callHook(vm, 'beforeCreate');
		initInjections(vm); // resolve injections before data/props
		initState(vm);
		initProvide(vm); // resolve provide after data/props
		callHook(vm, 'created');

		/* istanbul ignore if */
		if (config.performance && mark) {
			vm._name = formatComponentName(vm, false);
			mark(endTag);
			measure(("vue " + (vm._name) + " init"), startTag, endTag);
		}

		if (vm.$options.el) {
			vm.$mount(vm.$options.el);
		}
	};
}

function stateMixin(Vue) {
	// flow somehow has problems with directly declared definition object
	// when using Object.defineProperty, so we have to procedurally build up
	// the object here.
	var dataDef = {};
	dataDef.get = function () { return this._data };
	var propsDef = {};
	propsDef.get = function () { return this._props };
	{
		dataDef.set = function () {
			warn(
				'Avoid replacing instance root $data. ' +
				'Use nested data properties instead.',
				this
			);
		};
		propsDef.set = function () {
			warn("$props is readonly.", this);
		};
	}
	Object.defineProperty(Vue.prototype, '$data', dataDef);
	Object.defineProperty(Vue.prototype, '$props', propsDef);

	Vue.prototype.$set = set;
	Vue.prototype.$delete = del;

	Vue.prototype.$watch = function (
		expOrFn,
		cb,
		options
	) {
		var vm = this;
		if (isPlainObject(cb)) {
			return createWatcher(vm, expOrFn, cb, options)
		}
		options = options || {};
		options.user = true;
		var watcher = new Watcher(vm, expOrFn, cb, options);
		if (options.immediate) {
			try {
				cb.call(vm, watcher.value);
			} catch (error) {
				handleError(error, vm, ("callback for immediate watcher \"" + (watcher.expression) + "\""));
			}
		}
		return function unwatchFn() {
			watcher.teardown();
		}
	};
}

function eventsMixin (Vue) {
	var hookRE = /^hook:/;
	Vue.prototype.$on = function (event, fn) {
		var vm = this;
		if (Array.isArray(event)) {
			for (var i = 0, l = event.length; i < l; i++) {
				vm.$on(event[i], fn);
			}
		} else {
			(vm._events[event] || (vm._events[event] = [])).push(fn);
			// optimize hook:event cost by using a boolean flag marked at registration
			// instead of a hash lookup
			if (hookRE.test(event)) {
				vm._hasHookEvent = true;
			}
		}
		return vm
	};

	Vue.prototype.$once = function (event, fn) {
		var vm = this;
		function on () {
			vm.$off(event, on);
			fn.apply(vm, arguments);
		}
		on.fn = fn;
		vm.$on(event, on);
		return vm
	};

	Vue.prototype.$off = function (event, fn) {
		var vm = this;
		// all
		if (!arguments.length) {
			vm._events = Object.create(null);
			return vm
		}
		// array of events
		if (Array.isArray(event)) {
			for (var i$1 = 0, l = event.length; i$1 < l; i$1++) {
				vm.$off(event[i$1], fn);
			}
			return vm
		}
		// specific event
		var cbs = vm._events[event];
		if (!cbs) {
			return vm
		}
		if (!fn) {
			vm._events[event] = null;
			return vm
		}
		// specific handler
		var cb;
		var i = cbs.length;
		while (i--) {
			cb = cbs[i];
			if (cb === fn || cb.fn === fn) {
				cbs.splice(i, 1);
				break
			}
		}
		return vm
	};

	Vue.prototype.$emit = function (event) {
		var vm = this;
		{
			var lowerCaseEvent = event.toLowerCase();
			if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
				tip(
					"Event \"" + lowerCaseEvent + "\" is emitted in component " +
					(formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
					"Note that HTML attributes are case-insensitive and you cannot use " +
					"v-on to listen to camelCase events when using in-DOM templates. " +
					"You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
				);
			}
		}
		var cbs = vm._events[event];
		if (cbs) {
			cbs = cbs.length > 1 ? toArray(cbs) : cbs;
			var args = toArray(arguments, 1);
			var info = "event handler for \"" + event + "\"";
			for (var i = 0, l = cbs.length; i < l; i++) {
				invokeWithErrorHandling(cbs[i], vm, args, vm, info);
			}
		}
		return vm
	};
}

function lifecycleMixin (Vue) {
	Vue.prototype._update = function (vnode, hydrating) {
		var vm = this;
		var prevEl = vm.$el;
		var prevVnode = vm._vnode;
		var restoreActiveInstance = setActiveInstance(vm);
		vm._vnode = vnode;
		// Vue.prototype.__patch__ is injected in entry points
		// based on the rendering backend used.
		if (!prevVnode) {
			// initial render
			vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
		} else {
			// updates
			vm.$el = vm.__patch__(prevVnode, vnode);
		}
		restoreActiveInstance();
		// update __vue__ reference
		if (prevEl) {
			prevEl.__vue__ = null;
		}
		if (vm.$el) {
			vm.$el.__vue__ = vm;
		}
		// if parent is an HOC, update its $el as well
		if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
			vm.$parent.$el = vm.$el;
		}
		// updated hook is called by the scheduler to ensure that children are
		// updated in a parent's updated hook.
	};

	Vue.prototype.$forceUpdate = function () {
		var vm = this;
		if (vm._watcher) {
			vm._watcher.update();
		}
	};

	Vue.prototype.$destroy = function () {
		var vm = this;
		if (vm._isBeingDestroyed) {
			return
		}
		callHook(vm, 'beforeDestroy');
		vm._isBeingDestroyed = true;
		// remove self from parent
		var parent = vm.$parent;
		if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
			remove(parent.$children, vm);
		}
		// teardown watchers
		if (vm._watcher) {
			vm._watcher.teardown();
		}
		var i = vm._watchers.length;
		while (i--) {
			vm._watchers[i].teardown();
		}
		// remove reference from data ob
		// frozen object may not have observer.
		if (vm._data.__ob__) {
			vm._data.__ob__.vmCount--;
		}
		// call the last hook...
		vm._isDestroyed = true;
		// invoke destroy hooks on current rendered tree
		vm.__patch__(vm._vnode, null);
		// fire destroyed hook
		callHook(vm, 'destroyed');
		// turn off all instance listeners.
		vm.$off();
		// remove __vue__ reference
		if (vm.$el) {
			vm.$el.__vue__ = null;
		}
		// release circular reference (#6759)
		if (vm.$vnode) {
			vm.$vnode.parent = null;
		}
	};
}

function renderMixin (Vue) {
	// install runtime convenience helpers
	installRenderHelpers(Vue.prototype);

	Vue.prototype.$nextTick = function (fn) {
		return nextTick(fn, this)
	};

	Vue.prototype._render = function () {
		var vm = this;
		var ref = vm.$options;
		var render = ref.render;
		var _parentVnode = ref._parentVnode;

		if (_parentVnode) {
			vm.$scopedSlots = normalizeScopedSlots(
				_parentVnode.data.scopedSlots,
				vm.$slots,
				vm.$scopedSlots
			);
		}

		// set parent vnode. this allows render functions to have access
		// to the data on the placeholder node.
		vm.$vnode = _parentVnode;
		// render self
		var vnode;
		try {
			// There's no need to maintain a stack becaues all render fns are called
			// separately from one another. Nested component's render fns are called
			// when parent component is patched.
			currentRenderingInstance = vm;
			vnode = render.call(vm._renderProxy, vm.$createElement);
		} catch (e) {
			handleError(e, vm, "render");
			// return error render result,
			// or previous vnode to prevent render error causing blank component
			/* istanbul ignore else */
			if (vm.$options.renderError) {
				try {
					vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
				} catch (e) {
					handleError(e, vm, "renderError");
					vnode = vm._vnode;
				}
			} else {
				vnode = vm._vnode;
			}
		} finally {
			currentRenderingInstance = null;
		}
		// if the returned array contains only a single node, allow it
		if (Array.isArray(vnode) && vnode.length === 1) {
			vnode = vnode[0];
		}
		// return empty vnode in case the render function errored out
		if (!(vnode instanceof VNode)) {
			if (Array.isArray(vnode)) {
				warn(
					'Multiple root nodes returned from render function. Render function ' +
					'should return a single root node.',
					vm
				);
			}
			vnode = createEmptyVNode();
		}
		// set parent
		vnode.parent = _parentVnode;
		return vnode
	};
}

/*  */
function initRender (vm) {
	vm._vnode = null; // the root of the child tree
	vm._staticTrees = null; // v-once cached trees
	var options = vm.$options;
	var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
	var renderContext = parentVnode && parentVnode.context;
	vm.$slots = resolveSlots(options._renderChildren, renderContext);
	vm.$scopedSlots = emptyObject;
	// bind the createElement fn to this instance
	// so that we get proper render context inside it.
	// args order: tag, data, children, normalizationType, alwaysNormalize
	// internal version is used by render functions compiled from templates
	vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
	// normalization is always applied for the public version, used in
	// user-written render functions.
	vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

	// $attrs & $listeners are exposed for easier HOC creation.
	// they need to be reactive so that HOCs using them are always updated
	var parentData = parentVnode && parentVnode.data;

	/* istanbul ignore else */
	{
		defineReactive$$1(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
			!isUpdatingChildComponent && warn("$attrs is readonly.", vm);
		}, true);
		defineReactive$$1(vm, '$listeners', options._parentListeners || emptyObject, function () {
			!isUpdatingChildComponent && warn("$listeners is readonly.", vm);
		}, true);
	}
}

function initInjections (vm) {
	var result = resolveInject(vm.$options.inject, vm);
	if (result) {
		toggleObserving(false);
		Object.keys(result).forEach(function (key) {
			/* istanbul ignore else */
			{
				defineReactive$$1(vm, key, result[key], function () {
					warn(
						"Avoid mutating an injected value directly since the changes will be " +
						"overwritten whenever the provided component re-renders. " +
						"injection being mutated: \"" + key + "\"",
						vm
					);
				});
			}
		});
		toggleObserving(true);
	}
}

function initState(vm) {
    vm._watchers = [];
    var opts = vm.$options;
    if (opts.props) { initProps(vm, opts.props); }
    if (opts.methods) { initMethods(vm, opts.methods); }
    if (opts.data) {
        initData(vm);
    } else {
        observe(vm._data = {}, true /* asRootData */);
    }
    if (opts.computed) { initComputed(vm, opts.computed); }
    if (opts.watch && opts.watch !== nativeWatch) {
        initWatch(vm, opts.watch);
    }
}

// public mount method // vm实例创建完成, 挂载到dom元素上
Vue.prototype.$mount = function (
	el,
	hydrating
) {
	el = el && inBrowser ? query(el) : undefined;
	return mountComponent(this, el, hydrating)
};

function mountComponent (
	vm,
	el,
	hydrating
) {
	vm.$el = el;
	if (!vm.$options.render) {
		vm.$options.render = createEmptyVNode;
		{
			/* istanbul ignore if */
			if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
				vm.$options.el || el) {
				warn(
					'You are using the runtime-only build of Vue where the template ' +
					'compiler is not available. Either pre-compile the templates into ' +
					'render functions, or use the compiler-included build.',
					vm
				);
			} else {
				warn(
					'Failed to mount component: template or render function not defined.',
					vm
				);
			}
		}
	}
	callHook(vm, 'beforeMount');

	var updateComponent;
	/* istanbul ignore if */
	if (config.performance && mark) {
		updateComponent = function () {
			var name = vm._name;
			var id = vm._uid;
			var startTag = "vue-perf-start:" + id;
			var endTag = "vue-perf-end:" + id;

			mark(startTag);
			var vnode = vm._render();
			mark(endTag);
			measure(("vue " + name + " render"), startTag, endTag);

			mark(startTag);
			vm._update(vnode, hydrating);
			mark(endTag);
			measure(("vue " + name + " patch"), startTag, endTag);
		};
	} else {
		updateComponent = function () {
			vm._update(vm._render(), hydrating);
		};
	}

	// we set this to vm._watcher inside the watcher's constructor
	// since the watcher's initial patch may call $forceUpdate (e.g. inside child
	// component's mounted hook), which relies on vm._watcher being already defined
	new Watcher(vm, updateComponent, noop, {
		before: function before () {
			if (vm._isMounted && !vm._isDestroyed) {
				callHook(vm, 'beforeUpdate');
			}
		}
	}, true /* isRenderWatcher */);
	hydrating = false;

	// manually mounted instance, call mounted on self
	// mounted is called for render-created child components in its inserted hook
	if (vm.$vnode == null) {
		vm._isMounted = true;
		callHook(vm, 'mounted');
	}
	return vm
}

function initProps(vm, propsOptions) {
    var propsData = vm.$options.propsData || {};
    var props = vm._props = {};
    // cache prop keys so that future props updates can iterate using Array
    // instead of dynamic object key enumeration.
    var keys = vm.$options._propKeys = [];
    var isRoot = !vm.$parent;
    // root instance props should be converted
    if (!isRoot) {
        toggleObserving(false);
    }
    var loop = function (key) {
        keys.push(key);
        var value = validateProp(key, propsOptions, propsData, vm);
        /* istanbul ignore else */
        {
            var hyphenatedKey = hyphenate(key);
            if (isReservedAttribute(hyphenatedKey) ||
                config.isReservedAttr(hyphenatedKey)) {
                warn(
                    ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
                    vm
                );
            }
            defineReactive$$1(props, key, value, function () {
                if (!isRoot && !isUpdatingChildComponent) {
                    warn(
                        "Avoid mutating a prop directly since the value will be " +
                        "overwritten whenever the parent component re-renders. " +
                        "Instead, use a data or computed property based on the prop's " +
                        "value. Prop being mutated: \"" + key + "\"",
                        vm
                    );
                }
            });
        }
        // static props are already proxied on the component's prototype
        // during Vue.extend(). We only need to proxy props defined at
        // instantiation here.
        if (!(key in vm)) {
            proxy(vm, "_props", key);
        }
    };

    for (var key in propsOptions) loop(key);
    toggleObserving(true);
}

// observe data
function initData(vm) {
    var data = vm.$options.data;
    data = vm._data = typeof data === 'function'
        ? getData(data, vm)
        : data || {};
    if (!isPlainObject(data)) {
        data = {};
        warn(
            'data functions should return an object:\n' +
            'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
            vm
        );
    }
    // proxy data on instance
    var keys = Object.keys(data);
    var props = vm.$options.props;
    var methods = vm.$options.methods;
    var i = keys.length;
    while (i--) {
        var key = keys[i];
        {
            if (methods && hasOwn(methods, key)) {
                warn(
                    ("Method \"" + key + "\" has already been defined as a data property."),
                    vm
                );
            }
        }
        if (props && hasOwn(props, key)) {
            warn(
                "The data property \"" + key + "\" is already declared as a prop. " +
                "Use prop default value instead.",
                vm
            );
        } else if (!isReserved(key)) {
            proxy(vm, "_data", key);
        }
    }
    // observe data
    observe(data, true /* asRootData */);
}

function getData(data, vm) {
    // #7573 disable dep collection when invoking data getters
    pushTarget();
    try {
        return data.call(vm, vm)
    } catch (e) {
        handleError(e, vm, "data()");
        return {}
    } finally {
        popTarget();
    }
}

function initComputed(vm, computed) {
    // $flow-disable-line
    var watchers = vm._computedWatchers = Object.create(null);
    // computed properties are just getters during SSR
    var isSSR = isServerRendering();

    for (var key in computed) {
        var userDef = computed[key];
        var getter = typeof userDef === 'function' ? userDef : userDef.get;
        if (getter == null) {
            warn(
                ("Getter is missing for computed property \"" + key + "\"."),
                vm
            );
        }

        if (!isSSR) {
            // create internal watcher for the computed property.
            watchers[key] = new Watcher(
                vm,
                getter || noop,
                noop,
                computedWatcherOptions
            );
        }

        // component-defined computed properties are already defined on the
        // component prototype. We only need to define computed properties defined
        // at instantiation here.
        if (!(key in vm)) {
            defineComputed(vm, key, userDef);
        } else {
            if (key in vm.$data) {
                warn(("The computed property \"" + key + "\" is already defined in data."), vm);
            } else if (vm.$options.props && key in vm.$options.props) {
                warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
            }
        }
    }
}

function defineComputed(
    target,
    key,
    userDef
) {
    var shouldCache = !isServerRendering();
    if (typeof userDef === 'function') {
        sharedPropertyDefinition.get = shouldCache
            ? createComputedGetter(key)
            : createGetterInvoker(userDef);
        sharedPropertyDefinition.set = noop;
    } else {
        sharedPropertyDefinition.get = userDef.get
            ? shouldCache && userDef.cache !== false
                ? createComputedGetter(key)
                : createGetterInvoker(userDef.get)
            : noop;
        sharedPropertyDefinition.set = userDef.set || noop;
    }
    if (sharedPropertyDefinition.set === noop) {
        sharedPropertyDefinition.set = function () {
            warn(
                ("Computed property \"" + key + "\" was assigned to but it has no setter."),
                this
            );
        };
    }
    Object.defineProperty(target, key, sharedPropertyDefinition);
}

function createComputedGetter(key) {
    return function computedGetter() {
        var watcher = this._computedWatchers && this._computedWatchers[key];
        if (watcher) {
            if (watcher.dirty) {
                watcher.evaluate();
            }
            if (Dep.target) {
                watcher.depend();
            }
            return watcher.value
        }
    }
}

function createGetterInvoker(fn) {
    return function computedGetter() {
        return fn.call(this, this)
    }
}

function initMethods(vm, methods) {
    var props = vm.$options.props;
    for (var key in methods) {
        {
            if (typeof methods[key] !== 'function') {
                warn(
                    "Method \"" + key + "\" has type \"" + (typeof methods[key]) + "\" in the component definition. " +
                    "Did you reference the function correctly?",
                    vm
                );
            }
            if (props && hasOwn(props, key)) {
                warn(
                    ("Method \"" + key + "\" has already been defined as a prop."),
                    vm
                );
            }
            if ((key in vm) && isReserved(key)) {
                warn(
                    "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
                    "Avoid defining component methods that start with _ or $."
                );
            }
        }
        vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm);
    }
}

function initWatch(vm, watch) {
    for (var key in watch) {
        var handler = watch[key];
        if (Array.isArray(handler)) {
            for (var i = 0; i < handler.length; i++) {
                createWatcher(vm, key, handler[i]);
            }
        } else {
            createWatcher(vm, key, handler);
        }
    }
}

function createWatcher (
    vm,
    expOrFn,
    handler,
    options
) {
    if (isPlainObject(handler)) {
        options = handler;
        handler = handler.handler;
    }
    if (typeof handler === 'string') {
        handler = vm[handler];
    }
    return vm.$watch(expOrFn, handler, options)
}

function initInternalComponent(vm, options) {
    var opts = vm.$options = Object.create(vm.constructor.options);
    // doing this because it's faster than dynamic enumeration.
    var parentVnode = options._parentVnode;
    opts.parent = options.parent;
    opts._parentVnode = parentVnode;

    var vnodeComponentOptions = parentVnode.componentOptions;
    opts.propsData = vnodeComponentOptions.propsData;
    opts._parentListeners = vnodeComponentOptions.listeners;
    opts._renderChildren = vnodeComponentOptions.children;
    opts._componentTag = vnodeComponentOptions.tag;

    if (options.render) {
        opts.render = options.render;
        opts.staticRenderFns = options.staticRenderFns;
    }
}

function resolveConstructorOptions(Ctor) {
    var options = Ctor.options;
    if (Ctor.super) {
        var superOptions = resolveConstructorOptions(Ctor.super);
        var cachedSuperOptions = Ctor.superOptions;
        if (superOptions !== cachedSuperOptions) {
            // super option changed,
            // need to resolve new options.
            Ctor.superOptions = superOptions;
            // check if there are any late-modified/attached options (#4976)
            var modifiedOptions = resolveModifiedOptions(Ctor);
            // update base extend options
            if (modifiedOptions) {
                extend(Ctor.extendOptions, modifiedOptions);
            }
            options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
            if (options.name) {
                options.components[options.name] = Ctor;
            }
        }
    }
    return options
}

function resolveModifiedOptions(Ctor) {
    var modified;
    var latest = Ctor.options;
    var sealed = Ctor.sealedOptions;
    for (var key in latest) {
        if (latest[key] !== sealed[key]) {
            if (!modified) { modified = {}; }
            modified[key] = latest[key];
        }
    }
    return modified
}


/**
 * Define a property.
 */
function def(obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true
    });
}


/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
var Dep = function Dep() {
    this.id = uid++;
    this.subs = [];
};

Dep.prototype.addSub = function addSub(sub) {
    this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub(sub) {
    remove(this.subs, sub);
};

Dep.prototype.depend = function depend() {
    if (Dep.target) {
        Dep.target.addDep(this);
    }
};

Dep.prototype.notify = function notify() {
    // stabilize the subscriber list first
    var subs = this.subs.slice();
    if (!config.async) {
        // subs aren't sorted in scheduler if not running async
        // we need to sort them now to make sure they fire in correct
        // order
        subs.sort(function (a, b) { return a.id - b.id; });
    }
    for (var i = 0, l = subs.length; i < l; i++) {
        subs[i].update();
    }
};

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null;
var targetStack = [];

function pushTarget(target) {
    targetStack.push(target);
    Dep.target = target;
}

function popTarget() {
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
}


/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
var Observer = function Observer(value) {
    this.value = value;
    this.dep = new Dep();
    this.vmCount = 0;
    def(value, '__ob__', this);
    if (Array.isArray(value)) {
        if (hasProto) {
            protoAugment(value, arrayMethods);
        } else {
            copyAugment(value, arrayMethods, arrayKeys);
        }
        this.observeArray(value);
    } else {
        this.walk(value);
    }
};

/**
 * Walk through all properties and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 */
Observer.prototype.walk = function walk(obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        defineReactive$$1(obj, keys[i]);
    }
};

/**
 * Observe a list of Array items.
 */
Observer.prototype.observeArray = function observeArray(items) {
    for (var i = 0, l = items.length; i < l; i++) {
        observe(items[i]);
    }
};

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
function observe (value, asRootData) {
	if (!isObject(value) || value instanceof VNode) {
		return
	}
	var ob;
	if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
		ob = value.__ob__;
	} else if (
		shouldObserve &&
		!isServerRendering() &&
		(Array.isArray(value) || isPlainObject(value)) &&
		Object.isExtensible(value) &&
		!value._isVue
	) {
		ob = new Observer(value);
	}
	if (asRootData && ob) {
		ob.vmCount++;
	}
	return ob
}

/**
 * Define a reactive property on an Object.
 */
function defineReactive$$1 (
	obj,
	key,
	val,
	customSetter,
	shallow
) {
	var dep = new Dep();

	var property = Object.getOwnPropertyDescriptor(obj, key);
	if (property && property.configurable === false) {
		return
	}

	// cater for pre-defined getter/setters
	var getter = property && property.get;
	var setter = property && property.set;
	if ((!getter || setter) && arguments.length === 2) {
		val = obj[key];
	}

	var childOb = !shallow && observe(val);
	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,
		get: function reactiveGetter () {
			var value = getter ? getter.call(obj) : val;
			if (Dep.target) {
				dep.depend();
				if (childOb) {
					childOb.dep.depend();
					if (Array.isArray(value)) {
						dependArray(value);
					}
				}
			}
			return value
		},
		set: function reactiveSetter (newVal) {
			var value = getter ? getter.call(obj) : val;
			/* eslint-disable no-self-compare */
			if (newVal === value || (newVal !== newVal && value !== value)) {
				return
			}
			/* eslint-enable no-self-compare */
			if (customSetter) {
				customSetter();
			}
			// #7981: for accessor properties without setter
			if (getter && !setter) { return }
			if (setter) {
				setter.call(obj, newVal);
			} else {
				val = newVal;
			}
			childOb = !shallow && observe(newVal);
			dep.notify();
		}
	});
}


/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
function set(target, key, val) { // Vue.prototype.$set = set;
    if (isUndef(target) || isPrimitive(target)
    ) {
        warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
    }
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.length = Math.max(target.length, key);
        target.splice(key, 1, val);
        return val
    }
    if (key in target && !(key in Object.prototype)) {
        target[key] = val;
        return val
    }
    var ob = (target).__ob__;
    if (target._isVue || (ob && ob.vmCount)) {
        warn(
            'Avoid adding reactive properties to a Vue instance or its root $data ' +
            'at runtime - declare it upfront in the data option.'
        );
        return val
    }
    if (!ob) {
        target[key] = val;
        return val
    }
    defineReactive$$1(ob.value, key, val);
    ob.dep.notify();
    return val
}

/**
 * Delete a property and trigger change if necessary.
 */
function del(target, key) { // Vue.prototype.$delete = del;
    if (isUndef(target) || isPrimitive(target)
    ) {
        warn(("Cannot delete reactive property on undefined, null, or primitive value: " + ((target))));
    }
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.splice(key, 1);
        return
    }
    var ob = (target).__ob__;
    if (target._isVue || (ob && ob.vmCount)) {
        warn(
            'Avoid deleting properties on a Vue instance or its root $data ' +
            '- just set it to null.'
        );
        return
    }
    if (!hasOwn(target, key)) {
        return
    }
    delete target[key];
    if (!ob) {
        return
    }
    ob.dep.notify();
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray(value) {
    for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
        e = value[i];
        e && e.__ob__ && e.__ob__.dep.depend();
        if (Array.isArray(e)) {
            dependArray(e);
        }
    }
}


/*  */
var VNode = function VNode(
    tag,
    data,
    children,
    text,
    elm,
    context,
    componentOptions,
    asyncFactory
) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
    this.ns = undefined;
    this.context = context;
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    this.key = data && data.key;
    this.componentOptions = componentOptions;
    this.componentInstance = undefined;
    this.parent = undefined;
    this.raw = false;
    this.isStatic = false;
    this.isRootInsert = true;
    this.isComment = false;
    this.isCloned = false;
    this.isOnce = false;
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
};

var prototypeAccessors = { child: { configurable: true } };

// DEPRECATED: alias for componentInstance for backwards compat.
/* istanbul ignore next */
prototypeAccessors.child.get = function () {
    return this.componentInstance
};

Object.defineProperties(VNode.prototype, prototypeAccessors);

var createEmptyVNode = function (text) {
    if (text === void 0) text = '';

    var node = new VNode();
    node.text = text;
    node.isComment = true;
    return node
};

function createTextVNode(val) {
    return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
function cloneVNode(vnode) {
    var cloned = new VNode(
        vnode.tag,
        vnode.data,
        // #7975
        // clone children array to avoid mutating original in case of cloning
        // a child.
        vnode.children && vnode.children.slice(),
        vnode.text,
        vnode.elm,
        vnode.context,
        vnode.componentOptions,
        vnode.asyncFactory
    );
    cloned.ns = vnode.ns;
    cloned.isStatic = vnode.isStatic;
    cloned.key = vnode.key;
    cloned.isComment = vnode.isComment;
    cloned.fnContext = vnode.fnContext;
    cloned.fnOptions = vnode.fnOptions;
    cloned.fnScopeId = vnode.fnScopeId;
    cloned.asyncMeta = vnode.asyncMeta;
    cloned.isCloned = true;
    return cloned
}


/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
var Watcher = function Watcher(
    vm,
    expOrFn,
    cb,
    options,
    isRenderWatcher
) {
    this.vm = vm;
    if (isRenderWatcher) {
        vm._watcher = this;
    }
    vm._watchers.push(this);
    // options
    if (options) {
        this.deep = !!options.deep;
        this.user = !!options.user;
        this.lazy = !!options.lazy;
        this.sync = !!options.sync;
        this.before = options.before;
    } else {
        this.deep = this.user = this.lazy = this.sync = false;
    }
    this.cb = cb;
    this.id = ++uid$2; // uid for batching
    this.active = true;
    this.dirty = this.lazy; // for lazy watchers
    this.deps = [];
    this.newDeps = [];
    this.depIds = new _Set();
    this.newDepIds = new _Set();
    this.expression = expOrFn.toString();
    // parse expression for getter
    if (typeof expOrFn === 'function') {
        this.getter = expOrFn;
    } else {
        this.getter = parsePath(expOrFn);
        if (!this.getter) {
            this.getter = noop;
            warn(
                "Failed watching path: \"" + expOrFn + "\" " +
                'Watcher only accepts simple dot-delimited paths. ' +
                'For full control, use a function instead.',
                vm
            );
        }
    }
    this.value = this.lazy
        ? undefined
        : this.get();
};

/**
 * Evaluate the getter, and re-collect dependencies.
 */
Watcher.prototype.get = function get() {
    pushTarget(this);
    var value;
    var vm = this.vm;
    try {
        value = this.getter.call(vm, vm);
    } catch (e) {
        if (this.user) {
            handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
        } else {
            throw e
        }
    } finally {
        // "touch" every property so they are all tracked as
        // dependencies for deep watching
        if (this.deep) {
            traverse(value);
        }
        popTarget();
        this.cleanupDeps();
    }
    return value
};

/**
 * Add a dependency to this directive.
 */
Watcher.prototype.addDep = function addDep(dep) {
    var id = dep.id;
    if (!this.newDepIds.has(id)) {
        this.newDepIds.add(id);
        this.newDeps.push(dep);
        if (!this.depIds.has(id)) {
            dep.addSub(this);
        }
    }
};

/**
 * Clean up for dependency collection.
 */
Watcher.prototype.cleanupDeps = function cleanupDeps() {
    var i = this.deps.length;
    while (i--) {
        var dep = this.deps[i];
        if (!this.newDepIds.has(dep.id)) {
            dep.removeSub(this);
        }
    }
    var tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
};

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 */
Watcher.prototype.update = function update() {
    /* istanbul ignore else */
    if (this.lazy) {
        this.dirty = true;
    } else if (this.sync) {
        this.run();
    } else {
        queueWatcher(this);
    }
};

/**
 * Scheduler job interface.
 * Will be called by the scheduler.
 */
Watcher.prototype.run = function run() {
    if (this.active) {
        var value = this.get();
        if (
            value !== this.value ||
            // Deep watchers and watchers on Object/Arrays should fire even
            // when the value is the same, because the value may
            // have mutated.
            isObject(value) ||
            this.deep
        ) {
            // set new value
            var oldValue = this.value;
            this.value = value;
            if (this.user) {
                try {
                    this.cb.call(this.vm, value, oldValue);
                } catch (e) {
                    handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
                }
            } else {
                this.cb.call(this.vm, value, oldValue);
            }
        }
    }
};

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */
Watcher.prototype.evaluate = function evaluate() {
    this.value = this.get();
    this.dirty = false;
};

/**
 * Depend on all deps collected by this watcher.
 */
Watcher.prototype.depend = function depend() {
    var i = this.deps.length;
    while (i--) {
        this.deps[i].depend();
    }
};

/**
 * Remove self from all dependencies' subscriber list.
 */
Watcher.prototype.teardown = function teardown() {
    if (this.active) {
        // remove self from vm's watcher list
        // this is a somewhat expensive operation so we skip it
        // if the vm is being destroyed.
        if (!this.vm._isBeingDestroyed) {
            remove(this.vm._watchers, this);
        }
        var i = this.deps.length;
        while (i--) {
            this.deps[i].removeSub(this);
        }
        this.active = false;
    }
};


/**
 * Convert HTML string to AST. 虚拟语法树
 */
function parse (
	template,
	options
) {
	warn$2 = options.warn || baseWarn;

	platformIsPreTag = options.isPreTag || no;
	platformMustUseProp = options.mustUseProp || no;
	platformGetTagNamespace = options.getTagNamespace || no;
	var isReservedTag = options.isReservedTag || no;
	maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); };

	transforms = pluckModuleFunction(options.modules, 'transformNode');
	preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
	postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

	delimiters = options.delimiters;

	var stack = [];
	var preserveWhitespace = options.preserveWhitespace !== false;
	var whitespaceOption = options.whitespace;
	var root;
	var currentParent;
	var inVPre = false;
	var inPre = false;
	var warned = false;

	function warnOnce (msg, range) {
		if (!warned) {
			warned = true;
			warn$2(msg, range);
		}
	}

	function closeElement (element) {
		trimEndingWhitespace(element);
		if (!inVPre && !element.processed) {
			element = processElement(element, options);
		}
		// tree management
		if (!stack.length && element !== root) {
			// allow root elements with v-if, v-else-if and v-else
			if (root.if && (element.elseif || element.else)) {
				{
					checkRootConstraints(element);
				}
				addIfCondition(root, {
					exp: element.elseif,
					block: element
				});
			} else {
				warnOnce(
					"Component template should contain exactly one root element. " +
					"If you are using v-if on multiple elements, " +
					"use v-else-if to chain them instead.",
					{ start: element.start }
				);
			}
		}
		if (currentParent && !element.forbidden) {
			if (element.elseif || element.else) {
				processIfConditions(element, currentParent);
			} else {
				if (element.slotScope) {
					// scoped slot
					// keep it in the children list so that v-else(-if) conditions can
					// find it as the prev node.
					var name = element.slotTarget || '"default"'
					;(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
				}
				currentParent.children.push(element);
				element.parent = currentParent;
			}
		}

		// final children cleanup
		// filter out scoped slots
		element.children = element.children.filter(function (c) { return !(c).slotScope; });
		// remove trailing whitespace node again
		trimEndingWhitespace(element);

		// check pre state
		if (element.pre) {
			inVPre = false;
		}
		if (platformIsPreTag(element.tag)) {
			inPre = false;
		}
		// apply post-transforms
		for (var i = 0; i < postTransforms.length; i++) {
			postTransforms[i](element, options);
		}
	}

	function trimEndingWhitespace (el) {
		// remove trailing whitespace node
		if (!inPre) {
			var lastNode;
			while (
				(lastNode = el.children[el.children.length - 1]) &&
				lastNode.type === 3 &&
				lastNode.text === ' '
				) {
				el.children.pop();
			}
		}
	}

	function checkRootConstraints (el) {
		if (el.tag === 'slot' || el.tag === 'template') {
			warnOnce(
				"Cannot use <" + (el.tag) + "> as component root element because it may " +
				'contain multiple nodes.',
				{ start: el.start }
			);
		}
		if (el.attrsMap.hasOwnProperty('v-for')) {
			warnOnce(
				'Cannot use v-for on stateful component root element because ' +
				'it renders multiple elements.',
				el.rawAttrsMap['v-for']
			);
		}
	}

	parseHTML(template, {
		warn: warn$2,
		expectHTML: options.expectHTML,
		isUnaryTag: options.isUnaryTag,
		canBeLeftOpenTag: options.canBeLeftOpenTag,
		shouldDecodeNewlines: options.shouldDecodeNewlines,
		shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
		shouldKeepComment: options.comments,
		outputSourceRange: options.outputSourceRange,
		start: function start (tag, attrs, unary, start$1, end) {
			// check namespace.
			// inherit parent ns if there is one
			var ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag);

			// handle IE svg bug
			/* istanbul ignore if */
			if (isIE && ns === 'svg') {
				attrs = guardIESVGBug(attrs);
			}

			var element = createASTElement(tag, attrs, currentParent);
			if (ns) {
				element.ns = ns;
			}

			{
				if (options.outputSourceRange) {
					element.start = start$1;
					element.end = end;
					element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
						cumulated[attr.name] = attr;
						return cumulated
					}, {});
				}
				attrs.forEach(function (attr) {
					if (invalidAttributeRE.test(attr.name)) {
						warn$2(
							"Invalid dynamic argument expression: attribute names cannot contain " +
							"spaces, quotes, <, >, / or =.",
							{
								start: attr.start + attr.name.indexOf("["),
								end: attr.start + attr.name.length
							}
						);
					}
				});
			}

			if (isForbiddenTag(element) && !isServerRendering()) {
				element.forbidden = true;
				warn$2(
					'Templates should only be responsible for mapping the state to the ' +
					'UI. Avoid placing tags with side-effects in your templates, such as ' +
					"<" + tag + ">" + ', as they will not be parsed.',
					{ start: element.start }
				);
			}

			// apply pre-transforms
			for (var i = 0; i < preTransforms.length; i++) {
				element = preTransforms[i](element, options) || element;
			}

			if (!inVPre) {
				processPre(element);
				if (element.pre) {
					inVPre = true;
				}
			}
			if (platformIsPreTag(element.tag)) {
				inPre = true;
			}
			if (inVPre) {
				processRawAttrs(element);
			} else if (!element.processed) {
				// structural directives
				processFor(element);
				processIf(element);
				processOnce(element);
			}

			if (!root) {
				root = element;
				{
					checkRootConstraints(root);
				}
			}

			if (!unary) {
				currentParent = element;
				stack.push(element);
			} else {
				closeElement(element);
			}
		},

		end: function end (tag, start, end$1) {
			var element = stack[stack.length - 1];
			// pop stack
			stack.length -= 1;
			currentParent = stack[stack.length - 1];
			if (options.outputSourceRange) {
				element.end = end$1;
			}
			closeElement(element);
		},

		chars: function chars (text, start, end) {
			if (!currentParent) {
				{
					if (text === template) {
						warnOnce(
							'Component template requires a root element, rather than just text.',
							{ start: start }
						);
					} else if ((text = text.trim())) {
						warnOnce(
							("text \"" + text + "\" outside root element will be ignored."),
							{ start: start }
						);
					}
				}
				return
			}
			// IE textarea placeholder bug
			/* istanbul ignore if */
			if (isIE &&
				currentParent.tag === 'textarea' &&
				currentParent.attrsMap.placeholder === text
			) {
				return
			}
			var children = currentParent.children;
			if (inPre || text.trim()) {
				text = isTextTag(currentParent) ? text : decodeHTMLCached(text);
			} else if (!children.length) {
				// remove the whitespace-only node right after an opening tag
				text = '';
			} else if (whitespaceOption) {
				if (whitespaceOption === 'condense') {
					// in condense mode, remove the whitespace node if it contains
					// line break, otherwise condense to a single space
					text = lineBreakRE.test(text) ? '' : ' ';
				} else {
					text = ' ';
				}
			} else {
				text = preserveWhitespace ? ' ' : '';
			}
			if (text) {
				if (!inPre && whitespaceOption === 'condense') {
					// condense consecutive whitespaces into single space
					text = text.replace(whitespaceRE$1, ' ');
				}
				var res;
				var child;
				if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
					child = {
						type: 2,
						expression: res.expression,
						tokens: res.tokens,
						text: text
					};
				} else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
					child = {
						type: 3,
						text: text
					};
				}
				if (child) {
					if (options.outputSourceRange) {
						child.start = start;
						child.end = end;
					}
					children.push(child);
				}
			}
		},
		comment: function comment (text, start, end) {
			// adding anyting as a sibling to the root node is forbidden
			// comments should still be allowed, but ignored
			if (currentParent) {
				var child = {
					type: 3,
					text: text,
					isComment: true
				};
				if (options.outputSourceRange) {
					child.start = start;
					child.end = end;
				}
				currentParent.children.push(child);
			}
		}
	});
	return root
}

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
var createCompiler = createCompilerCreator(function baseCompile (
	template,
	options
) {
	var ast = parse(template.trim(), options);
	if (options.optimize !== false) {
		optimize(ast, options);
	}
	var code = generate(ast, options);
	return {
		ast: ast,
		render: code.render,
		staticRenderFns: code.staticRenderFns
	}
});

function genData$2 (el, state) {
	var data = '{';

	// directives first.
	// directives may mutate the el's other properties before they are generated.
	var dirs = genDirectives(el, state);
	if (dirs) { data += dirs + ','; }

	// key
	if (el.key) {
		data += "key:" + (el.key) + ",";
	}
	// ref
	if (el.ref) {
		data += "ref:" + (el.ref) + ",";
	}
	if (el.refInFor) {
		data += "refInFor:true,";
	}
	// pre
	if (el.pre) {
		data += "pre:true,";
	}
	// record original tag name for components using "is" attribute
	if (el.component) {
		data += "tag:\"" + (el.tag) + "\",";
	}
	// module data generation functions
	for (var i = 0; i < state.dataGenFns.length; i++) {
		data += state.dataGenFns[i](el);
	}
	// attributes
	if (el.attrs) {
		data += "attrs:" + (genProps(el.attrs)) + ",";
	}
	// DOM props
	if (el.props) {
		data += "domProps:" + (genProps(el.props)) + ",";
	}
	// event handlers
	if (el.events) {
		data += (genHandlers(el.events, false)) + ",";
	}
	if (el.nativeEvents) {
		data += (genHandlers(el.nativeEvents, true)) + ",";
	}
	// slot target
	// only for non-scoped slots
	if (el.slotTarget && !el.slotScope) {
		data += "slot:" + (el.slotTarget) + ",";
	}
	// scoped slots
	if (el.scopedSlots) {
		data += (genScopedSlots(el, el.scopedSlots, state)) + ",";
	}
	// component v-model
	if (el.model) {
		data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
	}
	// inline-template
	if (el.inlineTemplate) {
		var inlineTemplate = genInlineTemplate(el, state);
		if (inlineTemplate) {
			data += inlineTemplate + ",";
		}
	}
	data = data.replace(/,$/, '') + '}';
	// v-bind dynamic argument wrap
	// v-bind with dynamic arguments must be applied using the same v-bind object
	// merge helper so that class/style/mustUseProp attrs are handled correctly.
	if (el.dynamicAttrs) {
		data = "_b(" + data + ",\"" + (el.tag) + "\"," + (genProps(el.dynamicAttrs)) + ")";
	}
	// v-bind data wrap
	if (el.wrapData) {
		data = el.wrapData(data);
	}
	// v-on data wrap
	if (el.wrapListeners) {
		data = el.wrapListeners(data);
	}
	return data
}

function genDirectives (el, state) {
	var dirs = el.directives;
	if (!dirs) { return }
	var res = 'directives:[';
	var hasRuntime = false;
	var i, l, dir, needRuntime;
	for (i = 0, l = dirs.length; i < l; i++) {
		dir = dirs[i];
		needRuntime = true;
		var gen = state.directives[dir.name];
		if (gen) {
			// compile-time directive that manipulates AST.
			// returns true if it also needs a runtime counterpart.
			needRuntime = !!gen(el, dir, state.warn);
		}
		if (needRuntime) {
			hasRuntime = true;
			res += "{name:\"" + (dir.name) + "\",rawName:\"" + (dir.rawName) + "\"" + (dir.value ? (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : '') + (dir.arg ? (",arg:" + (dir.isDynamicArg ? dir.arg : ("\"" + (dir.arg) + "\""))) : '') + (dir.modifiers ? (",modifiers:" + (JSON.stringify(dir.modifiers))) : '') + "},";
		}
	}
	if (hasRuntime) {
		return res.slice(0, -1) + ']'
	}
}

// preTransformNode 是将 input 的指令 v-model 处理成 3种情况
function preTransformNode (el, options) {
	if (el.tag === 'input') {
		var map = el.attrsMap;
		if (!map['v-model']) {
			return
		}

		var typeBinding;
		if (map[':type'] || map['v-bind:type']) {
			typeBinding = getBindingAttr(el, 'type');
		}
		if (!map.type && !typeBinding && map['v-bind']) {
			typeBinding = "(" + (map['v-bind']) + ").type";
		}

		if (typeBinding) {
			var ifCondition = getAndRemoveAttr(el, 'v-if', true);
			var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : "";
			var hasElse = getAndRemoveAttr(el, 'v-else', true) != null;
			var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true);
			// 1. checkbox
			var branch0 = cloneASTElement(el);
			// process for on the main node
			processFor(branch0);
			addRawAttr(branch0, 'type', 'checkbox');
			processElement(branch0, options);
			branch0.processed = true; // prevent it from double-processed
			branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
			addIfCondition(branch0, {
				exp: branch0.if,
				block: branch0
			});
			// 2. add radio else-if condition
			var branch1 = cloneASTElement(el);
			getAndRemoveAttr(branch1, 'v-for', true);
			addRawAttr(branch1, 'type', 'radio');
			processElement(branch1, options);
			addIfCondition(branch0, {
				exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
				block: branch1
			});
			// 3. other
			var branch2 = cloneASTElement(el);
			getAndRemoveAttr(branch2, 'v-for', true);
			addRawAttr(branch2, ':type', typeBinding);
			processElement(branch2, options);
			addIfCondition(branch0, {
				exp: ifCondition,
				block: branch2
			});

			if (hasElse) {
				branch0.else = true;
			} else if (elseIfCondition) {
				branch0.elseif = elseIfCondition;
			}

			return branch0
		}
	}
}

function getComponentName(opts) {
    return opts && (opts.Ctor.options.name || opts.tag)
}

function matches(pattern, name) {
    if (Array.isArray(pattern)) {
        return pattern.indexOf(name) > -1
    } else if (typeof pattern === 'string') {
        return pattern.split(',').indexOf(name) > -1
    } else if (isRegExp(pattern)) {
        return pattern.test(name)
    }
    /* istanbul ignore next */
    return false
}

function pruneCache(keepAliveInstance, filter) {
    var cache = keepAliveInstance.cache;
    var keys = keepAliveInstance.keys;
    var _vnode = keepAliveInstance._vnode;
    for (var key in cache) {
        var cachedNode = cache[key];
        if (cachedNode) {
            var name = getComponentName(cachedNode.componentOptions);
            if (name && !filter(name)) {
                pruneCacheEntry(cache, key, keys, _vnode);
            }
        }
    }
}

function pruneCacheEntry(
    cache,
    key,
    keys,
    current
) {
    var cached$$1 = cache[key];
    if (cached$$1 && (!current || cached$$1.tag !== current.tag)) {
        cached$$1.componentInstance.$destroy();
    }
    cache[key] = null;
    remove(keys, key);
}

var patternTypes = [String, RegExp, Array];

var KeepAlive = {
    name: 'keep-alive',
    abstract: true,

    props: {
        include: patternTypes,
        exclude: patternTypes,
        max: [String, Number]
    },

    created: function created() {
        this.cache = Object.create(null);
        this.keys = [];
    },

    destroyed: function destroyed() {
        for (var key in this.cache) {
            pruneCacheEntry(this.cache, key, this.keys);
        }
    },

    mounted: function mounted() {
        var this$1 = this;

        this.$watch('include', function (val) {
            pruneCache(this$1, function (name) { return matches(val, name); });
        });
        this.$watch('exclude', function (val) {
            pruneCache(this$1, function (name) { return !matches(val, name); });
        });
    },

    render: function render() {
        var slot = this.$slots.default;
        var vnode = getFirstComponentChild(slot);
        var componentOptions = vnode && vnode.componentOptions;
        if (componentOptions) {
            // check pattern
            var name = getComponentName(componentOptions);
            var ref = this;
            var include = ref.include;
            var exclude = ref.exclude;
            if (
                // not included
                (include && (!name || !matches(include, name))) ||
                // excluded
                (exclude && name && matches(exclude, name))
            ) {
                return vnode
            }

            var ref$1 = this;
            var cache = ref$1.cache;
            var keys = ref$1.keys;
            var key = vnode.key == null
                // same constructor may get registered as different local components
                // so cid alone is not enough (#3269)
                ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
                : vnode.key;
            if (cache[key]) {
                vnode.componentInstance = cache[key].componentInstance;
                // make current key freshest
                remove(keys, key);
                keys.push(key);
            } else {
                cache[key] = vnode;
                keys.push(key);
                // prune oldest entry
                if (this.max && keys.length > parseInt(this.max)) {
                    pruneCacheEntry(cache, keys[0], keys, this._vnode);
                }
            }

            vnode.data.keepAlive = true;
        }
        return vnode || (slot && slot[0])
    }
};

var builtInComponents = {
    KeepAlive: KeepAlive
};

function createPatchFunction (backend) {
	var i, j;
	var cbs = {};

	var modules = backend.modules;
	var nodeOps = backend.nodeOps;

	for (i = 0; i < hooks.length; ++i) {
		cbs[hooks[i]] = [];
		for (j = 0; j < modules.length; ++j) {
			if (isDef(modules[j][hooks[i]])) {
				cbs[hooks[i]].push(modules[j][hooks[i]]);
			}
		}
	}

	function emptyNodeAt (elm) {
		return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
	}

	function createRmCb (childElm, listeners) {
		function remove$$1 () {
			if (--remove$$1.listeners === 0) {
				removeNode(childElm);
			}
		}
		remove$$1.listeners = listeners;
		return remove$$1
	}

	function removeNode (el) {
		var parent = nodeOps.parentNode(el);
		// element may have already been removed due to v-html / v-text
		if (isDef(parent)) {
			nodeOps.removeChild(parent, el);
		}
	}

	function isUnknownElement$$1 (vnode, inVPre) {
		return (
			!inVPre &&
			!vnode.ns &&
			!(
				config.ignoredElements.length &&
				config.ignoredElements.some(function (ignore) {
					return isRegExp(ignore)
						? ignore.test(vnode.tag)
						: ignore === vnode.tag
				})
			) &&
			config.isUnknownElement(vnode.tag)
		)
	}

	var creatingElmInVPre = 0;

	function createElm (
		vnode,
		insertedVnodeQueue,
		parentElm,
		refElm,
		nested,
		ownerArray,
		index
	) {
		if (isDef(vnode.elm) && isDef(ownerArray)) {
			// This vnode was used in a previous render!
			// now it's used as a new node, overwriting its elm would cause
			// potential patch errors down the road when it's used as an insertion
			// reference node. Instead, we clone the node on-demand before creating
			// associated DOM element for it.
			vnode = ownerArray[index] = cloneVNode(vnode);
		}

		vnode.isRootInsert = !nested; // for transition enter check
		if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
			return
		}

		var data = vnode.data;
		var children = vnode.children;
		var tag = vnode.tag;
		if (isDef(tag)) {
			{
				if (data && data.pre) {
					creatingElmInVPre++;
				}
				if (isUnknownElement$$1(vnode, creatingElmInVPre)) {
					warn(
						'Unknown custom element: <' + tag + '> - did you ' +
						'register the component correctly? For recursive components, ' +
						'make sure to provide the "name" option.',
						vnode.context
					);
				}
			}

			vnode.elm = vnode.ns
				? nodeOps.createElementNS(vnode.ns, tag)
				: nodeOps.createElement(tag, vnode);
			setScope(vnode);

			/* istanbul ignore if */
			{
				createChildren(vnode, children, insertedVnodeQueue);
				if (isDef(data)) {
					invokeCreateHooks(vnode, insertedVnodeQueue);
				}
				insert(parentElm, vnode.elm, refElm);
			}

			if (data && data.pre) {
				creatingElmInVPre--;
			}
		} else if (isTrue(vnode.isComment)) {
			vnode.elm = nodeOps.createComment(vnode.text);
			insert(parentElm, vnode.elm, refElm);
		} else {
			vnode.elm = nodeOps.createTextNode(vnode.text);
			insert(parentElm, vnode.elm, refElm);
		}
	}

	function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
		var i = vnode.data;
		if (isDef(i)) {
			var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
			if (isDef(i = i.hook) && isDef(i = i.init)) {
				i(vnode, false /* hydrating */);
			}
			// after calling the init hook, if the vnode is a child component
			// it should've created a child instance and mounted it. the child
			// component also has set the placeholder vnode's elm.
			// in that case we can just return the element and be done.
			if (isDef(vnode.componentInstance)) {
				initComponent(vnode, insertedVnodeQueue);
				insert(parentElm, vnode.elm, refElm);
				if (isTrue(isReactivated)) {
					reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
				}
				return true
			}
		}
	}

	function initComponent (vnode, insertedVnodeQueue) {
		if (isDef(vnode.data.pendingInsert)) {
			insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
			vnode.data.pendingInsert = null;
		}
		vnode.elm = vnode.componentInstance.$el;
		if (isPatchable(vnode)) {
			invokeCreateHooks(vnode, insertedVnodeQueue);
			setScope(vnode);
		} else {
			// empty component root.
			// skip all element-related modules except for ref (#3455)
			registerRef(vnode);
			// make sure to invoke the insert hook
			insertedVnodeQueue.push(vnode);
		}
	}

	function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
		var i;
		// hack for #4339: a reactivated component with inner transition
		// does not trigger because the inner node's created hooks are not called
		// again. It's not ideal to involve module-specific logic in here but
		// there doesn't seem to be a better way to do it.
		var innerNode = vnode;
		while (innerNode.componentInstance) {
			innerNode = innerNode.componentInstance._vnode;
			if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
				for (i = 0; i < cbs.activate.length; ++i) {
					cbs.activate[i](emptyNode, innerNode);
				}
				insertedVnodeQueue.push(innerNode);
				break
			}
		}
		// unlike a newly created component,
		// a reactivated keep-alive component doesn't insert itself
		insert(parentElm, vnode.elm, refElm);
	}

	function insert (parent, elm, ref$$1) {
		if (isDef(parent)) {
			if (isDef(ref$$1)) {
				if (nodeOps.parentNode(ref$$1) === parent) {
					nodeOps.insertBefore(parent, elm, ref$$1);
				}
			} else {
				nodeOps.appendChild(parent, elm);
			}
		}
	}

	function createChildren (vnode, children, insertedVnodeQueue) {
		if (Array.isArray(children)) {
			{
				checkDuplicateKeys(children);
			}
			console.log(children);
			for (var i = 0; i < children.length; ++i) {
				createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
			}
		} else if (isPrimitive(vnode.text)) {
			nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
		}
	}

	function isPatchable (vnode) {
		while (vnode.componentInstance) {
			vnode = vnode.componentInstance._vnode;
		}
		return isDef(vnode.tag)
	}

	function invokeCreateHooks (vnode, insertedVnodeQueue) {
		for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
			cbs.create[i$1](emptyNode, vnode);
		}
		i = vnode.data.hook; // Reuse variable
		if (isDef(i)) {
			if (isDef(i.create)) { i.create(emptyNode, vnode); }
			if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
		}
	}

	// set scope id attribute for scoped CSS.
	// this is implemented as a special case to avoid the overhead
	// of going through the normal attribute patching process.
	function setScope (vnode) {
		var i;
		if (isDef(i = vnode.fnScopeId)) {
			nodeOps.setStyleScope(vnode.elm, i);
		} else {
			var ancestor = vnode;
			while (ancestor) {
				if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
					nodeOps.setStyleScope(vnode.elm, i);
				}
				ancestor = ancestor.parent;
			}
		}
		// for slot content they should also get the scopeId from the host instance.
		if (isDef(i = activeInstance) &&
			i !== vnode.context &&
			i !== vnode.fnContext &&
			isDef(i = i.$options._scopeId)
		) {
			nodeOps.setStyleScope(vnode.elm, i);
		}
	}

	function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
		for (; startIdx <= endIdx; ++startIdx) {
			createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIdx);
		}
	}

	function invokeDestroyHook (vnode) {
		var i, j;
		var data = vnode.data;
		if (isDef(data)) {
			if (isDef(i = data.hook) && isDef(i = i.destroy)) { i(vnode); }
			for (i = 0; i < cbs.destroy.length; ++i) { cbs.destroy[i](vnode); }
		}
		if (isDef(i = vnode.children)) {
			for (j = 0; j < vnode.children.length; ++j) {
				invokeDestroyHook(vnode.children[j]);
			}
		}
	}

	function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
		for (; startIdx <= endIdx; ++startIdx) {
			var ch = vnodes[startIdx];
			if (isDef(ch)) {
				if (isDef(ch.tag)) {
					removeAndInvokeRemoveHook(ch);
					invokeDestroyHook(ch);
				} else { // Text node
					removeNode(ch.elm);
				}
			}
		}
	}

	function removeAndInvokeRemoveHook (vnode, rm) {
		if (isDef(rm) || isDef(vnode.data)) {
			var i;
			var listeners = cbs.remove.length + 1;
			if (isDef(rm)) {
				// we have a recursively passed down rm callback
				// increase the listeners count
				rm.listeners += listeners;
			} else {
				// directly removing
				rm = createRmCb(vnode.elm, listeners);
			}
			// recursively invoke hooks on child component root node
			if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
				removeAndInvokeRemoveHook(i, rm);
			}
			for (i = 0; i < cbs.remove.length; ++i) {
				cbs.remove[i](vnode, rm);
			}
			if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
				i(vnode, rm);
			} else {
				rm();
			}
		} else {
			removeNode(vnode.elm);
		}
	}

	function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
		var oldStartIdx = 0;
		var newStartIdx = 0;
		var oldEndIdx = oldCh.length - 1;
		var oldStartVnode = oldCh[0];
		var oldEndVnode = oldCh[oldEndIdx];
		var newEndIdx = newCh.length - 1;
		var newStartVnode = newCh[0];
		var newEndVnode = newCh[newEndIdx];
		var oldKeyToIdx, idxInOld, vnodeToMove, refElm;
		// removeOnly is a special flag used only by <transition-group>
		// to ensure removed elements stay in correct relative positions
		// during leaving transitions
		var canMove = !removeOnly;

		{
			checkDuplicateKeys(newCh);
		}

		while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
			if (isUndef(oldStartVnode)) {
				oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
			} else if (isUndef(oldEndVnode)) {
				oldEndVnode = oldCh[--oldEndIdx];
			} else if (sameVnode(oldStartVnode, newStartVnode)) {
				patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
				oldStartVnode = oldCh[++oldStartIdx];
				newStartVnode = newCh[++newStartIdx];
			} else if (sameVnode(oldEndVnode, newEndVnode)) {
				patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
				oldEndVnode = oldCh[--oldEndIdx];
				newEndVnode = newCh[--newEndIdx];
			} else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
				patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
				canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
				oldStartVnode = oldCh[++oldStartIdx];
				newEndVnode = newCh[--newEndIdx];
			} else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
				patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
				canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
				oldEndVnode = oldCh[--oldEndIdx];
				newStartVnode = newCh[++newStartIdx];
			} else {
				if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
				idxInOld = isDef(newStartVnode.key)
					? oldKeyToIdx[newStartVnode.key]
					: findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
				if (isUndef(idxInOld)) { // New element
					createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
				} else {
					vnodeToMove = oldCh[idxInOld];
					if (sameVnode(vnodeToMove, newStartVnode)) {
						patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
						oldCh[idxInOld] = undefined;
						canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
					} else {
						// same key but different element. treat as new element
						createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
					}
				}
				newStartVnode = newCh[++newStartIdx];
			}
		}
		if (oldStartIdx > oldEndIdx) {
			refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
			addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
		} else if (newStartIdx > newEndIdx) {
			removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
		}
	}

	function checkDuplicateKeys (children) {
		var seenKeys = {};
		for (var i = 0; i < children.length; i++) {
			var vnode = children[i];
			var key = vnode.key;
			if (isDef(key)) {
				if (seenKeys[key]) {
					warn(
						("Duplicate keys detected: '" + key + "'. This may cause an update error."),
						vnode.context
					);
				} else {
					seenKeys[key] = true;
				}
			}
		}
	}

	function findIdxInOld (node, oldCh, start, end) {
		for (var i = start; i < end; i++) {
			var c = oldCh[i];
			if (isDef(c) && sameVnode(node, c)) { return i }
		}
	}

	function patchVnode (
		oldVnode,
		vnode,
		insertedVnodeQueue,
		ownerArray,
		index,
		removeOnly
	) {
		if (oldVnode === vnode) {
			return
		}

		if (isDef(vnode.elm) && isDef(ownerArray)) {
			// clone reused vnode
			vnode = ownerArray[index] = cloneVNode(vnode);
		}

		var elm = vnode.elm = oldVnode.elm;

		if (isTrue(oldVnode.isAsyncPlaceholder)) {
			if (isDef(vnode.asyncFactory.resolved)) {
				hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
			} else {
				vnode.isAsyncPlaceholder = true;
			}
			return
		}

		// reuse element for static trees.
		// note we only do this if the vnode is cloned -
		// if the new node is not cloned it means the render functions have been
		// reset by the hot-reload-api and we need to do a proper re-render.
		if (isTrue(vnode.isStatic) &&
			isTrue(oldVnode.isStatic) &&
			vnode.key === oldVnode.key &&
			(isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
		) {
			vnode.componentInstance = oldVnode.componentInstance;
			return
		}

		var i;
		var data = vnode.data;
		if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
			i(oldVnode, vnode);
		}

		var oldCh = oldVnode.children;
		var ch = vnode.children;
		if (isDef(data) && isPatchable(vnode)) {
			for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
			if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
		}
		if (isUndef(vnode.text)) {
			if (isDef(oldCh) && isDef(ch)) {
				if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
			} else if (isDef(ch)) {
				{
					checkDuplicateKeys(ch);
				}
				if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
				addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
			} else if (isDef(oldCh)) {
				removeVnodes(elm, oldCh, 0, oldCh.length - 1);
			} else if (isDef(oldVnode.text)) {
				nodeOps.setTextContent(elm, '');
			}
		} else if (oldVnode.text !== vnode.text) {
			nodeOps.setTextContent(elm, vnode.text);
		}
		if (isDef(data)) {
			if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
		}
	}

	function invokeInsertHook (vnode, queue, initial) {
		// delay insert hooks for component root nodes, invoke them after the
		// element is really inserted
		if (isTrue(initial) && isDef(vnode.parent)) {
			vnode.parent.data.pendingInsert = queue;
		} else {
			for (var i = 0; i < queue.length; ++i) {
				queue[i].data.hook.insert(queue[i]);
			}
		}
	}

	var hydrationBailed = false;
	// list of modules that can skip create hook during hydration because they
	// are already rendered on the client or has no need for initialization
	// Note: style is excluded because it relies on initial clone for future
	// deep updates (#7063).
	var isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key');

	// Note: this is a browser-only function so we can assume elms are DOM nodes.
	function hydrate (elm, vnode, insertedVnodeQueue, inVPre) {
		var i;
		var tag = vnode.tag;
		var data = vnode.data;
		var children = vnode.children;
		inVPre = inVPre || (data && data.pre);
		vnode.elm = elm;

		if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
			vnode.isAsyncPlaceholder = true;
			return true
		}
		// assert node match
		{
			if (!assertNodeMatch(elm, vnode, inVPre)) {
				return false
			}
		}
		if (isDef(data)) {
			if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
			if (isDef(i = vnode.componentInstance)) {
				// child component. it should have hydrated its own tree.
				initComponent(vnode, insertedVnodeQueue);
				return true
			}
		}
		if (isDef(tag)) {
			if (isDef(children)) {
				// empty element, allow client to pick up and populate children
				if (!elm.hasChildNodes()) {
					createChildren(vnode, children, insertedVnodeQueue);
				} else {
					// v-html and domProps: innerHTML
					if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
						if (i !== elm.innerHTML) {
							/* istanbul ignore if */
							if (typeof console !== 'undefined' &&
								!hydrationBailed
							) {
								hydrationBailed = true;
								console.warn('Parent: ', elm);
								console.warn('server innerHTML: ', i);
								console.warn('client innerHTML: ', elm.innerHTML);
							}
							return false
						}
					} else {
						// iterate and compare children lists
						var childrenMatch = true;
						var childNode = elm.firstChild;
						for (var i$1 = 0; i$1 < children.length; i$1++) {
							if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
								childrenMatch = false;
								break
							}
							childNode = childNode.nextSibling;
						}
						// if childNode is not null, it means the actual childNodes list is
						// longer than the virtual children list.
						if (!childrenMatch || childNode) {
							/* istanbul ignore if */
							if (typeof console !== 'undefined' &&
								!hydrationBailed
							) {
								hydrationBailed = true;
								console.warn('Parent: ', elm);
								console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
							}
							return false
						}
					}
				}
			}
			if (isDef(data)) {
				var fullInvoke = false;
				for (var key in data) {
					if (!isRenderedModule(key)) {
						fullInvoke = true;
						invokeCreateHooks(vnode, insertedVnodeQueue);
						break
					}
				}
				if (!fullInvoke && data['class']) {
					// ensure collecting deps for deep class bindings for future updates
					traverse(data['class']);
				}
			}
		} else if (elm.data !== vnode.text) {
			elm.data = vnode.text;
		}
		return true
	}

	function assertNodeMatch (node, vnode, inVPre) {
		if (isDef(vnode.tag)) {
			return vnode.tag.indexOf('vue-component') === 0 || (
				!isUnknownElement$$1(vnode, inVPre) &&
				vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
			)
		} else {
			return node.nodeType === (vnode.isComment ? 8 : 3)
		}
	}

	return function patch (oldVnode, vnode, hydrating, removeOnly) {
		debugger;
		console.log(oldVnode);
		if (isUndef(vnode)) {
			if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
			return
		}

		var isInitialPatch = false;
		var insertedVnodeQueue = [];

		if (isUndef(oldVnode)) {
			// empty mount (likely as component), create new root element
			isInitialPatch = true;
			createElm(vnode, insertedVnodeQueue);
		} else {
			var isRealElement = isDef(oldVnode.nodeType);
			if (!isRealElement && sameVnode(oldVnode, vnode)) {
				// patch existing root node
				patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
			} else {
				if (isRealElement) {
					// mounting to a real element
					// check if this is server-rendered content and if we can perform
					// a successful hydration.
					if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
						oldVnode.removeAttribute(SSR_ATTR);
						hydrating = true;
					}
					if (isTrue(hydrating)) {
						if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
							invokeInsertHook(vnode, insertedVnodeQueue, true);
							return oldVnode
						} else {
							warn(
								'The client-side rendered virtual DOM tree is not matching ' +
								'server-rendered content. This is likely caused by incorrect ' +
								'HTML markup, for example nesting block-level elements inside ' +
								'<p>, or missing <tbody>. Bailing hydration and performing ' +
								'full client-side render.'
							);
						}
					}
					// either not server-rendered, or hydration failed.
					// create an empty node and replace it
					oldVnode = emptyNodeAt(oldVnode);
				}

				// replacing existing element
				var oldElm = oldVnode.elm;
				var parentElm = nodeOps.parentNode(oldElm);
				console.log(insertedVnodeQueue);
				// create new node
				createElm(
					vnode,
					insertedVnodeQueue,
					// extremely rare edge case: do not insert if old element is in a
					// leaving transition. Only happens when combining transition +
					// keep-alive + HOCs. (#4590)
					oldElm._leaveCb ? null : parentElm,
					nodeOps.nextSibling(oldElm)
				);

				// update parent placeholder node element, recursively
				if (isDef(vnode.parent)) {
					var ancestor = vnode.parent;
					var patchable = isPatchable(vnode);
					while (ancestor) {
						for (var i = 0; i < cbs.destroy.length; ++i) {
							cbs.destroy[i](ancestor);
						}
						ancestor.elm = vnode.elm;
						if (patchable) {
							for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
								cbs.create[i$1](emptyNode, ancestor);
							}
							// #6513
							// invoke insert hooks that may have been merged by create hooks.
							// e.g. for directives that uses the "inserted" hook.
							var insert = ancestor.data.hook.insert;
							if (insert.merged) {
								// start at index 1 to avoid re-invoking component mounted hook
								for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
									insert.fns[i$2]();
								}
							}
						} else {
							registerRef(ancestor);
						}
						ancestor = ancestor.parent;
					}
				}

				// destroy old node
				if (isDef(parentElm)) {
					removeVnodes(parentElm, [oldVnode], 0, 0);
				} else if (isDef(oldVnode.tag)) {
					invokeDestroyHook(oldVnode);
				}
			}
		}

		invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
		return vnode.elm
	}
}

// addDirective
function processAttrs (el) {
	var list = el.attrsList;
	var i, l, name, rawName, value, modifiers, syncGen, isDynamic;
	for (i = 0, l = list.length; i < l; i++) {
		name = rawName = list[i].name;
		value = list[i].value;
		if (dirRE.test(name)) {
			// mark element as dynamic
			el.hasBindings = true;
			// modifiers
			modifiers = parseModifiers(name.replace(dirRE, ''));
			// support .foo shorthand syntax for the .prop modifier
			if (modifiers) {
				name = name.replace(modifierRE, '');
			}
			if (bindRE.test(name)) { // v-bind
				name = name.replace(bindRE, '');
				value = parseFilters(value);
				isDynamic = dynamicArgRE.test(name);
				if (isDynamic) {
					name = name.slice(1, -1);
				}
				if (
					value.trim().length === 0
				) {
					warn$2(
						("The value for a v-bind expression cannot be empty. Found in \"v-bind:" + name + "\"")
					);
				}
				if (modifiers) {
					if (modifiers.prop && !isDynamic) {
						name = camelize(name);
						if (name === 'innerHtml') { name = 'innerHTML'; }
					}
					if (modifiers.camel && !isDynamic) {
						name = camelize(name);
					}
					if (modifiers.sync) {
						syncGen = genAssignmentCode(value, "$event");
						if (!isDynamic) {
							addHandler(
								el,
								("update:" + (camelize(name))),
								syncGen,
								null,
								false,
								warn$2,
								list[i]
							);
							if (hyphenate(name) !== camelize(name)) {
								addHandler(
									el,
									("update:" + (hyphenate(name))),
									syncGen,
									null,
									false,
									warn$2,
									list[i]
								);
							}
						} else {
							// handler w/ dynamic event name
							addHandler(
								el,
								("\"update:\"+(" + name + ")"),
								syncGen,
								null,
								false,
								warn$2,
								list[i],
								true // dynamic
							);
						}
					}
				}
				if ((modifiers && modifiers.prop) || (
					!el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
				)) {
					addProp(el, name, value, list[i], isDynamic);
				} else {
					addAttr(el, name, value, list[i], isDynamic);
				}
			} else if (onRE.test(name)) { // v-on
				name = name.replace(onRE, '');
				isDynamic = dynamicArgRE.test(name);
				if (isDynamic) {
					name = name.slice(1, -1);
				}
				addHandler(el, name, value, modifiers, false, warn$2, list[i], isDynamic);
			} else { // normal directives
				name = name.replace(dirRE, '');
				// parse arg
				var argMatch = name.match(argRE);
				var arg = argMatch && argMatch[1];
				isDynamic = false;
				if (arg) {
					name = name.slice(0, -(arg.length + 1));
					if (dynamicArgRE.test(arg)) {
						arg = arg.slice(1, -1);
						isDynamic = true;
					}
				}
				console.log(name);
				addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i]);
				if (name === 'model') {
					checkForAliasModel(el, value);
				}
			}
		} else {
			// literal attribute
			{
				var res = parseText(value, delimiters);
				if (res) {
					warn$2(
						name + "=\"" + value + "\": " +
						'Interpolation inside attributes has been removed. ' +
						'Use v-bind or the colon shorthand instead. For example, ' +
						'instead of <div id="{{ val }}">, use <div :id="val">.',
						list[i]
					);
				}
			}
			addAttr(el, name, JSON.stringify(value), list[i]);
			// #6887 firefox doesn't update muted state if set via attribute
			// even immediately after element creation
			if (!el.component &&
				name === 'muted' &&
				platformMustUseProp(el.tag, el.attrsMap.type, name)) {
				addProp(el, name, 'true', list[i]);
			}
		}
	}
}