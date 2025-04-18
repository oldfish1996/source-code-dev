(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Redux = {}));
})(this, (function (exports) { 'use strict';

    const $$observable = /* #__PURE__ */ (() => (typeof Symbol === 'function' && Symbol.observable) || '@@observable')();

    /**
     * These are private action types reserved by Redux.
     * For any unknown actions, you must return the current state.
     * If the current state is undefined, you must return the initial state.
     * Do not reference these action types directly in your code.
     */
    const randomString = () => Math.random().toString(36).substring(7).split('').join('.');
    const ActionTypes = {
        INIT: `@@redux/INIT${ /* #__PURE__ */randomString()}`,
        REPLACE: `@@redux/REPLACE${ /* #__PURE__ */randomString()}`,
        PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
    };

    /**
     * @param obj The object to inspect.
     * @returns True if the argument appears to be a plain object.
     */
    function isPlainObject(obj) {
        if (typeof obj !== 'object' || obj === null)
            return false;
        let proto = obj;
        while (Object.getPrototypeOf(proto) !== null) {
            proto = Object.getPrototypeOf(proto);
        }
        return (Object.getPrototypeOf(obj) === proto || Object.getPrototypeOf(obj) === null);
    }

    // Inlined / shortened version of `kindOf` from https://github.com/jonschlinkert/kind-of
    function miniKindOf(val) {
        if (val === void 0)
            return 'undefined';
        if (val === null)
            return 'null';
        const type = typeof val;
        switch (type) {
            case 'boolean':
            case 'string':
            case 'number':
            case 'symbol':
            case 'function': {
                return type;
            }
        }
        if (Array.isArray(val))
            return 'array';
        if (isDate(val))
            return 'date';
        if (isError(val))
            return 'error';
        const constructorName = ctorName(val);
        switch (constructorName) {
            case 'Symbol':
            case 'Promise':
            case 'WeakMap':
            case 'WeakSet':
            case 'Map':
            case 'Set':
                return constructorName;
        }
        // other
        return Object.prototype.toString
            .call(val)
            .slice(8, -1)
            .toLowerCase()
            .replace(/\s/g, '');
    }
    function ctorName(val) {
        return typeof val.constructor === 'function' ? val.constructor.name : null;
    }
    function isError(val) {
        return (val instanceof Error ||
            (typeof val.message === 'string' &&
                val.constructor &&
                typeof val.constructor.stackTraceLimit === 'number'));
    }
    function isDate(val) {
        if (val instanceof Date)
            return true;
        return (typeof val.toDateString === 'function' &&
            typeof val.getDate === 'function' &&
            typeof val.setDate === 'function');
    }
    function kindOf(val) {
        let typeOfVal = typeof val;
        if (process.env.NODE_ENV !== 'production') {
            typeOfVal = miniKindOf(val);
        }
        return typeOfVal;
    }

    function createStore(reducer, preloadedState, enhancer) {
        if (typeof reducer !== 'function') {
            throw new Error(`Expected the root reducer to be a function. Instead, received: '${kindOf(reducer)}'`);
        }
        if ((typeof preloadedState === 'function' && typeof enhancer === 'function') ||
            (typeof enhancer === 'function' && typeof arguments[3] === 'function')) {
            throw new Error('It looks like you are passing several store enhancers to ' +
                'createStore(). This is not supported. Instead, compose them ' +
                'together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.');
        }
        if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
            enhancer = preloadedState;
            preloadedState = undefined;
        }
        if (typeof enhancer !== 'undefined') {
            if (typeof enhancer !== 'function') {
                throw new Error(`Expected the enhancer to be a function. Instead, received: '${kindOf(enhancer)}'`);
            }
            return enhancer(createStore)(reducer, preloadedState);
        }
        let currentReducer = reducer;
        let currentState = preloadedState;
        let currentListeners = new Map();
        let nextListeners = currentListeners;
        let listenerIdCounter = 0;
        let isDispatching = false;
        /**
         * This makes a shallow copy of currentListeners so we can use
         * nextListeners as a temporary list while dispatching.
         *
         * This prevents any bugs around consumers calling
         * subscribe/unsubscribe in the middle of a dispatch.
         */
        function ensureCanMutateNextListeners() {
            if (nextListeners === currentListeners) {
                nextListeners = new Map();
                currentListeners.forEach((listener, key) => {
                    nextListeners.set(key, listener);
                });
            }
        }
        /**
         * Reads the state tree managed by the store.
         *
         * @returns The current state tree of your application.
         */
        function getState() {
            if (isDispatching) {
                throw new Error('You may not call store.getState() while the reducer is executing. ' +
                    'The reducer has already received the state as an argument. ' +
                    'Pass it down from the top reducer instead of reading it from the store.');
            }
            return currentState;
        }
        /**
         * Adds a change listener. It will be called any time an action is dispatched,
         * and some part of the state tree may potentially have changed. You may then
         * call `getState()` to read the current state tree inside the callback.
         *
         * You may call `dispatch()` from a change listener, with the following
         * caveats:
         *
         * 1. The subscriptions are snapshotted just before every `dispatch()` call.
         * If you subscribe or unsubscribe while the listeners are being invoked, this
         * will not have any effect on the `dispatch()` that is currently in progress.
         * However, the next `dispatch()` call, whether nested or not, will use a more
         * recent snapshot of the subscription list.
         *
         * 2. The listener should not expect to see all state changes, as the state
         * might have been updated multiple times during a nested `dispatch()` before
         * the listener is called. It is, however, guaranteed that all subscribers
         * registered before the `dispatch()` started will be called with the latest
         * state by the time it exits.
         *
         * @param listener A callback to be invoked on every dispatch.
         * @returns A function to remove this change listener.
         */
        function subscribe(listener) {
            if (typeof listener !== 'function') {
                throw new Error(`Expected the listener to be a function. Instead, received: '${kindOf(listener)}'`);
            }
            if (isDispatching) {
                throw new Error('You may not call store.subscribe() while the reducer is executing. ' +
                    'If you would like to be notified after the store has been updated, subscribe from a ' +
                    'component and invoke store.getState() in the callback to access the latest state. ' +
                    'See https://redux.js.org/api/store#subscribelistener for more details.');
            }
            let isSubscribed = true;
            ensureCanMutateNextListeners();
            const listenerId = listenerIdCounter++;
            nextListeners.set(listenerId, listener);
            return function unsubscribe() {
                if (!isSubscribed) {
                    return;
                }
                if (isDispatching) {
                    throw new Error('You may not unsubscribe from a store listener while the reducer is executing. ' +
                        'See https://redux.js.org/api/store#subscribelistener for more details.');
                }
                isSubscribed = false;
                ensureCanMutateNextListeners();
                nextListeners.delete(listenerId);
                currentListeners = null;
            };
        }
        /**
         * Dispatches an action. It is the only way to trigger a state change.
         *
         * The `reducer` function, used to create the store, will be called with the
         * current state tree and the given `action`. Its return value will
         * be considered the **next** state of the tree, and the change listeners
         * will be notified.
         *
         * The base implementation only supports plain object actions. If you want to
         * dispatch a Promise, an Observable, a thunk, or something else, you need to
         * wrap your store creating function into the corresponding middleware. For
         * example, see the documentation for the `redux-thunk` package. Even the
         * middleware will eventually dispatch plain object actions using this method.
         *
         * @param action A plain object representing “what changed”. It is
         * a good idea to keep actions serializable so you can record and replay user
         * sessions, or use the time travelling `redux-devtools`. An action must have
         * a `type` property which may not be `undefined`. It is a good idea to use
         * string constants for action types.
         *
         * @returns For convenience, the same action object you dispatched.
         *
         * Note that, if you use a custom middleware, it may wrap `dispatch()` to
         * return something else (for example, a Promise you can await).
         */
        function dispatch(action) {
            if (!isPlainObject(action)) {
                throw new Error(`Actions must be plain objects. Instead, the actual type was: '${kindOf(action)}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`);
            }
            if (typeof action.type === 'undefined') {
                throw new Error('Actions may not have an undefined "type" property. You may have misspelled an action type string constant.');
            }
            if (typeof action.type !== 'string') {
                throw new Error(`Action "type" property must be a string. Instead, the actual type was: '${kindOf(action.type)}'. Value was: '${action.type}' (stringified)`);
            }
            if (isDispatching) {
                throw new Error('Reducers may not dispatch actions.');
            }
            try {
                isDispatching = true;
                currentState = currentReducer(currentState, action);
            }
            finally {
                isDispatching = false;
            }
            const listeners = (currentListeners = nextListeners);
            listeners.forEach(listener => {
                listener();
            });
            return action;
        }
        /**
         * Replaces the reducer currently used by the store to calculate the state.
         *
         * You might need this if your app implements code splitting and you want to
         * load some of the reducers dynamically. You might also need this if you
         * implement a hot reloading mechanism for Redux.
         *
         * @param nextReducer The reducer for the store to use instead.
         */
        function replaceReducer(nextReducer) {
            if (typeof nextReducer !== 'function') {
                throw new Error(`Expected the nextReducer to be a function. Instead, received: '${kindOf(nextReducer)}`);
            }
            currentReducer = nextReducer;
            // This action has a similar effect to ActionTypes.INIT.
            // Any reducers that existed in both the new and old rootReducer
            // will receive the previous state. This effectively populates
            // the new state tree with any relevant data from the old one.
            dispatch({ type: ActionTypes.REPLACE });
        }
        /**
         * Interoperability point for observable/reactive libraries.
         * @returns A minimal observable of state changes.
         * For more information, see the observable proposal:
         * https://github.com/tc39/proposal-observable
         */
        function observable() {
            const outerSubscribe = subscribe;
            return {
                /**
                 * The minimal observable subscription method.
                 * @param observer Any object that can be used as an observer.
                 * The observer object should have a `next` method.
                 * @returns An object with an `unsubscribe` method that can
                 * be used to unsubscribe the observable from the store, and prevent further
                 * emission of values from the observable.
                 */
                subscribe(observer) {
                    if (typeof observer !== 'object' || observer === null) {
                        throw new TypeError(`Expected the observer to be an object. Instead, received: '${kindOf(observer)}'`);
                    }
                    function observeState() {
                        const observerAsObserver = observer;
                        if (observerAsObserver.next) {
                            observerAsObserver.next(getState());
                        }
                    }
                    observeState();
                    const unsubscribe = outerSubscribe(observeState);
                    return { unsubscribe };
                },
                [$$observable]() {
                    return this;
                }
            };
        }
        // When a store is created, an "INIT" action is dispatched so that every
        // reducer returns their initial state. This effectively populates
        // the initial state tree.
        dispatch({ type: ActionTypes.INIT });
        const store = {
            dispatch: dispatch,
            subscribe,
            getState,
            replaceReducer,
            [$$observable]: observable
        };
        return store;
    }
    function legacy_createStore(reducer, preloadedState, enhancer) {
        return createStore(reducer, preloadedState, enhancer);
    }

    /**
     * Prints a warning in the console if it exists.
     *
     * @param message The warning message.
     */
    function warning(message) {
        /* eslint-disable no-console */
        if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error(message);
        }
        /* eslint-enable no-console */
        try {
            // This error was thrown as a convenience so that if you enable
            // "break on all exceptions" in your console,
            // it would pause the execution at this line.
            throw new Error(message);
        }
        catch (e) { } // eslint-disable-line no-empty
    }

    function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
        const reducerKeys = Object.keys(reducers);
        const argumentName = action && action.type === ActionTypes.INIT
            ? 'preloadedState argument passed to createStore'
            : 'previous state received by the reducer';
        if (reducerKeys.length === 0) {
            return ('Store does not have a valid reducer. Make sure the argument passed ' +
                'to combineReducers is an object whose values are reducers.');
        }
        if (!isPlainObject(inputState)) {
            return (`The ${argumentName} has unexpected type of "${kindOf(inputState)}". Expected argument to be an object with the following ` +
                `keys: "${reducerKeys.join('", "')}"`);
        }
        const unexpectedKeys = Object.keys(inputState).filter(key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]);
        unexpectedKeys.forEach(key => {
            unexpectedKeyCache[key] = true;
        });
        if (action && action.type === ActionTypes.REPLACE)
            return;
        if (unexpectedKeys.length > 0) {
            return (`Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
                `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
                `Expected to find one of the known reducer keys instead: ` +
                `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`);
        }
    }
    function assertReducerShape(reducers) {
        Object.keys(reducers).forEach(key => {
            const reducer = reducers[key];
            const initialState = reducer(undefined, { type: ActionTypes.INIT });
            if (typeof initialState === 'undefined') {
                throw new Error(`The slice reducer for key "${key}" returned undefined during initialization. ` +
                    `If the state passed to the reducer is undefined, you must ` +
                    `explicitly return the initial state. The initial state may ` +
                    `not be undefined. If you don't want to set a value for this reducer, ` +
                    `you can use null instead of undefined.`);
            }
            if (typeof reducer(undefined, {
                type: ActionTypes.PROBE_UNKNOWN_ACTION()
            }) === 'undefined') {
                throw new Error(`The slice reducer for key "${key}" returned undefined when probed with a random type. ` +
                    `Don't try to handle '${ActionTypes.INIT}' or other actions in "redux/*" ` +
                    `namespace. They are considered private. Instead, you must return the ` +
                    `current state for any unknown actions, unless it is undefined, ` +
                    `in which case you must return the initial state, regardless of the ` +
                    `action type. The initial state may not be undefined, but can be null.`);
            }
        });
    }
    function combineReducers(reducers) {
        const reducerKeys = Object.keys(reducers);
        const finalReducers = {};
        for (let i = 0; i < reducerKeys.length; i++) {
            const key = reducerKeys[i];
            if (process.env.NODE_ENV !== 'production') {
                if (typeof reducers[key] === 'undefined') {
                    warning(`No reducer provided for key "${key}"`);
                }
            }
            if (typeof reducers[key] === 'function') {
                finalReducers[key] = reducers[key];
            }
        }
        const finalReducerKeys = Object.keys(finalReducers);
        // This is used to make sure we don't warn about the same
        // keys multiple times.
        let unexpectedKeyCache;
        if (process.env.NODE_ENV !== 'production') {
            unexpectedKeyCache = {};
        }
        let shapeAssertionError;
        try {
            assertReducerShape(finalReducers);
        }
        catch (e) {
            shapeAssertionError = e;
        }
        return function combination(state = {}, action) {
            if (shapeAssertionError) {
                throw shapeAssertionError;
            }
            if (process.env.NODE_ENV !== 'production') {
                const warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);
                if (warningMessage) {
                    warning(warningMessage);
                }
            }
            let hasChanged = false;
            const nextState = {};
            for (let i = 0; i < finalReducerKeys.length; i++) {
                const key = finalReducerKeys[i];
                const reducer = finalReducers[key];
                const previousStateForKey = state[key];
                const nextStateForKey = reducer(previousStateForKey, action);
                if (typeof nextStateForKey === 'undefined') {
                    const actionType = action && action.type;
                    throw new Error(`When called with an action of type ${actionType ? `"${String(actionType)}"` : '(unknown type)'}, the slice reducer for key "${key}" returned undefined. ` +
                        `To ignore an action, you must explicitly return the previous state. ` +
                        `If you want this reducer to hold no value, you can return null instead of undefined.`);
                }
                nextState[key] = nextStateForKey;
                hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
            }
            hasChanged =
                hasChanged || finalReducerKeys.length !== Object.keys(state).length;
            return hasChanged ? nextState : state;
        };
    }

    function bindActionCreator(actionCreator, dispatch) {
        return function (...args) {
            return dispatch(actionCreator.apply(this, args));
        };
    }
    function bindActionCreators(actionCreators, dispatch) {
        if (typeof actionCreators === 'function') {
            return bindActionCreator(actionCreators, dispatch);
        }
        if (typeof actionCreators !== 'object' || actionCreators === null) {
            throw new Error(`bindActionCreators expected an object or a function, but instead received: '${kindOf(actionCreators)}'. ` +
                `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`);
        }
        const boundActionCreators = {};
        for (const key in actionCreators) {
            const actionCreator = actionCreators[key];
            if (typeof actionCreator === 'function') {
                boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
            }
        }
        return boundActionCreators;
    }

    function compose(...funcs) {
        if (funcs.length === 0) {
            // infer the argument type so it is usable in inference down the line
            return (arg) => arg;
        }
        if (funcs.length === 1) {
            return funcs[0];
        }
        return funcs.reduce((a, b) => (...args) => a(b(...args)));
    }

    function applyMiddleware(...middlewares) {
        return createStore => (reducer, preloadedState) => {
            const store = createStore(reducer, preloadedState);
            let dispatch = () => {
                throw new Error('Dispatching while constructing your middleware is not allowed. ' +
                    'Other middleware would not be applied to this dispatch.');
            };
            const middlewareAPI = {
                getState: store.getState,
                dispatch: (action, ...args) => dispatch(action, ...args)
            };
            const chain = middlewares.map(middleware => middleware(middlewareAPI));
            dispatch = compose(...chain)(store.dispatch);
            return {
                ...store,
                dispatch
            };
        };
    }

    function isAction(action) {
        return (isPlainObject(action) &&
            'type' in action &&
            typeof action.type === 'string');
    }

    exports.__DO_NOT_USE__ActionTypes = ActionTypes;
    exports.applyMiddleware = applyMiddleware;
    exports.bindActionCreators = bindActionCreators;
    exports.combineReducers = combineReducers;
    exports.compose = compose;
    exports.createStore = createStore;
    exports.isAction = isAction;
    exports.isPlainObject = isPlainObject;
    exports.legacy_createStore = legacy_createStore;

}));
//# sourceMappingURL=redux.js.map
