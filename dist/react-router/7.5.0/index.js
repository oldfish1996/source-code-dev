(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
    typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ReactRouter = {}, global.React));
})(this, (function (exports, React) { 'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

    ////////////////////////////////////////////////////////////////////////////////
    //#region Types and Constants
    ////////////////////////////////////////////////////////////////////////////////
    /**
     * Actions represent the type of change to a location value.
     */
    exports.NavigationType = void 0;
    (function (Action) {
        /**
         * A POP indicates a change to an arbitrary index in the history stack, such
         * as a back or forward navigation. It does not describe the direction of the
         * navigation, only that the current index changed.
         *
         * Note: This is the default action for newly created history objects.
         */
        Action["Pop"] = "POP";
        /**
         * A PUSH indicates a new entry being added to the history stack, such as when
         * a link is clicked and a new page loads. When this happens, all subsequent
         * entries in the stack are lost.
         */
        Action["Push"] = "PUSH";
        /**
         * A REPLACE indicates the entry at the current index in the history stack
         * being replaced by a new one.
         */
        Action["Replace"] = "REPLACE";
    })(exports.NavigationType || (exports.NavigationType = {}));
    const PopStateEventType = "popstate";
    /**
     * Memory history stores the current location in memory. It is designed for use
     * in stateful non-browser environments like tests and React Native.
     */
    function createMemoryHistory(options = {}) {
        let { initialEntries = ["/"], initialIndex, v5Compat = false } = options;
        let entries; // Declare so we can access from createMemoryLocation
        entries = initialEntries.map((entry, index) => createMemoryLocation(entry, typeof entry === "string" ? null : entry.state, index === 0 ? "default" : undefined));
        let index = clampIndex(initialIndex == null ? entries.length - 1 : initialIndex);
        let action = exports.NavigationType.Pop;
        let listener = null;
        function clampIndex(n) {
            return Math.min(Math.max(n, 0), entries.length - 1);
        }
        function getCurrentLocation() {
            return entries[index];
        }
        function createMemoryLocation(to, state = null, key) {
            let location = createLocation(entries ? getCurrentLocation().pathname : "/", to, state, key);
            warning(location.pathname.charAt(0) === "/", `relative pathnames are not supported in memory history: ${JSON.stringify(to)}`);
            return location;
        }
        function createHref(to) {
            return typeof to === "string" ? to : createPath(to);
        }
        let history = {
            get index() {
                return index;
            },
            get action() {
                return action;
            },
            get location() {
                return getCurrentLocation();
            },
            createHref,
            createURL(to) {
                return new URL(createHref(to), "http://localhost");
            },
            encodeLocation(to) {
                let path = typeof to === "string" ? parsePath(to) : to;
                return {
                    pathname: path.pathname || "",
                    search: path.search || "",
                    hash: path.hash || "",
                };
            },
            push(to, state) {
                action = exports.NavigationType.Push;
                let nextLocation = createMemoryLocation(to, state);
                index += 1;
                entries.splice(index, entries.length, nextLocation);
                if (v5Compat && listener) {
                    listener({ action, location: nextLocation, delta: 1 });
                }
            },
            replace(to, state) {
                action = exports.NavigationType.Replace;
                let nextLocation = createMemoryLocation(to, state);
                entries[index] = nextLocation;
                if (v5Compat && listener) {
                    listener({ action, location: nextLocation, delta: 0 });
                }
            },
            go(delta) {
                action = exports.NavigationType.Pop;
                let nextIndex = clampIndex(index + delta);
                let nextLocation = entries[nextIndex];
                index = nextIndex;
                if (listener) {
                    listener({ action, location: nextLocation, delta });
                }
            },
            listen(fn) {
                listener = fn;
                return () => {
                    listener = null;
                };
            },
        };
        return history;
    }
    /**
     * Browser history stores the location in regular URLs. This is the standard for
     * most web apps, but it requires some configuration on the server to ensure you
     * serve the same app at multiple URLs.
     *
     * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#createbrowserhistory
     */
    function createBrowserHistory(options = {}) {
        function createBrowserLocation(window, globalHistory) {
            let { pathname, search, hash } = window.location;
            return createLocation("", { pathname, search, hash }, 
            // state defaults to `null` because `window.history.state` does
            (globalHistory.state && globalHistory.state.usr) || null, (globalHistory.state && globalHistory.state.key) || "default");
        }
        function createBrowserHref(window, to) {
            return typeof to === "string" ? to : createPath(to);
        }
        return getUrlBasedHistory(createBrowserLocation, createBrowserHref, null, options);
    }
    /**
     * Hash history stores the location in window.location.hash. This makes it ideal
     * for situations where you don't want to send the location to the server for
     * some reason, either because you do cannot configure it or the URL space is
     * reserved for something else.
     *
     * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#createhashhistory
     */
    function createHashHistory(options = {}) {
        function createHashLocation(window, globalHistory) {
            let { pathname = "/", search = "", hash = "", } = parsePath(window.location.hash.substring(1));
            // Hash URL should always have a leading / just like window.location.pathname
            // does, so if an app ends up at a route like /#something then we add a
            // leading slash so all of our path-matching behaves the same as if it would
            // in a browser router.  This is particularly important when there exists a
            // root splat route (<Route path="*">) since that matches internally against
            // "/*" and we'd expect /#something to 404 in a hash router app.
            if (!pathname.startsWith("/") && !pathname.startsWith(".")) {
                pathname = "/" + pathname;
            }
            return createLocation("", { pathname, search, hash }, 
            // state defaults to `null` because `window.history.state` does
            (globalHistory.state && globalHistory.state.usr) || null, (globalHistory.state && globalHistory.state.key) || "default");
        }
        function createHashHref(window, to) {
            let base = window.document.querySelector("base");
            let href = "";
            if (base && base.getAttribute("href")) {
                let url = window.location.href;
                let hashIndex = url.indexOf("#");
                href = hashIndex === -1 ? url : url.slice(0, hashIndex);
            }
            return href + "#" + (typeof to === "string" ? to : createPath(to));
        }
        function validateHashLocation(location, to) {
            warning(location.pathname.charAt(0) === "/", `relative pathnames are not supported in hash history.push(${JSON.stringify(to)})`);
        }
        return getUrlBasedHistory(createHashLocation, createHashHref, validateHashLocation, options);
    }
    function invariant$2(value, message) {
        if (value === false || value === null || typeof value === "undefined") {
            throw new Error(message);
        }
    }
    function warning(cond, message) {
        if (!cond) {
            if (typeof console !== "undefined")
                console.warn(message);
            try {
                // Welcome to debugging history!
                //
                // This error is thrown as a convenience, so you can more easily
                // find the source for a warning that appears in the console by
                // enabling "pause on exceptions" in your JavaScript debugger.
                throw new Error(message);
            }
            catch (e) { }
        }
    }
    function createKey$1() {
        return Math.random().toString(36).substring(2, 10);
    }
    /**
     * For browser-based histories, we combine the state and key into an object
     */
    function getHistoryState(location, index) {
        return {
            usr: location.state,
            key: location.key,
            idx: index,
        };
    }
    /**
     * Creates a Location object with a unique key from the given Path
     */
    function createLocation(current, to, state = null, key) {
        let location = {
            pathname: typeof current === "string" ? current : current.pathname,
            search: "",
            hash: "",
            ...(typeof to === "string" ? parsePath(to) : to),
            state,
            // TODO: This could be cleaned up.  push/replace should probably just take
            // full Locations now and avoid the need to run through this flow at all
            // But that's a pretty big refactor to the current test suite so going to
            // keep as is for the time being and just let any incoming keys take precedence
            key: (to && to.key) || key || createKey$1(),
        };
        return location;
    }
    /**
     * Creates a string URL path from the given pathname, search, and hash components.
     *
     * @category Utils
     */
    function createPath({ pathname = "/", search = "", hash = "", }) {
        if (search && search !== "?")
            pathname += search.charAt(0) === "?" ? search : "?" + search;
        if (hash && hash !== "#")
            pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
        return pathname;
    }
    /**
     * Parses a string URL path into its separate pathname, search, and hash components.
     *
     * @category Utils
     */
    function parsePath(path) {
        let parsedPath = {};
        if (path) {
            let hashIndex = path.indexOf("#");
            if (hashIndex >= 0) {
                parsedPath.hash = path.substring(hashIndex);
                path = path.substring(0, hashIndex);
            }
            let searchIndex = path.indexOf("?");
            if (searchIndex >= 0) {
                parsedPath.search = path.substring(searchIndex);
                path = path.substring(0, searchIndex);
            }
            if (path) {
                parsedPath.pathname = path;
            }
        }
        return parsedPath;
    }
    function getUrlBasedHistory(getLocation, createHref, validateLocation, options = {}) {
        let { window = document.defaultView, v5Compat = false } = options;
        let globalHistory = window.history;
        let action = exports.NavigationType.Pop;
        let listener = null;
        let index = getIndex();
        // Index should only be null when we initialize. If not, it's because the
        // user called history.pushState or history.replaceState directly, in which
        // case we should log a warning as it will result in bugs.
        if (index == null) {
            index = 0;
            globalHistory.replaceState({ ...globalHistory.state, idx: index }, "");
        }
        function getIndex() {
            let state = globalHistory.state || { idx: null };
            return state.idx;
        }
        function handlePop() {
            action = exports.NavigationType.Pop;
            let nextIndex = getIndex();
            let delta = nextIndex == null ? null : nextIndex - index;
            index = nextIndex;
            if (listener) {
                listener({ action, location: history.location, delta });
            }
        }
        function push(to, state) {
            action = exports.NavigationType.Push;
            let location = createLocation(history.location, to, state);
            if (validateLocation)
                validateLocation(location, to);
            index = getIndex() + 1;
            let historyState = getHistoryState(location, index);
            let url = history.createHref(location);
            // try...catch because iOS limits us to 100 pushState calls :/
            try {
                globalHistory.pushState(historyState, "", url);
            }
            catch (error) {
                // If the exception is because `state` can't be serialized, let that throw
                // outwards just like a replace call would so the dev knows the cause
                // https://html.spec.whatwg.org/multipage/nav-history-apis.html#shared-history-push/replace-state-steps
                // https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeinternal
                if (error instanceof DOMException && error.name === "DataCloneError") {
                    throw error;
                }
                // They are going to lose state here, but there is no real
                // way to warn them about it since the page will refresh...
                window.location.assign(url);
            }
            if (v5Compat && listener) {
                listener({ action, location: history.location, delta: 1 });
            }
        }
        function replace(to, state) {
            action = exports.NavigationType.Replace;
            let location = createLocation(history.location, to, state);
            if (validateLocation)
                validateLocation(location, to);
            index = getIndex();
            let historyState = getHistoryState(location, index);
            let url = history.createHref(location);
            globalHistory.replaceState(historyState, "", url);
            if (v5Compat && listener) {
                listener({ action, location: history.location, delta: 0 });
            }
        }
        function createURL(to) {
            // window.location.origin is "null" (the literal string value) in Firefox
            // under certain conditions, notably when serving from a local HTML file
            // See https://bugzilla.mozilla.org/show_bug.cgi?id=878297
            let base = window.location.origin !== "null"
                ? window.location.origin
                : window.location.href;
            let href = typeof to === "string" ? to : createPath(to);
            // Treating this as a full URL will strip any trailing spaces so we need to
            // pre-encode them since they might be part of a matching splat param from
            // an ancestor route
            href = href.replace(/ $/, "%20");
            invariant$2(base, `No window.location.(origin|href) available to create URL for href: ${href}`);
            return new URL(href, base);
        }
        let history = {
            get action() {
                return action;
            },
            get location() {
                return getLocation(window, globalHistory);
            },
            listen(fn) {
                if (listener) {
                    throw new Error("A history only accepts one active listener");
                }
                window.addEventListener(PopStateEventType, handlePop);
                listener = fn;
                return () => {
                    window.removeEventListener(PopStateEventType, handlePop);
                    listener = null;
                };
            },
            createHref(to) {
                return createHref(window, to);
            },
            createURL,
            encodeLocation(to) {
                // Encode a Location the same way window.location would
                let url = createURL(to);
                return {
                    pathname: url.pathname,
                    search: url.search,
                    hash: url.hash,
                };
            },
            push,
            replace,
            go(n) {
                return globalHistory.go(n);
            },
        };
        return history;
    }
    //#endregion

    var ResultType;
    (function (ResultType) {
        ResultType["data"] = "data";
        ResultType["redirect"] = "redirect";
        ResultType["error"] = "error";
    })(ResultType || (ResultType = {}));
    /**
     * Creates a context object that may be used to store and retrieve arbitrary values.
     *
     * If a `defaultValue` is provided, it will be returned from `context.get()` when no value has been
     * set for the context. Otherwise reading this context when no value has been set will throw an
     * error.
     *
     * @param defaultValue The default value for the context
     * @returns A context object
     */
    function unstable_createContext(defaultValue) {
        return { defaultValue };
    }
    /**
     * Provides methods for writing/reading values in application context in a typesafe way.
     */
    class unstable_RouterContextProvider {
        #map = new Map();
        constructor(init) {
            if (init) {
                for (let [context, value] of init) {
                    this.set(context, value);
                }
            }
        }
        get(context) {
            if (this.#map.has(context)) {
                return this.#map.get(context);
            }
            if (context.defaultValue !== undefined) {
                return context.defaultValue;
            }
            throw new Error("No value found for context");
        }
        set(context, value) {
            this.#map.set(context, value);
        }
    }
    const unsupportedLazyRouteObjectKeys = new Set([
        "lazy",
        "caseSensitive",
        "path",
        "id",
        "index",
        "children",
    ]);
    function isUnsupportedLazyRouteObjectKey(key) {
        return unsupportedLazyRouteObjectKeys.has(key);
    }
    const unsupportedLazyRouteFunctionKeys = new Set([
        "lazy",
        "caseSensitive",
        "path",
        "id",
        "index",
        "unstable_middleware",
        "children",
    ]);
    function isUnsupportedLazyRouteFunctionKey(key) {
        return unsupportedLazyRouteFunctionKeys.has(key);
    }
    function isIndexRoute(route) {
        return route.index === true;
    }
    // Walk the route tree generating unique IDs where necessary, so we are working
    // solely with AgnosticDataRouteObject's within the Router
    function convertRoutesToDataRoutes(routes, mapRouteProperties, parentPath = [], manifest = {}) {
        return routes.map((route, index) => {
            let treePath = [...parentPath, String(index)];
            let id = typeof route.id === "string" ? route.id : treePath.join("-");
            invariant$2(route.index !== true || !route.children, `Cannot specify children on an index route`);
            invariant$2(!manifest[id], `Found a route id collision on id "${id}".  Route ` +
                "id's must be globally unique within Data Router usages");
            if (isIndexRoute(route)) {
                let indexRoute = {
                    ...route,
                    ...mapRouteProperties(route),
                    id,
                };
                manifest[id] = indexRoute;
                return indexRoute;
            }
            else {
                let pathOrLayoutRoute = {
                    ...route,
                    ...mapRouteProperties(route),
                    id,
                    children: undefined,
                };
                manifest[id] = pathOrLayoutRoute;
                if (route.children) {
                    pathOrLayoutRoute.children = convertRoutesToDataRoutes(route.children, mapRouteProperties, treePath, manifest);
                }
                return pathOrLayoutRoute;
            }
        });
    }
    /**
     * Matches the given routes to a location and returns the match data.
     *
     * @category Utils
     */
    function matchRoutes(routes, locationArg, basename = "/") {
        return matchRoutesImpl(routes, locationArg, basename, false);
    }
    function matchRoutesImpl(routes, locationArg, basename, allowPartial) {
        let location = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
        let pathname = stripBasename(location.pathname || "/", basename);
        if (pathname == null) {
            return null;
        }
        let branches = flattenRoutes(routes);
        rankRouteBranches(branches);
        let matches = null;
        for (let i = 0; matches == null && i < branches.length; ++i) {
            // Incoming pathnames are generally encoded from either window.location
            // or from router.navigate, but we want to match against the unencoded
            // paths in the route definitions.  Memory router locations won't be
            // encoded here but there also shouldn't be anything to decode so this
            // should be a safe operation.  This avoids needing matchRoutes to be
            // history-aware.
            let decoded = decodePath(pathname);
            matches = matchRouteBranch(branches[i], decoded, allowPartial);
        }
        return matches;
    }
    function convertRouteMatchToUiMatch(match, loaderData) {
        let { route, pathname, params } = match;
        return {
            id: route.id,
            pathname,
            params,
            data: loaderData[route.id],
            handle: route.handle,
        };
    }
    function flattenRoutes(routes, branches = [], parentsMeta = [], parentPath = "") {
        let flattenRoute = (route, index, relativePath) => {
            let meta = {
                relativePath: relativePath === undefined ? route.path || "" : relativePath,
                caseSensitive: route.caseSensitive === true,
                childrenIndex: index,
                route,
            };
            if (meta.relativePath.startsWith("/")) {
                invariant$2(meta.relativePath.startsWith(parentPath), `Absolute route path "${meta.relativePath}" nested under path ` +
                    `"${parentPath}" is not valid. An absolute child route path ` +
                    `must start with the combined path of all its parent routes.`);
                meta.relativePath = meta.relativePath.slice(parentPath.length);
            }
            let path = joinPaths([parentPath, meta.relativePath]);
            let routesMeta = parentsMeta.concat(meta);
            // Add the children before adding this route to the array, so we traverse the
            // route tree depth-first and child routes appear before their parents in
            // the "flattened" version.
            if (route.children && route.children.length > 0) {
                invariant$2(
                // Our types know better, but runtime JS may not!
                // @ts-expect-error
                route.index !== true, `Index routes must not have child routes. Please remove ` +
                    `all child routes from route path "${path}".`);
                flattenRoutes(route.children, branches, routesMeta, path);
            }
            // Routes without a path shouldn't ever match by themselves unless they are
            // index routes, so don't add them to the list of possible branches.
            if (route.path == null && !route.index) {
                return;
            }
            branches.push({
                path,
                score: computeScore(path, route.index),
                routesMeta,
            });
        };
        routes.forEach((route, index) => {
            // coarse-grain check for optional params
            if (route.path === "" || !route.path?.includes("?")) {
                flattenRoute(route, index);
            }
            else {
                for (let exploded of explodeOptionalSegments(route.path)) {
                    flattenRoute(route, index, exploded);
                }
            }
        });
        return branches;
    }
    /**
     * Computes all combinations of optional path segments for a given path,
     * excluding combinations that are ambiguous and of lower priority.
     *
     * For example, `/one/:two?/three/:four?/:five?` explodes to:
     * - `/one/three`
     * - `/one/:two/three`
     * - `/one/three/:four`
     * - `/one/three/:five`
     * - `/one/:two/three/:four`
     * - `/one/:two/three/:five`
     * - `/one/three/:four/:five`
     * - `/one/:two/three/:four/:five`
     */
    function explodeOptionalSegments(path) {
        let segments = path.split("/");
        if (segments.length === 0)
            return [];
        let [first, ...rest] = segments;
        // Optional path segments are denoted by a trailing `?`
        let isOptional = first.endsWith("?");
        // Compute the corresponding required segment: `foo?` -> `foo`
        let required = first.replace(/\?$/, "");
        if (rest.length === 0) {
            // Interpret empty string as omitting an optional segment
            // `["one", "", "three"]` corresponds to omitting `:two` from `/one/:two?/three` -> `/one/three`
            return isOptional ? [required, ""] : [required];
        }
        let restExploded = explodeOptionalSegments(rest.join("/"));
        let result = [];
        // All child paths with the prefix.  Do this for all children before the
        // optional version for all children, so we get consistent ordering where the
        // parent optional aspect is preferred as required.  Otherwise, we can get
        // child sections interspersed where deeper optional segments are higher than
        // parent optional segments, where for example, /:two would explode _earlier_
        // then /:one.  By always including the parent as required _for all children_
        // first, we avoid this issue
        result.push(...restExploded.map((subpath) => subpath === "" ? required : [required, subpath].join("/")));
        // Then, if this is an optional value, add all child versions without
        if (isOptional) {
            result.push(...restExploded);
        }
        // for absolute paths, ensure `/` instead of empty segment
        return result.map((exploded) => path.startsWith("/") && exploded === "" ? "/" : exploded);
    }
    function rankRouteBranches(branches) {
        branches.sort((a, b) => a.score !== b.score
            ? b.score - a.score // Higher score first
            : compareIndexes(a.routesMeta.map((meta) => meta.childrenIndex), b.routesMeta.map((meta) => meta.childrenIndex)));
    }
    const paramRe = /^:[\w-]+$/;
    const dynamicSegmentValue = 3;
    const indexRouteValue = 2;
    const emptySegmentValue = 1;
    const staticSegmentValue = 10;
    const splatPenalty = -2;
    const isSplat = (s) => s === "*";
    function computeScore(path, index) {
        let segments = path.split("/");
        let initialScore = segments.length;
        if (segments.some(isSplat)) {
            initialScore += splatPenalty;
        }
        if (index) {
            initialScore += indexRouteValue;
        }
        return segments
            .filter((s) => !isSplat(s))
            .reduce((score, segment) => score +
            (paramRe.test(segment)
                ? dynamicSegmentValue
                : segment === ""
                    ? emptySegmentValue
                    : staticSegmentValue), initialScore);
    }
    function compareIndexes(a, b) {
        let siblings = a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);
        return siblings
            ? // If two routes are siblings, we should try to match the earlier sibling
                // first. This allows people to have fine-grained control over the matching
                // behavior by simply putting routes with identical paths in the order they
                // want them tried.
                a[a.length - 1] - b[b.length - 1]
            : // Otherwise, it doesn't really make sense to rank non-siblings by index,
                // so they sort equally.
                0;
    }
    function matchRouteBranch(branch, pathname, allowPartial = false) {
        let { routesMeta } = branch;
        let matchedParams = {};
        let matchedPathname = "/";
        let matches = [];
        for (let i = 0; i < routesMeta.length; ++i) {
            let meta = routesMeta[i];
            let end = i === routesMeta.length - 1;
            let remainingPathname = matchedPathname === "/"
                ? pathname
                : pathname.slice(matchedPathname.length) || "/";
            let match = matchPath({ path: meta.relativePath, caseSensitive: meta.caseSensitive, end }, remainingPathname);
            let route = meta.route;
            if (!match &&
                end &&
                allowPartial &&
                !routesMeta[routesMeta.length - 1].route.index) {
                match = matchPath({
                    path: meta.relativePath,
                    caseSensitive: meta.caseSensitive,
                    end: false,
                }, remainingPathname);
            }
            if (!match) {
                return null;
            }
            Object.assign(matchedParams, match.params);
            matches.push({
                // TODO: Can this as be avoided?
                params: matchedParams,
                pathname: joinPaths([matchedPathname, match.pathname]),
                pathnameBase: normalizePathname(joinPaths([matchedPathname, match.pathnameBase])),
                route,
            });
            if (match.pathnameBase !== "/") {
                matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
            }
        }
        return matches;
    }
    /**
     * Returns a path with params interpolated.
     *
     * @category Utils
     */
    function generatePath(originalPath, params = {}) {
        let path = originalPath;
        if (path.endsWith("*") && path !== "*" && !path.endsWith("/*")) {
            warning(false, `Route path "${path}" will be treated as if it were ` +
                `"${path.replace(/\*$/, "/*")}" because the \`*\` character must ` +
                `always follow a \`/\` in the pattern. To get rid of this warning, ` +
                `please change the route path to "${path.replace(/\*$/, "/*")}".`);
            path = path.replace(/\*$/, "/*");
        }
        // ensure `/` is added at the beginning if the path is absolute
        const prefix = path.startsWith("/") ? "/" : "";
        const stringify = (p) => p == null ? "" : typeof p === "string" ? p : String(p);
        const segments = path
            .split(/\/+/)
            .map((segment, index, array) => {
            const isLastSegment = index === array.length - 1;
            // only apply the splat if it's the last segment
            if (isLastSegment && segment === "*") {
                const star = "*";
                // Apply the splat
                return stringify(params[star]);
            }
            const keyMatch = segment.match(/^:([\w-]+)(\??)$/);
            if (keyMatch) {
                const [, key, optional] = keyMatch;
                let param = params[key];
                invariant$2(optional === "?" || param != null, `Missing ":${key}" param`);
                return stringify(param);
            }
            // Remove any optional markers from optional static segments
            return segment.replace(/\?$/g, "");
        })
            // Remove empty segments
            .filter((segment) => !!segment);
        return prefix + segments.join("/");
    }
    /**
     * Performs pattern matching on a URL pathname and returns information about
     * the match.
     *
     * @category Utils
     */
    function matchPath(pattern, pathname) {
        if (typeof pattern === "string") {
            pattern = { path: pattern, caseSensitive: false, end: true };
        }
        let [matcher, compiledParams] = compilePath(pattern.path, pattern.caseSensitive, pattern.end);
        let match = pathname.match(matcher);
        if (!match)
            return null;
        let matchedPathname = match[0];
        let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
        let captureGroups = match.slice(1);
        let params = compiledParams.reduce((memo, { paramName, isOptional }, index) => {
            // We need to compute the pathnameBase here using the raw splat value
            // instead of using params["*"] later because it will be decoded then
            if (paramName === "*") {
                let splatValue = captureGroups[index] || "";
                pathnameBase = matchedPathname
                    .slice(0, matchedPathname.length - splatValue.length)
                    .replace(/(.)\/+$/, "$1");
            }
            const value = captureGroups[index];
            if (isOptional && !value) {
                memo[paramName] = undefined;
            }
            else {
                memo[paramName] = (value || "").replace(/%2F/g, "/");
            }
            return memo;
        }, {});
        return {
            params,
            pathname: matchedPathname,
            pathnameBase,
            pattern,
        };
    }
    function compilePath(path, caseSensitive = false, end = true) {
        warning(path === "*" || !path.endsWith("*") || path.endsWith("/*"), `Route path "${path}" will be treated as if it were ` +
            `"${path.replace(/\*$/, "/*")}" because the \`*\` character must ` +
            `always follow a \`/\` in the pattern. To get rid of this warning, ` +
            `please change the route path to "${path.replace(/\*$/, "/*")}".`);
        let params = [];
        let regexpSource = "^" +
            path
                .replace(/\/*\*?$/, "") // Ignore trailing / and /*, we'll handle it below
                .replace(/^\/*/, "/") // Make sure it has a leading /
                .replace(/[\\.*+^${}|()[\]]/g, "\\$&") // Escape special regex chars
                .replace(/\/:([\w-]+)(\?)?/g, (_, paramName, isOptional) => {
                params.push({ paramName, isOptional: isOptional != null });
                return isOptional ? "/?([^\\/]+)?" : "/([^\\/]+)";
            });
        if (path.endsWith("*")) {
            params.push({ paramName: "*" });
            regexpSource +=
                path === "*" || path === "/*"
                    ? "(.*)$" // Already matched the initial /, just match the rest
                    : "(?:\\/(.+)|\\/*)$"; // Don't include the / in params["*"]
        }
        else if (end) {
            // When matching to the end, ignore trailing slashes
            regexpSource += "\\/*$";
        }
        else if (path !== "" && path !== "/") {
            // If our path is non-empty and contains anything beyond an initial slash,
            // then we have _some_ form of path in our regex, so we should expect to
            // match only if we find the end of this path segment.  Look for an optional
            // non-captured trailing slash (to match a portion of the URL) or the end
            // of the path (if we've matched to the end).  We used to do this with a
            // word boundary but that gives false positives on routes like
            // /user-preferences since `-` counts as a word boundary.
            regexpSource += "(?:(?=\\/|$))";
        }
        else ;
        let matcher = new RegExp(regexpSource, caseSensitive ? undefined : "i");
        return [matcher, params];
    }
    function decodePath(value) {
        try {
            return value
                .split("/")
                .map((v) => decodeURIComponent(v).replace(/\//g, "%2F"))
                .join("/");
        }
        catch (error) {
            warning(false, `The URL path "${value}" could not be decoded because it is a ` +
                `malformed URL segment. This is probably due to a bad percent ` +
                `encoding (${error}).`);
            return value;
        }
    }
    /**
     * @private
     */
    function stripBasename(pathname, basename) {
        if (basename === "/")
            return pathname;
        if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
            return null;
        }
        // We want to leave trailing slash behavior in the user's control, so if they
        // specify a basename with a trailing slash, we should support it
        let startIndex = basename.endsWith("/")
            ? basename.length - 1
            : basename.length;
        let nextChar = pathname.charAt(startIndex);
        if (nextChar && nextChar !== "/") {
            // pathname does not start with basename/
            return null;
        }
        return pathname.slice(startIndex) || "/";
    }
    /**
     * Returns a resolved path object relative to the given pathname.
     *
     * @category Utils
     */
    function resolvePath(to, fromPathname = "/") {
        let { pathname: toPathname, search = "", hash = "", } = typeof to === "string" ? parsePath(to) : to;
        let pathname = toPathname
            ? toPathname.startsWith("/")
                ? toPathname
                : resolvePathname(toPathname, fromPathname)
            : fromPathname;
        return {
            pathname,
            search: normalizeSearch(search),
            hash: normalizeHash(hash),
        };
    }
    function resolvePathname(relativePath, fromPathname) {
        let segments = fromPathname.replace(/\/+$/, "").split("/");
        let relativeSegments = relativePath.split("/");
        relativeSegments.forEach((segment) => {
            if (segment === "..") {
                // Keep the root "" segment so the pathname starts at /
                if (segments.length > 1)
                    segments.pop();
            }
            else if (segment !== ".") {
                segments.push(segment);
            }
        });
        return segments.length > 1 ? segments.join("/") : "/";
    }
    function getInvalidPathError(char, field, dest, path) {
        return (`Cannot include a '${char}' character in a manually specified ` +
            `\`to.${field}\` field [${JSON.stringify(path)}].  Please separate it out to the ` +
            `\`to.${dest}\` field. Alternatively you may provide the full path as ` +
            `a string in <Link to="..."> and the router will parse it for you.`);
    }
    /**
     * @private
     *
     * When processing relative navigation we want to ignore ancestor routes that
     * do not contribute to the path, such that index/pathless layout routes don't
     * interfere.
     *
     * For example, when moving a route element into an index route and/or a
     * pathless layout route, relative link behavior contained within should stay
     * the same.  Both of the following examples should link back to the root:
     *
     *   <Route path="/">
     *     <Route path="accounts" element={<Link to=".."}>
     *   </Route>
     *
     *   <Route path="/">
     *     <Route path="accounts">
     *       <Route element={<AccountsLayout />}>       // <-- Does not contribute
     *         <Route index element={<Link to=".."} />  // <-- Does not contribute
     *       </Route
     *     </Route>
     *   </Route>
     */
    function getPathContributingMatches(matches) {
        return matches.filter((match, index) => index === 0 || (match.route.path && match.route.path.length > 0));
    }
    // Return the array of pathnames for the current route matches - used to
    // generate the routePathnames input for resolveTo()
    function getResolveToMatches(matches) {
        let pathMatches = getPathContributingMatches(matches);
        // Use the full pathname for the leaf match so we include splat values for "." links
        // https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329
        return pathMatches.map((match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase);
    }
    /**
     * @private
     */
    function resolveTo(toArg, routePathnames, locationPathname, isPathRelative = false) {
        let to;
        if (typeof toArg === "string") {
            to = parsePath(toArg);
        }
        else {
            to = { ...toArg };
            invariant$2(!to.pathname || !to.pathname.includes("?"), getInvalidPathError("?", "pathname", "search", to));
            invariant$2(!to.pathname || !to.pathname.includes("#"), getInvalidPathError("#", "pathname", "hash", to));
            invariant$2(!to.search || !to.search.includes("#"), getInvalidPathError("#", "search", "hash", to));
        }
        let isEmptyPath = toArg === "" || to.pathname === "";
        let toPathname = isEmptyPath ? "/" : to.pathname;
        let from;
        // Routing is relative to the current pathname if explicitly requested.
        //
        // If a pathname is explicitly provided in `to`, it should be relative to the
        // route context. This is explained in `Note on `<Link to>` values` in our
        // migration guide from v5 as a means of disambiguation between `to` values
        // that begin with `/` and those that do not. However, this is problematic for
        // `to` values that do not provide a pathname. `to` can simply be a search or
        // hash string, in which case we should assume that the navigation is relative
        // to the current location's pathname and *not* the route pathname.
        if (toPathname == null) {
            from = locationPathname;
        }
        else {
            let routePathnameIndex = routePathnames.length - 1;
            // With relative="route" (the default), each leading .. segment means
            // "go up one route" instead of "go up one URL segment".  This is a key
            // difference from how <a href> works and a major reason we call this a
            // "to" value instead of a "href".
            if (!isPathRelative && toPathname.startsWith("..")) {
                let toSegments = toPathname.split("/");
                while (toSegments[0] === "..") {
                    toSegments.shift();
                    routePathnameIndex -= 1;
                }
                to.pathname = toSegments.join("/");
            }
            from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
        }
        let path = resolvePath(to, from);
        // Ensure the pathname has a trailing slash if the original "to" had one
        let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
        // Or if this was a link to the current path which has a trailing slash
        let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
        if (!path.pathname.endsWith("/") &&
            (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) {
            path.pathname += "/";
        }
        return path;
    }
    /**
     * @private
     */
    const joinPaths = (paths) => paths.join("/").replace(/\/\/+/g, "/");
    /**
     * @private
     */
    const normalizePathname = (pathname) => pathname.replace(/\/+$/, "").replace(/^\/*/, "/");
    /**
     * @private
     */
    const normalizeSearch = (search) => !search || search === "?"
        ? ""
        : search.startsWith("?")
            ? search
            : "?" + search;
    /**
     * @private
     */
    const normalizeHash = (hash) => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
    class DataWithResponseInit {
        type = "DataWithResponseInit";
        data;
        init;
        constructor(data, init) {
            this.data = data;
            this.init = init || null;
        }
    }
    /**
     * Create "responses" that contain `status`/`headers` without forcing
     * serialization into an actual `Response` - used by Remix single fetch
     *
     * @category Utils
     */
    function data(data, init) {
        return new DataWithResponseInit(data, typeof init === "number" ? { status: init } : init);
    }
    /**
     * A redirect response. Sets the status code and the `Location` header.
     * Defaults to "302 Found".
     *
     * @category Utils
     */
    const redirect = (url, init = 302) => {
        let responseInit = init;
        if (typeof responseInit === "number") {
            responseInit = { status: responseInit };
        }
        else if (typeof responseInit.status === "undefined") {
            responseInit.status = 302;
        }
        let headers = new Headers(responseInit.headers);
        headers.set("Location", url);
        return new Response(null, { ...responseInit, headers });
    };
    /**
     * A redirect response that will force a document reload to the new location.
     * Sets the status code and the `Location` header.
     * Defaults to "302 Found".
     *
     * @category Utils
     */
    const redirectDocument = (url, init) => {
        let response = redirect(url, init);
        response.headers.set("X-Remix-Reload-Document", "true");
        return response;
    };
    /**
     * A redirect response that will perform a `history.replaceState` instead of a
     * `history.pushState` for client-side navigation redirects.
     * Sets the status code and the `Location` header.
     * Defaults to "302 Found".
     *
     * @category Utils
     */
    const replace = (url, init) => {
        let response = redirect(url, init);
        response.headers.set("X-Remix-Replace", "true");
        return response;
    };
    /**
     * @private
     * Utility class we use to hold auto-unwrapped 4xx/5xx Response bodies
     *
     * We don't export the class for public use since it's an implementation
     * detail, but we export the interface above so folks can build their own
     * abstractions around instances via isRouteErrorResponse()
     */
    class ErrorResponseImpl {
        status;
        statusText;
        data;
        error;
        internal;
        constructor(status, statusText, data, internal = false) {
            this.status = status;
            this.statusText = statusText || "";
            this.internal = internal;
            if (data instanceof Error) {
                this.data = data.toString();
                this.error = data;
            }
            else {
                this.data = data;
            }
        }
    }
    /**
     * Check if the given error is an ErrorResponse generated from a 4xx/5xx
     * Response thrown from an action/loader
     *
     * @category Utils
     */
    function isRouteErrorResponse(error) {
        return (error != null &&
            typeof error.status === "number" &&
            typeof error.statusText === "string" &&
            typeof error.internal === "boolean" &&
            "data" in error);
    }

    const validMutationMethodsArr = [
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
    ];
    const validMutationMethods = new Set(validMutationMethodsArr);
    const validRequestMethodsArr = [
        "GET",
        ...validMutationMethodsArr,
    ];
    const validRequestMethods = new Set(validRequestMethodsArr);
    const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
    const redirectPreserveMethodStatusCodes = new Set([307, 308]);
    const IDLE_NAVIGATION = {
        state: "idle",
        location: undefined,
        formMethod: undefined,
        formAction: undefined,
        formEncType: undefined,
        formData: undefined,
        json: undefined,
        text: undefined,
    };
    const IDLE_FETCHER = {
        state: "idle",
        data: undefined,
        formMethod: undefined,
        formAction: undefined,
        formEncType: undefined,
        formData: undefined,
        json: undefined,
        text: undefined,
    };
    const IDLE_BLOCKER = {
        state: "unblocked",
        proceed: undefined,
        reset: undefined,
        location: undefined,
    };
    const ABSOLUTE_URL_REGEX$2 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
    const defaultMapRouteProperties = (route) => ({
        hasErrorBoundary: Boolean(route.hasErrorBoundary),
    });
    const TRANSITIONS_STORAGE_KEY = "remix-router-transitions";
    // Flag used on new `loaderData` to indicate that we do not want to preserve
    // any prior loader data from the throwing route in `mergeLoaderData`
    const ResetLoaderDataSymbol = Symbol("ResetLoaderData");
    //#endregion
    ////////////////////////////////////////////////////////////////////////////////
    //#region createRouter
    ////////////////////////////////////////////////////////////////////////////////
    /**
     * Create a router and listen to history POP navigations
     */
    function createRouter(init) {
        const routerWindow = init.window
            ? init.window
            : typeof window !== "undefined"
                ? window
                : undefined;
        const isBrowser = typeof routerWindow !== "undefined" &&
            typeof routerWindow.document !== "undefined" &&
            typeof routerWindow.document.createElement !== "undefined";
        invariant$2(init.routes.length > 0, "You must provide a non-empty routes array to createRouter");
        let mapRouteProperties = init.mapRouteProperties || defaultMapRouteProperties;
        // Routes keyed by ID
        let manifest = {};
        // Routes in tree format for matching
        let dataRoutes = convertRoutesToDataRoutes(init.routes, mapRouteProperties, undefined, manifest);
        let inFlightDataRoutes;
        let basename = init.basename || "/";
        let dataStrategyImpl = init.dataStrategy || defaultDataStrategyWithMiddleware;
        // Config driven behavior flags
        let future = {
            unstable_middleware: false,
            ...init.future,
        };
        // Cleanup function for history
        let unlistenHistory = null;
        // Externally-provided functions to call on all state changes
        let subscribers = new Set();
        // Externally-provided object to hold scroll restoration locations during routing
        let savedScrollPositions = null;
        // Externally-provided function to get scroll restoration keys
        let getScrollRestorationKey = null;
        // Externally-provided function to get current scroll position
        let getScrollPosition = null;
        // One-time flag to control the initial hydration scroll restoration.  Because
        // we don't get the saved positions from <ScrollRestoration /> until _after_
        // the initial render, we need to manually trigger a separate updateState to
        // send along the restoreScrollPosition
        // Set to true if we have `hydrationData` since we assume we were SSR'd and that
        // SSR did the initial scroll restoration.
        let initialScrollRestored = init.hydrationData != null;
        let initialMatches = matchRoutes(dataRoutes, init.history.location, basename);
        let initialMatchesIsFOW = false;
        let initialErrors = null;
        if (initialMatches == null && !init.patchRoutesOnNavigation) {
            // If we do not match a user-provided-route, fall back to the root
            // to allow the error boundary to take over
            let error = getInternalRouterError(404, {
                pathname: init.history.location.pathname,
            });
            let { matches, route } = getShortCircuitMatches(dataRoutes);
            initialMatches = matches;
            initialErrors = { [route.id]: error };
        }
        // In SPA apps, if the user provided a patchRoutesOnNavigation implementation and
        // our initial match is a splat route, clear them out so we run through lazy
        // discovery on hydration in case there's a more accurate lazy route match.
        // In SSR apps (with `hydrationData`), we expect that the server will send
        // up the proper matched routes so we don't want to run lazy discovery on
        // initial hydration and want to hydrate into the splat route.
        if (initialMatches && !init.hydrationData) {
            let fogOfWar = checkFogOfWar(initialMatches, dataRoutes, init.history.location.pathname);
            if (fogOfWar.active) {
                initialMatches = null;
            }
        }
        let initialized;
        if (!initialMatches) {
            initialized = false;
            initialMatches = [];
            // If partial hydration and fog of war is enabled, we will be running
            // `patchRoutesOnNavigation` during hydration so include any partial matches as
            // the initial matches so we can properly render `HydrateFallback`'s
            let fogOfWar = checkFogOfWar(null, dataRoutes, init.history.location.pathname);
            if (fogOfWar.active && fogOfWar.matches) {
                initialMatchesIsFOW = true;
                initialMatches = fogOfWar.matches;
            }
        }
        else if (initialMatches.some((m) => m.route.lazy)) {
            // All initialMatches need to be loaded before we're ready.  If we have lazy
            // functions around still then we'll need to run them in initialize()
            initialized = false;
        }
        else if (!initialMatches.some((m) => m.route.loader)) {
            // If we've got no loaders to run, then we're good to go
            initialized = true;
        }
        else {
            // With "partial hydration", we're initialized so long as we were
            // provided with hydrationData for every route with a loader, and no loaders
            // were marked for explicit hydration
            let loaderData = init.hydrationData ? init.hydrationData.loaderData : null;
            let errors = init.hydrationData ? init.hydrationData.errors : null;
            // If errors exist, don't consider routes below the boundary
            if (errors) {
                let idx = initialMatches.findIndex((m) => errors[m.route.id] !== undefined);
                initialized = initialMatches
                    .slice(0, idx + 1)
                    .every((m) => !shouldLoadRouteOnHydration(m.route, loaderData, errors));
            }
            else {
                initialized = initialMatches.every((m) => !shouldLoadRouteOnHydration(m.route, loaderData, errors));
            }
        }
        let router;
        let state = {
            historyAction: init.history.action,
            location: init.history.location,
            matches: initialMatches,
            initialized,
            navigation: IDLE_NAVIGATION,
            // Don't restore on initial updateState() if we were SSR'd
            restoreScrollPosition: init.hydrationData != null ? false : null,
            preventScrollReset: false,
            revalidation: "idle",
            loaderData: (init.hydrationData && init.hydrationData.loaderData) || {},
            actionData: (init.hydrationData && init.hydrationData.actionData) || null,
            errors: (init.hydrationData && init.hydrationData.errors) || initialErrors,
            fetchers: new Map(),
            blockers: new Map(),
        };
        // -- Stateful internal variables to manage navigations --
        // Current navigation in progress (to be committed in completeNavigation)
        let pendingAction = exports.NavigationType.Pop;
        // Should the current navigation prevent the scroll reset if scroll cannot
        // be restored?
        let pendingPreventScrollReset = false;
        // AbortController for the active navigation
        let pendingNavigationController;
        // Should the current navigation enable document.startViewTransition?
        let pendingViewTransitionEnabled = false;
        // Store applied view transitions so we can apply them on POP
        let appliedViewTransitions = new Map();
        // Cleanup function for persisting applied transitions to sessionStorage
        let removePageHideEventListener = null;
        // We use this to avoid touching history in completeNavigation if a
        // revalidation is entirely uninterrupted
        let isUninterruptedRevalidation = false;
        // Use this internal flag to force revalidation of all loaders:
        //  - submissions (completed or interrupted)
        //  - useRevalidator()
        //  - X-Remix-Revalidate (from redirect)
        let isRevalidationRequired = false;
        // Use this internal array to capture fetcher loads that were cancelled by an
        // action navigation and require revalidation
        let cancelledFetcherLoads = new Set();
        // AbortControllers for any in-flight fetchers
        let fetchControllers = new Map();
        // Track loads based on the order in which they started
        let incrementingLoadId = 0;
        // Track the outstanding pending navigation data load to be compared against
        // the globally incrementing load when a fetcher load lands after a completed
        // navigation
        let pendingNavigationLoadId = -1;
        // Fetchers that triggered data reloads as a result of their actions
        let fetchReloadIds = new Map();
        // Fetchers that triggered redirect navigations
        let fetchRedirectIds = new Set();
        // Most recent href/match for fetcher.load calls for fetchers
        let fetchLoadMatches = new Map();
        // Ref-count mounted fetchers so we know when it's ok to clean them up
        let activeFetchers = new Map();
        // Fetchers queued for deletion because they've been removed from the UI.
        // These will be officially deleted after they return to idle
        let fetchersQueuedForDeletion = new Set();
        // Store blocker functions in a separate Map outside of router state since
        // we don't need to update UI state if they change
        let blockerFunctions = new Map();
        // Flag to ignore the next history update, so we can revert the URL change on
        // a POP navigation that was blocked by the user without touching router state
        let unblockBlockerHistoryUpdate = undefined;
        let pendingRevalidationDfd = null;
        // Initialize the router, all side effects should be kicked off from here.
        // Implemented as a Fluent API for ease of:
        //   let router = createRouter(init).initialize();
        function initialize() {
            // If history informs us of a POP navigation, start the navigation but do not update
            // state.  We'll update our own state once the navigation completes
            unlistenHistory = init.history.listen(({ action: historyAction, location, delta }) => {
                // Ignore this event if it was just us resetting the URL from a
                // blocked POP navigation
                if (unblockBlockerHistoryUpdate) {
                    unblockBlockerHistoryUpdate();
                    unblockBlockerHistoryUpdate = undefined;
                    return;
                }
                warning(blockerFunctions.size === 0 || delta != null, "You are trying to use a blocker on a POP navigation to a location " +
                    "that was not created by @remix-run/router. This will fail silently in " +
                    "production. This can happen if you are navigating outside the router " +
                    "via `window.history.pushState`/`window.location.hash` instead of using " +
                    "router navigation APIs.  This can also happen if you are using " +
                    "createHashRouter and the user manually changes the URL.");
                let blockerKey = shouldBlockNavigation({
                    currentLocation: state.location,
                    nextLocation: location,
                    historyAction,
                });
                if (blockerKey && delta != null) {
                    // Restore the URL to match the current UI, but don't update router state
                    let nextHistoryUpdatePromise = new Promise((resolve) => {
                        unblockBlockerHistoryUpdate = resolve;
                    });
                    init.history.go(delta * -1);
                    // Put the blocker into a blocked state
                    updateBlocker(blockerKey, {
                        state: "blocked",
                        location,
                        proceed() {
                            updateBlocker(blockerKey, {
                                state: "proceeding",
                                proceed: undefined,
                                reset: undefined,
                                location,
                            });
                            // Re-do the same POP navigation we just blocked, after the url
                            // restoration is also complete.  See:
                            // https://github.com/remix-run/react-router/issues/11613
                            nextHistoryUpdatePromise.then(() => init.history.go(delta));
                        },
                        reset() {
                            let blockers = new Map(state.blockers);
                            blockers.set(blockerKey, IDLE_BLOCKER);
                            updateState({ blockers });
                        },
                    });
                    return;
                }
                return startNavigation(historyAction, location);
            });
            if (isBrowser) {
                // FIXME: This feels gross.  How can we cleanup the lines between
                // scrollRestoration/appliedTransitions persistance?
                restoreAppliedTransitions(routerWindow, appliedViewTransitions);
                let _saveAppliedTransitions = () => persistAppliedTransitions(routerWindow, appliedViewTransitions);
                routerWindow.addEventListener("pagehide", _saveAppliedTransitions);
                removePageHideEventListener = () => routerWindow.removeEventListener("pagehide", _saveAppliedTransitions);
            }
            // Kick off initial data load if needed.  Use Pop to avoid modifying history
            // Note we don't do any handling of lazy here.  For SPA's it'll get handled
            // in the normal navigation flow.  For SSR it's expected that lazy modules are
            // resolved prior to router creation since we can't go into a fallback
            // UI for SSR'd apps
            if (!state.initialized) {
                startNavigation(exports.NavigationType.Pop, state.location, {
                    initialHydration: true,
                });
            }
            return router;
        }
        // Clean up a router and it's side effects
        function dispose() {
            if (unlistenHistory) {
                unlistenHistory();
            }
            if (removePageHideEventListener) {
                removePageHideEventListener();
            }
            subscribers.clear();
            pendingNavigationController && pendingNavigationController.abort();
            state.fetchers.forEach((_, key) => deleteFetcher(key));
            state.blockers.forEach((_, key) => deleteBlocker(key));
        }
        // Subscribe to state updates for the router
        function subscribe(fn) {
            subscribers.add(fn);
            return () => subscribers.delete(fn);
        }
        // Update our state and notify the calling context of the change
        function updateState(newState, opts = {}) {
            state = {
                ...state,
                ...newState,
            };
            // Cleanup for all fetchers that have returned to idle since we only
            // care about in-flight fetchers
            // - If it's been unmounted then we can completely delete it
            // - If it's still mounted we can remove it from `state.fetchers`, but we
            //   need to keep it around in things like `fetchLoadMatches`, etc. since
            //   it may be called again
            let unmountedFetchers = [];
            let mountedFetchers = [];
            state.fetchers.forEach((fetcher, key) => {
                if (fetcher.state === "idle") {
                    if (fetchersQueuedForDeletion.has(key)) {
                        unmountedFetchers.push(key);
                    }
                    else {
                        mountedFetchers.push(key);
                    }
                }
            });
            // Delete any other `idle` fetchers unmounted in the UI that were previously
            // removed from state.fetchers.  Check `fetchControllers` in case this
            // fetcher is actively revalidating and we want to let that finish
            fetchersQueuedForDeletion.forEach((key) => {
                if (!state.fetchers.has(key) && !fetchControllers.has(key)) {
                    unmountedFetchers.push(key);
                }
            });
            // Iterate over a local copy so that if flushSync is used and we end up
            // removing and adding a new subscriber due to the useCallback dependencies,
            // we don't get ourselves into a loop calling the new subscriber immediately
            [...subscribers].forEach((subscriber) => subscriber(state, {
                deletedFetchers: unmountedFetchers,
                viewTransitionOpts: opts.viewTransitionOpts,
                flushSync: opts.flushSync === true,
            }));
            // Cleanup internally now that we've called our subscribers/updated state
            unmountedFetchers.forEach((key) => deleteFetcher(key));
            mountedFetchers.forEach((key) => state.fetchers.delete(key));
        }
        // Complete a navigation returning the state.navigation back to the IDLE_NAVIGATION
        // and setting state.[historyAction/location/matches] to the new route.
        // - Location is a required param
        // - Navigation will always be set to IDLE_NAVIGATION
        // - Can pass any other state in newState
        function completeNavigation(location, newState, { flushSync } = {}) {
            // Deduce if we're in a loading/actionReload state:
            // - We have committed actionData in the store
            // - The current navigation was a mutation submission
            // - We're past the submitting state and into the loading state
            // - The location being loaded is not the result of a redirect
            let isActionReload = state.actionData != null &&
                state.navigation.formMethod != null &&
                isMutationMethod(state.navigation.formMethod) &&
                state.navigation.state === "loading" &&
                location.state?._isRedirect !== true;
            let actionData;
            if (newState.actionData) {
                if (Object.keys(newState.actionData).length > 0) {
                    actionData = newState.actionData;
                }
                else {
                    // Empty actionData -> clear prior actionData due to an action error
                    actionData = null;
                }
            }
            else if (isActionReload) {
                // Keep the current data if we're wrapping up the action reload
                actionData = state.actionData;
            }
            else {
                // Clear actionData on any other completed navigations
                actionData = null;
            }
            // Always preserve any existing loaderData from re-used routes
            let loaderData = newState.loaderData
                ? mergeLoaderData(state.loaderData, newState.loaderData, newState.matches || [], newState.errors)
                : state.loaderData;
            // On a successful navigation we can assume we got through all blockers
            // so we can start fresh
            let blockers = state.blockers;
            if (blockers.size > 0) {
                blockers = new Map(blockers);
                blockers.forEach((_, k) => blockers.set(k, IDLE_BLOCKER));
            }
            // Always respect the user flag.  Otherwise don't reset on mutation
            // submission navigations unless they redirect
            let preventScrollReset = pendingPreventScrollReset === true ||
                (state.navigation.formMethod != null &&
                    isMutationMethod(state.navigation.formMethod) &&
                    location.state?._isRedirect !== true);
            // Commit any in-flight routes at the end of the HMR revalidation "navigation"
            if (inFlightDataRoutes) {
                dataRoutes = inFlightDataRoutes;
                inFlightDataRoutes = undefined;
            }
            if (isUninterruptedRevalidation) ;
            else if (pendingAction === exports.NavigationType.Pop) ;
            else if (pendingAction === exports.NavigationType.Push) {
                init.history.push(location, location.state);
            }
            else if (pendingAction === exports.NavigationType.Replace) {
                init.history.replace(location, location.state);
            }
            let viewTransitionOpts;
            // On POP, enable transitions if they were enabled on the original navigation
            if (pendingAction === exports.NavigationType.Pop) {
                // Forward takes precedence so they behave like the original navigation
                let priorPaths = appliedViewTransitions.get(state.location.pathname);
                if (priorPaths && priorPaths.has(location.pathname)) {
                    viewTransitionOpts = {
                        currentLocation: state.location,
                        nextLocation: location,
                    };
                }
                else if (appliedViewTransitions.has(location.pathname)) {
                    // If we don't have a previous forward nav, assume we're popping back to
                    // the new location and enable if that location previously enabled
                    viewTransitionOpts = {
                        currentLocation: location,
                        nextLocation: state.location,
                    };
                }
            }
            else if (pendingViewTransitionEnabled) {
                // Store the applied transition on PUSH/REPLACE
                let toPaths = appliedViewTransitions.get(state.location.pathname);
                if (toPaths) {
                    toPaths.add(location.pathname);
                }
                else {
                    toPaths = new Set([location.pathname]);
                    appliedViewTransitions.set(state.location.pathname, toPaths);
                }
                viewTransitionOpts = {
                    currentLocation: state.location,
                    nextLocation: location,
                };
            }
            updateState({
                ...newState, // matches, errors, fetchers go through as-is
                actionData,
                loaderData,
                historyAction: pendingAction,
                location,
                initialized: true,
                navigation: IDLE_NAVIGATION,
                revalidation: "idle",
                restoreScrollPosition: getSavedScrollPosition(location, newState.matches || state.matches),
                preventScrollReset,
                blockers,
            }, {
                viewTransitionOpts,
                flushSync: flushSync === true,
            });
            // Reset stateful navigation vars
            pendingAction = exports.NavigationType.Pop;
            pendingPreventScrollReset = false;
            pendingViewTransitionEnabled = false;
            isUninterruptedRevalidation = false;
            isRevalidationRequired = false;
            pendingRevalidationDfd?.resolve();
            pendingRevalidationDfd = null;
        }
        // Trigger a navigation event, which can either be a numerical POP or a PUSH
        // replace with an optional submission
        async function navigate(to, opts) {
            if (typeof to === "number") {
                init.history.go(to);
                return;
            }
            let normalizedPath = normalizeTo(state.location, state.matches, basename, to, opts?.fromRouteId, opts?.relative);
            let { path, submission, error } = normalizeNavigateOptions(false, normalizedPath, opts);
            let currentLocation = state.location;
            let nextLocation = createLocation(state.location, path, opts && opts.state);
            // When using navigate as a PUSH/REPLACE we aren't reading an already-encoded
            // URL from window.location, so we need to encode it here so the behavior
            // remains the same as POP and non-data-router usages.  new URL() does all
            // the same encoding we'd get from a history.pushState/window.location read
            // without having to touch history
            nextLocation = {
                ...nextLocation,
                ...init.history.encodeLocation(nextLocation),
            };
            let userReplace = opts && opts.replace != null ? opts.replace : undefined;
            let historyAction = exports.NavigationType.Push;
            if (userReplace === true) {
                historyAction = exports.NavigationType.Replace;
            }
            else if (userReplace === false) ;
            else if (submission != null &&
                isMutationMethod(submission.formMethod) &&
                submission.formAction === state.location.pathname + state.location.search) {
                // By default on submissions to the current location we REPLACE so that
                // users don't have to double-click the back button to get to the prior
                // location.  If the user redirects to a different location from the
                // action/loader this will be ignored and the redirect will be a PUSH
                historyAction = exports.NavigationType.Replace;
            }
            let preventScrollReset = opts && "preventScrollReset" in opts
                ? opts.preventScrollReset === true
                : undefined;
            let flushSync = (opts && opts.flushSync) === true;
            let blockerKey = shouldBlockNavigation({
                currentLocation,
                nextLocation,
                historyAction,
            });
            if (blockerKey) {
                // Put the blocker into a blocked state
                updateBlocker(blockerKey, {
                    state: "blocked",
                    location: nextLocation,
                    proceed() {
                        updateBlocker(blockerKey, {
                            state: "proceeding",
                            proceed: undefined,
                            reset: undefined,
                            location: nextLocation,
                        });
                        // Send the same navigation through
                        navigate(to, opts);
                    },
                    reset() {
                        let blockers = new Map(state.blockers);
                        blockers.set(blockerKey, IDLE_BLOCKER);
                        updateState({ blockers });
                    },
                });
                return;
            }
            await startNavigation(historyAction, nextLocation, {
                submission,
                // Send through the formData serialization error if we have one so we can
                // render at the right error boundary after we match routes
                pendingError: error,
                preventScrollReset,
                replace: opts && opts.replace,
                enableViewTransition: opts && opts.viewTransition,
                flushSync,
            });
        }
        // Revalidate all current loaders.  If a navigation is in progress or if this
        // is interrupted by a navigation, allow this to "succeed" by calling all
        // loaders during the next loader round
        function revalidate() {
            // We can't just return the promise from `startNavigation` because that
            // navigation may be interrupted and our revalidation wouldn't be finished
            // until the _next_ navigation completes.  Instead we just track via a
            // deferred and resolve it the next time we run through `completeNavigation`
            // This is different than navigations which will settle if interrupted
            // because the navigation to a specific location is no longer relevant.
            // Revalidations are location-independent and will settle whenever we land
            // on our final location
            if (!pendingRevalidationDfd) {
                pendingRevalidationDfd = createDeferred$1();
            }
            interruptActiveLoads();
            updateState({ revalidation: "loading" });
            // Capture this here for the edge-case that we have a fully synchronous
            // startNavigation which would resolve and null out pendingRevalidationDfd
            // before we return from this function
            let promise = pendingRevalidationDfd.promise;
            // If we're currently submitting an action, we don't need to start a new
            // navigation, we'll just let the follow up loader execution call all loaders
            if (state.navigation.state === "submitting") {
                return promise;
            }
            // If we're currently in an idle state, start a new navigation for the current
            // action/location and mark it as uninterrupted, which will skip the history
            // update in completeNavigation
            if (state.navigation.state === "idle") {
                startNavigation(state.historyAction, state.location, {
                    startUninterruptedRevalidation: true,
                });
                return promise;
            }
            // Otherwise, if we're currently in a loading state, just start a new
            // navigation to the navigation.location but do not trigger an uninterrupted
            // revalidation so that history correctly updates once the navigation completes
            startNavigation(pendingAction || state.historyAction, state.navigation.location, {
                overrideNavigation: state.navigation,
                // Proxy through any rending view transition
                enableViewTransition: pendingViewTransitionEnabled === true,
            });
            return promise;
        }
        // Start a navigation to the given action/location.  Can optionally provide a
        // overrideNavigation which will override the normalLoad in the case of a redirect
        // navigation
        async function startNavigation(historyAction, location, opts) {
            // Abort any in-progress navigations and start a new one. Unset any ongoing
            // uninterrupted revalidations unless told otherwise, since we want this
            // new navigation to update history normally
            pendingNavigationController && pendingNavigationController.abort();
            pendingNavigationController = null;
            pendingAction = historyAction;
            isUninterruptedRevalidation =
                (opts && opts.startUninterruptedRevalidation) === true;
            // Save the current scroll position every time we start a new navigation,
            // and track whether we should reset scroll on completion
            saveScrollPosition(state.location, state.matches);
            pendingPreventScrollReset = (opts && opts.preventScrollReset) === true;
            pendingViewTransitionEnabled = (opts && opts.enableViewTransition) === true;
            let routesToUse = inFlightDataRoutes || dataRoutes;
            let loadingNavigation = opts && opts.overrideNavigation;
            let matches = opts?.initialHydration &&
                state.matches &&
                state.matches.length > 0 &&
                !initialMatchesIsFOW
                ? // `matchRoutes()` has already been called if we're in here via `router.initialize()`
                    state.matches
                : matchRoutes(routesToUse, location, basename);
            let flushSync = (opts && opts.flushSync) === true;
            // Short circuit if it's only a hash change and not a revalidation or
            // mutation submission.
            //
            // Ignore on initial page loads because since the initial hydration will always
            // be "same hash".  For example, on /page#hash and submit a <Form method="post">
            // which will default to a navigation to /page
            if (matches &&
                state.initialized &&
                !isRevalidationRequired &&
                isHashChangeOnly(state.location, location) &&
                !(opts && opts.submission && isMutationMethod(opts.submission.formMethod))) {
                completeNavigation(location, { matches }, { flushSync });
                return;
            }
            let fogOfWar = checkFogOfWar(matches, routesToUse, location.pathname);
            if (fogOfWar.active && fogOfWar.matches) {
                matches = fogOfWar.matches;
            }
            // Short circuit with a 404 on the root error boundary if we match nothing
            if (!matches) {
                let { error, notFoundMatches, route } = handleNavigational404(location.pathname);
                completeNavigation(location, {
                    matches: notFoundMatches,
                    loaderData: {},
                    errors: {
                        [route.id]: error,
                    },
                }, { flushSync });
                return;
            }
            // Create a controller/Request for this navigation
            pendingNavigationController = new AbortController();
            let request = createClientSideRequest(init.history, location, pendingNavigationController.signal, opts && opts.submission);
            // Create a new context per navigation
            let scopedContext = new unstable_RouterContextProvider(init.unstable_getContext ? await init.unstable_getContext() : undefined);
            let pendingActionResult;
            if (opts && opts.pendingError) {
                // If we have a pendingError, it means the user attempted a GET submission
                // with binary FormData so assign here and skip to handleLoaders.  That
                // way we handle calling loaders above the boundary etc.  It's not really
                // different from an actionError in that sense.
                pendingActionResult = [
                    findNearestBoundary(matches).route.id,
                    { type: ResultType.error, error: opts.pendingError },
                ];
            }
            else if (opts &&
                opts.submission &&
                isMutationMethod(opts.submission.formMethod)) {
                // Call action if we received an action submission
                let actionResult = await handleAction(request, location, opts.submission, matches, scopedContext, fogOfWar.active, { replace: opts.replace, flushSync });
                if (actionResult.shortCircuited) {
                    return;
                }
                // If we received a 404 from handleAction, it's because we couldn't lazily
                // discover the destination route so we don't want to call loaders
                if (actionResult.pendingActionResult) {
                    let [routeId, result] = actionResult.pendingActionResult;
                    if (isErrorResult(result) &&
                        isRouteErrorResponse(result.error) &&
                        result.error.status === 404) {
                        pendingNavigationController = null;
                        completeNavigation(location, {
                            matches: actionResult.matches,
                            loaderData: {},
                            errors: {
                                [routeId]: result.error,
                            },
                        });
                        return;
                    }
                }
                matches = actionResult.matches || matches;
                pendingActionResult = actionResult.pendingActionResult;
                loadingNavigation = getLoadingNavigation(location, opts.submission);
                flushSync = false;
                // No need to do fog of war matching again on loader execution
                fogOfWar.active = false;
                // Create a GET request for the loaders
                request = createClientSideRequest(init.history, request.url, request.signal);
            }
            // Call loaders
            let { shortCircuited, matches: updatedMatches, loaderData, errors, } = await handleLoaders(request, location, matches, scopedContext, fogOfWar.active, loadingNavigation, opts && opts.submission, opts && opts.fetcherSubmission, opts && opts.replace, opts && opts.initialHydration === true, flushSync, pendingActionResult);
            if (shortCircuited) {
                return;
            }
            // Clean up now that the action/loaders have completed.  Don't clean up if
            // we short circuited because pendingNavigationController will have already
            // been assigned to a new controller for the next navigation
            pendingNavigationController = null;
            completeNavigation(location, {
                matches: updatedMatches || matches,
                ...getActionDataForCommit(pendingActionResult),
                loaderData,
                errors,
            });
        }
        // Call the action matched by the leaf route for this navigation and handle
        // redirects/errors
        async function handleAction(request, location, submission, matches, scopedContext, isFogOfWar, opts = {}) {
            interruptActiveLoads();
            // Put us in a submitting state
            let navigation = getSubmittingNavigation(location, submission);
            updateState({ navigation }, { flushSync: opts.flushSync === true });
            if (isFogOfWar) {
                let discoverResult = await discoverRoutes(matches, location.pathname, request.signal);
                if (discoverResult.type === "aborted") {
                    return { shortCircuited: true };
                }
                else if (discoverResult.type === "error") {
                    let boundaryId = findNearestBoundary(discoverResult.partialMatches)
                        .route.id;
                    return {
                        matches: discoverResult.partialMatches,
                        pendingActionResult: [
                            boundaryId,
                            {
                                type: ResultType.error,
                                error: discoverResult.error,
                            },
                        ],
                    };
                }
                else if (!discoverResult.matches) {
                    let { notFoundMatches, error, route } = handleNavigational404(location.pathname);
                    return {
                        matches: notFoundMatches,
                        pendingActionResult: [
                            route.id,
                            {
                                type: ResultType.error,
                                error,
                            },
                        ],
                    };
                }
                else {
                    matches = discoverResult.matches;
                }
            }
            // Call our action and get the result
            let result;
            let actionMatch = getTargetMatch(matches, location);
            if (!actionMatch.route.action && !actionMatch.route.lazy) {
                result = {
                    type: ResultType.error,
                    error: getInternalRouterError(405, {
                        method: request.method,
                        pathname: location.pathname,
                        routeId: actionMatch.route.id,
                    }),
                };
            }
            else {
                let results = await callDataStrategy("action", request, [actionMatch], matches, scopedContext, null);
                result = results[actionMatch.route.id];
                if (!result) {
                    // If this error came from a parent middleware before the action ran,
                    // then it won't be tied to the action route
                    for (let match of matches) {
                        if (results[match.route.id]) {
                            result = results[match.route.id];
                            break;
                        }
                    }
                }
                if (request.signal.aborted) {
                    return { shortCircuited: true };
                }
            }
            if (isRedirectResult(result)) {
                let replace;
                if (opts && opts.replace != null) {
                    replace = opts.replace;
                }
                else {
                    // If the user didn't explicitly indicate replace behavior, replace if
                    // we redirected to the exact same location we're currently at to avoid
                    // double back-buttons
                    let location = normalizeRedirectLocation(result.response.headers.get("Location"), new URL(request.url), basename);
                    replace = location === state.location.pathname + state.location.search;
                }
                await startRedirectNavigation(request, result, true, {
                    submission,
                    replace,
                });
                return { shortCircuited: true };
            }
            if (isErrorResult(result)) {
                // Store off the pending error - we use it to determine which loaders
                // to call and will commit it when we complete the navigation
                let boundaryMatch = findNearestBoundary(matches, actionMatch.route.id);
                // By default, all submissions to the current location are REPLACE
                // navigations, but if the action threw an error that'll be rendered in
                // an errorElement, we fall back to PUSH so that the user can use the
                // back button to get back to the pre-submission form location to try
                // again
                if ((opts && opts.replace) !== true) {
                    pendingAction = exports.NavigationType.Push;
                }
                return {
                    matches,
                    pendingActionResult: [boundaryMatch.route.id, result],
                };
            }
            return {
                matches,
                pendingActionResult: [actionMatch.route.id, result],
            };
        }
        // Call all applicable loaders for the given matches, handling redirects,
        // errors, etc.
        async function handleLoaders(request, location, matches, scopedContext, isFogOfWar, overrideNavigation, submission, fetcherSubmission, replace, initialHydration, flushSync, pendingActionResult) {
            // Figure out the right navigation we want to use for data loading
            let loadingNavigation = overrideNavigation || getLoadingNavigation(location, submission);
            // If this was a redirect from an action we don't have a "submission" but
            // we have it on the loading navigation so use that if available
            let activeSubmission = submission ||
                fetcherSubmission ||
                getSubmissionFromNavigation(loadingNavigation);
            // If this is an uninterrupted revalidation, we remain in our current idle
            // state.  If not, we need to switch to our loading state and load data,
            // preserving any new action data or existing action data (in the case of
            // a revalidation interrupting an actionReload)
            // Also (with "partial hydration"), don't update the state for the initial
            // data load since it's not a "navigation"
            let shouldUpdateNavigationState = !isUninterruptedRevalidation && !initialHydration;
            // When fog of war is enabled, we enter our `loading` state earlier so we
            // can discover new routes during the `loading` state.  We skip this if
            // we've already run actions since we would have done our matching already.
            // If the children() function threw then, we want to proceed with the
            // partial matches it discovered.
            if (isFogOfWar) {
                if (shouldUpdateNavigationState) {
                    let actionData = getUpdatedActionData(pendingActionResult);
                    updateState({
                        navigation: loadingNavigation,
                        ...(actionData !== undefined ? { actionData } : {}),
                    }, {
                        flushSync,
                    });
                }
                let discoverResult = await discoverRoutes(matches, location.pathname, request.signal);
                if (discoverResult.type === "aborted") {
                    return { shortCircuited: true };
                }
                else if (discoverResult.type === "error") {
                    let boundaryId = findNearestBoundary(discoverResult.partialMatches)
                        .route.id;
                    return {
                        matches: discoverResult.partialMatches,
                        loaderData: {},
                        errors: {
                            [boundaryId]: discoverResult.error,
                        },
                    };
                }
                else if (!discoverResult.matches) {
                    let { error, notFoundMatches, route } = handleNavigational404(location.pathname);
                    return {
                        matches: notFoundMatches,
                        loaderData: {},
                        errors: {
                            [route.id]: error,
                        },
                    };
                }
                else {
                    matches = discoverResult.matches;
                }
            }
            let routesToUse = inFlightDataRoutes || dataRoutes;
            let [matchesToLoad, revalidatingFetchers] = getMatchesToLoad(init.history, state, matches, activeSubmission, location, initialHydration === true, isRevalidationRequired, cancelledFetcherLoads, fetchersQueuedForDeletion, fetchLoadMatches, fetchRedirectIds, routesToUse, basename, pendingActionResult);
            pendingNavigationLoadId = ++incrementingLoadId;
            // Short circuit if we have no loaders to run
            if (matchesToLoad.length === 0 && revalidatingFetchers.length === 0) {
                let updatedFetchers = markFetchRedirectsDone();
                completeNavigation(location, {
                    matches,
                    loaderData: {},
                    // Commit pending error if we're short circuiting
                    errors: pendingActionResult && isErrorResult(pendingActionResult[1])
                        ? { [pendingActionResult[0]]: pendingActionResult[1].error }
                        : null,
                    ...getActionDataForCommit(pendingActionResult),
                    ...(updatedFetchers ? { fetchers: new Map(state.fetchers) } : {}),
                }, { flushSync });
                return { shortCircuited: true };
            }
            if (shouldUpdateNavigationState) {
                let updates = {};
                if (!isFogOfWar) {
                    // Only update navigation/actionNData if we didn't already do it above
                    updates.navigation = loadingNavigation;
                    let actionData = getUpdatedActionData(pendingActionResult);
                    if (actionData !== undefined) {
                        updates.actionData = actionData;
                    }
                }
                if (revalidatingFetchers.length > 0) {
                    updates.fetchers = getUpdatedRevalidatingFetchers(revalidatingFetchers);
                }
                updateState(updates, { flushSync });
            }
            revalidatingFetchers.forEach((rf) => {
                abortFetcher(rf.key);
                if (rf.controller) {
                    // Fetchers use an independent AbortController so that aborting a fetcher
                    // (via deleteFetcher) does not abort the triggering navigation that
                    // triggered the revalidation
                    fetchControllers.set(rf.key, rf.controller);
                }
            });
            // Proxy navigation abort through to revalidation fetchers
            let abortPendingFetchRevalidations = () => revalidatingFetchers.forEach((f) => abortFetcher(f.key));
            if (pendingNavigationController) {
                pendingNavigationController.signal.addEventListener("abort", abortPendingFetchRevalidations);
            }
            let { loaderResults, fetcherResults } = await callLoadersAndMaybeResolveData(matches, matchesToLoad, revalidatingFetchers, request, scopedContext);
            if (request.signal.aborted) {
                return { shortCircuited: true };
            }
            // Clean up _after_ loaders have completed.  Don't clean up if we short
            // circuited because fetchControllers would have been aborted and
            // reassigned to new controllers for the next navigation
            if (pendingNavigationController) {
                pendingNavigationController.signal.removeEventListener("abort", abortPendingFetchRevalidations);
            }
            revalidatingFetchers.forEach((rf) => fetchControllers.delete(rf.key));
            // If any loaders returned a redirect Response, start a new REPLACE navigation
            let redirect = findRedirect(loaderResults);
            if (redirect) {
                await startRedirectNavigation(request, redirect.result, true, {
                    replace,
                });
                return { shortCircuited: true };
            }
            redirect = findRedirect(fetcherResults);
            if (redirect) {
                // If this redirect came from a fetcher make sure we mark it in
                // fetchRedirectIds so it doesn't get revalidated on the next set of
                // loader executions
                fetchRedirectIds.add(redirect.key);
                await startRedirectNavigation(request, redirect.result, true, {
                    replace,
                });
                return { shortCircuited: true };
            }
            // Process and commit output from loaders
            let { loaderData, errors } = processLoaderData(state, matches, loaderResults, pendingActionResult, revalidatingFetchers, fetcherResults);
            // Preserve SSR errors during partial hydration
            if (initialHydration && state.errors) {
                errors = { ...state.errors, ...errors };
            }
            let updatedFetchers = markFetchRedirectsDone();
            let didAbortFetchLoads = abortStaleFetchLoads(pendingNavigationLoadId);
            let shouldUpdateFetchers = updatedFetchers || didAbortFetchLoads || revalidatingFetchers.length > 0;
            return {
                matches,
                loaderData,
                errors,
                ...(shouldUpdateFetchers ? { fetchers: new Map(state.fetchers) } : {}),
            };
        }
        function getUpdatedActionData(pendingActionResult) {
            if (pendingActionResult && !isErrorResult(pendingActionResult[1])) {
                // This is cast to `any` currently because `RouteData`uses any and it
                // would be a breaking change to use any.
                // TODO: v7 - change `RouteData` to use `unknown` instead of `any`
                return {
                    [pendingActionResult[0]]: pendingActionResult[1].data,
                };
            }
            else if (state.actionData) {
                if (Object.keys(state.actionData).length === 0) {
                    return null;
                }
                else {
                    return state.actionData;
                }
            }
        }
        function getUpdatedRevalidatingFetchers(revalidatingFetchers) {
            revalidatingFetchers.forEach((rf) => {
                let fetcher = state.fetchers.get(rf.key);
                let revalidatingFetcher = getLoadingFetcher(undefined, fetcher ? fetcher.data : undefined);
                state.fetchers.set(rf.key, revalidatingFetcher);
            });
            return new Map(state.fetchers);
        }
        // Trigger a fetcher load/submit for the given fetcher key
        async function fetch(key, routeId, href, opts) {
            abortFetcher(key);
            let flushSync = (opts && opts.flushSync) === true;
            let routesToUse = inFlightDataRoutes || dataRoutes;
            let normalizedPath = normalizeTo(state.location, state.matches, basename, href, routeId, opts?.relative);
            let matches = matchRoutes(routesToUse, normalizedPath, basename);
            let fogOfWar = checkFogOfWar(matches, routesToUse, normalizedPath);
            if (fogOfWar.active && fogOfWar.matches) {
                matches = fogOfWar.matches;
            }
            if (!matches) {
                setFetcherError(key, routeId, getInternalRouterError(404, { pathname: normalizedPath }), { flushSync });
                return;
            }
            let { path, submission, error } = normalizeNavigateOptions(true, normalizedPath, opts);
            if (error) {
                setFetcherError(key, routeId, error, { flushSync });
                return;
            }
            let match = getTargetMatch(matches, path);
            // Create a new context per fetch
            let scopedContext = new unstable_RouterContextProvider(init.unstable_getContext ? await init.unstable_getContext() : undefined);
            let preventScrollReset = (opts && opts.preventScrollReset) === true;
            if (submission && isMutationMethod(submission.formMethod)) {
                await handleFetcherAction(key, routeId, path, match, matches, scopedContext, fogOfWar.active, flushSync, preventScrollReset, submission);
                return;
            }
            // Store off the match so we can call it's shouldRevalidate on subsequent
            // revalidations
            fetchLoadMatches.set(key, { routeId, path });
            await handleFetcherLoader(key, routeId, path, match, matches, scopedContext, fogOfWar.active, flushSync, preventScrollReset, submission);
        }
        // Call the action for the matched fetcher.submit(), and then handle redirects,
        // errors, and revalidation
        async function handleFetcherAction(key, routeId, path, match, requestMatches, scopedContext, isFogOfWar, flushSync, preventScrollReset, submission) {
            interruptActiveLoads();
            fetchLoadMatches.delete(key);
            function detectAndHandle405Error(m) {
                if (!m.route.action && !m.route.lazy) {
                    let error = getInternalRouterError(405, {
                        method: submission.formMethod,
                        pathname: path,
                        routeId: routeId,
                    });
                    setFetcherError(key, routeId, error, { flushSync });
                    return true;
                }
                return false;
            }
            if (!isFogOfWar && detectAndHandle405Error(match)) {
                return;
            }
            // Put this fetcher into it's submitting state
            let existingFetcher = state.fetchers.get(key);
            updateFetcherState(key, getSubmittingFetcher(submission, existingFetcher), {
                flushSync,
            });
            let abortController = new AbortController();
            let fetchRequest = createClientSideRequest(init.history, path, abortController.signal, submission);
            if (isFogOfWar) {
                let discoverResult = await discoverRoutes(requestMatches, path, fetchRequest.signal, key);
                if (discoverResult.type === "aborted") {
                    return;
                }
                else if (discoverResult.type === "error") {
                    setFetcherError(key, routeId, discoverResult.error, { flushSync });
                    return;
                }
                else if (!discoverResult.matches) {
                    setFetcherError(key, routeId, getInternalRouterError(404, { pathname: path }), { flushSync });
                    return;
                }
                else {
                    requestMatches = discoverResult.matches;
                    match = getTargetMatch(requestMatches, path);
                    if (detectAndHandle405Error(match)) {
                        return;
                    }
                }
            }
            // Call the action for the fetcher
            fetchControllers.set(key, abortController);
            let originatingLoadId = incrementingLoadId;
            let actionResults = await callDataStrategy("action", fetchRequest, [match], requestMatches, scopedContext, key);
            let actionResult = actionResults[match.route.id];
            if (fetchRequest.signal.aborted) {
                // We can delete this so long as we weren't aborted by our own fetcher
                // re-submit which would have put _new_ controller is in fetchControllers
                if (fetchControllers.get(key) === abortController) {
                    fetchControllers.delete(key);
                }
                return;
            }
            // We don't want errors bubbling up to the UI or redirects processed for
            // unmounted fetchers so we just revert them to idle
            if (fetchersQueuedForDeletion.has(key)) {
                if (isRedirectResult(actionResult) || isErrorResult(actionResult)) {
                    updateFetcherState(key, getDoneFetcher(undefined));
                    return;
                }
                // Let SuccessResult's fall through for revalidation
            }
            else {
                if (isRedirectResult(actionResult)) {
                    fetchControllers.delete(key);
                    if (pendingNavigationLoadId > originatingLoadId) {
                        // A new navigation was kicked off after our action started, so that
                        // should take precedence over this redirect navigation.  We already
                        // set isRevalidationRequired so all loaders for the new route should
                        // fire unless opted out via shouldRevalidate
                        updateFetcherState(key, getDoneFetcher(undefined));
                        return;
                    }
                    else {
                        fetchRedirectIds.add(key);
                        updateFetcherState(key, getLoadingFetcher(submission));
                        return startRedirectNavigation(fetchRequest, actionResult, false, {
                            fetcherSubmission: submission,
                            preventScrollReset,
                        });
                    }
                }
                // Process any non-redirect errors thrown
                if (isErrorResult(actionResult)) {
                    setFetcherError(key, routeId, actionResult.error);
                    return;
                }
            }
            // Start the data load for current matches, or the next location if we're
            // in the middle of a navigation
            let nextLocation = state.navigation.location || state.location;
            let revalidationRequest = createClientSideRequest(init.history, nextLocation, abortController.signal);
            let routesToUse = inFlightDataRoutes || dataRoutes;
            let matches = state.navigation.state !== "idle"
                ? matchRoutes(routesToUse, state.navigation.location, basename)
                : state.matches;
            invariant$2(matches, "Didn't find any matches after fetcher action");
            let loadId = ++incrementingLoadId;
            fetchReloadIds.set(key, loadId);
            let loadFetcher = getLoadingFetcher(submission, actionResult.data);
            state.fetchers.set(key, loadFetcher);
            let [matchesToLoad, revalidatingFetchers] = getMatchesToLoad(init.history, state, matches, submission, nextLocation, false, isRevalidationRequired, cancelledFetcherLoads, fetchersQueuedForDeletion, fetchLoadMatches, fetchRedirectIds, routesToUse, basename, [match.route.id, actionResult]);
            // Put all revalidating fetchers into the loading state, except for the
            // current fetcher which we want to keep in it's current loading state which
            // contains it's action submission info + action data
            revalidatingFetchers
                .filter((rf) => rf.key !== key)
                .forEach((rf) => {
                let staleKey = rf.key;
                let existingFetcher = state.fetchers.get(staleKey);
                let revalidatingFetcher = getLoadingFetcher(undefined, existingFetcher ? existingFetcher.data : undefined);
                state.fetchers.set(staleKey, revalidatingFetcher);
                abortFetcher(staleKey);
                if (rf.controller) {
                    fetchControllers.set(staleKey, rf.controller);
                }
            });
            updateState({ fetchers: new Map(state.fetchers) });
            let abortPendingFetchRevalidations = () => revalidatingFetchers.forEach((rf) => abortFetcher(rf.key));
            abortController.signal.addEventListener("abort", abortPendingFetchRevalidations);
            let { loaderResults, fetcherResults } = await callLoadersAndMaybeResolveData(matches, matchesToLoad, revalidatingFetchers, revalidationRequest, scopedContext);
            if (abortController.signal.aborted) {
                return;
            }
            abortController.signal.removeEventListener("abort", abortPendingFetchRevalidations);
            fetchReloadIds.delete(key);
            fetchControllers.delete(key);
            revalidatingFetchers.forEach((r) => fetchControllers.delete(r.key));
            let redirect = findRedirect(loaderResults);
            if (redirect) {
                return startRedirectNavigation(revalidationRequest, redirect.result, false, { preventScrollReset });
            }
            redirect = findRedirect(fetcherResults);
            if (redirect) {
                // If this redirect came from a fetcher make sure we mark it in
                // fetchRedirectIds so it doesn't get revalidated on the next set of
                // loader executions
                fetchRedirectIds.add(redirect.key);
                return startRedirectNavigation(revalidationRequest, redirect.result, false, { preventScrollReset });
            }
            // Process and commit output from loaders
            let { loaderData, errors } = processLoaderData(state, matches, loaderResults, undefined, revalidatingFetchers, fetcherResults);
            // Since we let revalidations complete even if the submitting fetcher was
            // deleted, only put it back to idle if it hasn't been deleted
            if (state.fetchers.has(key)) {
                let doneFetcher = getDoneFetcher(actionResult.data);
                state.fetchers.set(key, doneFetcher);
            }
            abortStaleFetchLoads(loadId);
            // If we are currently in a navigation loading state and this fetcher is
            // more recent than the navigation, we want the newer data so abort the
            // navigation and complete it with the fetcher data
            if (state.navigation.state === "loading" &&
                loadId > pendingNavigationLoadId) {
                invariant$2(pendingAction, "Expected pending action");
                pendingNavigationController && pendingNavigationController.abort();
                completeNavigation(state.navigation.location, {
                    matches,
                    loaderData,
                    errors,
                    fetchers: new Map(state.fetchers),
                });
            }
            else {
                // otherwise just update with the fetcher data, preserving any existing
                // loaderData for loaders that did not need to reload.  We have to
                // manually merge here since we aren't going through completeNavigation
                updateState({
                    errors,
                    loaderData: mergeLoaderData(state.loaderData, loaderData, matches, errors),
                    fetchers: new Map(state.fetchers),
                });
                isRevalidationRequired = false;
            }
        }
        // Call the matched loader for fetcher.load(), handling redirects, errors, etc.
        async function handleFetcherLoader(key, routeId, path, match, matches, scopedContext, isFogOfWar, flushSync, preventScrollReset, submission) {
            let existingFetcher = state.fetchers.get(key);
            updateFetcherState(key, getLoadingFetcher(submission, existingFetcher ? existingFetcher.data : undefined), { flushSync });
            let abortController = new AbortController();
            let fetchRequest = createClientSideRequest(init.history, path, abortController.signal);
            if (isFogOfWar) {
                let discoverResult = await discoverRoutes(matches, path, fetchRequest.signal, key);
                if (discoverResult.type === "aborted") {
                    return;
                }
                else if (discoverResult.type === "error") {
                    setFetcherError(key, routeId, discoverResult.error, { flushSync });
                    return;
                }
                else if (!discoverResult.matches) {
                    setFetcherError(key, routeId, getInternalRouterError(404, { pathname: path }), { flushSync });
                    return;
                }
                else {
                    matches = discoverResult.matches;
                    match = getTargetMatch(matches, path);
                }
            }
            // Call the loader for this fetcher route match
            fetchControllers.set(key, abortController);
            let originatingLoadId = incrementingLoadId;
            let results = await callDataStrategy("loader", fetchRequest, [match], matches, scopedContext, key);
            let result = results[match.route.id];
            // We can delete this so long as we weren't aborted by our our own fetcher
            // re-load which would have put _new_ controller is in fetchControllers
            if (fetchControllers.get(key) === abortController) {
                fetchControllers.delete(key);
            }
            if (fetchRequest.signal.aborted) {
                return;
            }
            // We don't want errors bubbling up or redirects followed for unmounted
            // fetchers, so short circuit here if it was removed from the UI
            if (fetchersQueuedForDeletion.has(key)) {
                updateFetcherState(key, getDoneFetcher(undefined));
                return;
            }
            // If the loader threw a redirect Response, start a new REPLACE navigation
            if (isRedirectResult(result)) {
                if (pendingNavigationLoadId > originatingLoadId) {
                    // A new navigation was kicked off after our loader started, so that
                    // should take precedence over this redirect navigation
                    updateFetcherState(key, getDoneFetcher(undefined));
                    return;
                }
                else {
                    fetchRedirectIds.add(key);
                    await startRedirectNavigation(fetchRequest, result, false, {
                        preventScrollReset,
                    });
                    return;
                }
            }
            // Process any non-redirect errors thrown
            if (isErrorResult(result)) {
                setFetcherError(key, routeId, result.error);
                return;
            }
            // Put the fetcher back into an idle state
            updateFetcherState(key, getDoneFetcher(result.data));
        }
        /**
         * Utility function to handle redirects returned from an action or loader.
         * Normally, a redirect "replaces" the navigation that triggered it.  So, for
         * example:
         *
         *  - user is on /a
         *  - user clicks a link to /b
         *  - loader for /b redirects to /c
         *
         * In a non-JS app the browser would track the in-flight navigation to /b and
         * then replace it with /c when it encountered the redirect response.  In
         * the end it would only ever update the URL bar with /c.
         *
         * In client-side routing using pushState/replaceState, we aim to emulate
         * this behavior and we also do not update history until the end of the
         * navigation (including processed redirects).  This means that we never
         * actually touch history until we've processed redirects, so we just use
         * the history action from the original navigation (PUSH or REPLACE).
         */
        async function startRedirectNavigation(request, redirect, isNavigation, { submission, fetcherSubmission, preventScrollReset, replace, } = {}) {
            if (redirect.response.headers.has("X-Remix-Revalidate")) {
                isRevalidationRequired = true;
            }
            let location = redirect.response.headers.get("Location");
            invariant$2(location, "Expected a Location header on the redirect Response");
            location = normalizeRedirectLocation(location, new URL(request.url), basename);
            let redirectLocation = createLocation(state.location, location, {
                _isRedirect: true,
            });
            if (isBrowser) {
                let isDocumentReload = false;
                if (redirect.response.headers.has("X-Remix-Reload-Document")) {
                    // Hard reload if the response contained X-Remix-Reload-Document
                    isDocumentReload = true;
                }
                else if (ABSOLUTE_URL_REGEX$2.test(location)) {
                    const url = init.history.createURL(location);
                    isDocumentReload =
                        // Hard reload if it's an absolute URL to a new origin
                        url.origin !== routerWindow.location.origin ||
                            // Hard reload if it's an absolute URL that does not match our basename
                            stripBasename(url.pathname, basename) == null;
                }
                if (isDocumentReload) {
                    if (replace) {
                        routerWindow.location.replace(location);
                    }
                    else {
                        routerWindow.location.assign(location);
                    }
                    return;
                }
            }
            // There's no need to abort on redirects, since we don't detect the
            // redirect until the action/loaders have settled
            pendingNavigationController = null;
            let redirectNavigationType = replace === true || redirect.response.headers.has("X-Remix-Replace")
                ? exports.NavigationType.Replace
                : exports.NavigationType.Push;
            // Use the incoming submission if provided, fallback on the active one in
            // state.navigation
            let { formMethod, formAction, formEncType } = state.navigation;
            if (!submission &&
                !fetcherSubmission &&
                formMethod &&
                formAction &&
                formEncType) {
                submission = getSubmissionFromNavigation(state.navigation);
            }
            // If this was a 307/308 submission we want to preserve the HTTP method and
            // re-submit the GET/POST/PUT/PATCH/DELETE as a submission navigation to the
            // redirected location
            let activeSubmission = submission || fetcherSubmission;
            if (redirectPreserveMethodStatusCodes.has(redirect.response.status) &&
                activeSubmission &&
                isMutationMethod(activeSubmission.formMethod)) {
                await startNavigation(redirectNavigationType, redirectLocation, {
                    submission: {
                        ...activeSubmission,
                        formAction: location,
                    },
                    // Preserve these flags across redirects
                    preventScrollReset: preventScrollReset || pendingPreventScrollReset,
                    enableViewTransition: isNavigation
                        ? pendingViewTransitionEnabled
                        : undefined,
                });
            }
            else {
                // If we have a navigation submission, we will preserve it through the
                // redirect navigation
                let overrideNavigation = getLoadingNavigation(redirectLocation, submission);
                await startNavigation(redirectNavigationType, redirectLocation, {
                    overrideNavigation,
                    // Send fetcher submissions through for shouldRevalidate
                    fetcherSubmission,
                    // Preserve these flags across redirects
                    preventScrollReset: preventScrollReset || pendingPreventScrollReset,
                    enableViewTransition: isNavigation
                        ? pendingViewTransitionEnabled
                        : undefined,
                });
            }
        }
        // Utility wrapper for calling dataStrategy client-side without having to
        // pass around the manifest, mapRouteProperties, etc.
        async function callDataStrategy(type, request, matchesToLoad, matches, scopedContext, fetcherKey) {
            let results;
            let dataResults = {};
            try {
                results = await callDataStrategyImpl(dataStrategyImpl, type, request, matchesToLoad, matches, fetcherKey, manifest, mapRouteProperties, scopedContext);
            }
            catch (e) {
                // If the outer dataStrategy method throws, just return the error for all
                // matches - and it'll naturally bubble to the root
                matchesToLoad.forEach((m) => {
                    dataResults[m.route.id] = {
                        type: ResultType.error,
                        error: e,
                    };
                });
                return dataResults;
            }
            for (let [routeId, result] of Object.entries(results)) {
                if (isRedirectDataStrategyResult(result)) {
                    let response = result.result;
                    dataResults[routeId] = {
                        type: ResultType.redirect,
                        response: normalizeRelativeRoutingRedirectResponse(response, request, routeId, matches, basename),
                    };
                }
                else {
                    dataResults[routeId] = await convertDataStrategyResultToDataResult(result);
                }
            }
            return dataResults;
        }
        async function callLoadersAndMaybeResolveData(matches, matchesToLoad, fetchersToLoad, request, scopedContext) {
            // Kick off loaders and fetchers in parallel
            let loaderResultsPromise = callDataStrategy("loader", request, matchesToLoad, matches, scopedContext, null);
            let fetcherResultsPromise = Promise.all(fetchersToLoad.map(async (f) => {
                if (f.matches && f.match && f.controller) {
                    let results = await callDataStrategy("loader", createClientSideRequest(init.history, f.path, f.controller.signal), [f.match], f.matches, scopedContext, f.key);
                    let result = results[f.match.route.id];
                    // Fetcher results are keyed by fetcher key from here on out, not routeId
                    return { [f.key]: result };
                }
                else {
                    return Promise.resolve({
                        [f.key]: {
                            type: ResultType.error,
                            error: getInternalRouterError(404, {
                                pathname: f.path,
                            }),
                        },
                    });
                }
            }));
            let loaderResults = await loaderResultsPromise;
            let fetcherResults = (await fetcherResultsPromise).reduce((acc, r) => Object.assign(acc, r), {});
            return {
                loaderResults,
                fetcherResults,
            };
        }
        function interruptActiveLoads() {
            // Every interruption triggers a revalidation
            isRevalidationRequired = true;
            // Abort in-flight fetcher loads
            fetchLoadMatches.forEach((_, key) => {
                if (fetchControllers.has(key)) {
                    cancelledFetcherLoads.add(key);
                }
                abortFetcher(key);
            });
        }
        function updateFetcherState(key, fetcher, opts = {}) {
            state.fetchers.set(key, fetcher);
            updateState({ fetchers: new Map(state.fetchers) }, { flushSync: (opts && opts.flushSync) === true });
        }
        function setFetcherError(key, routeId, error, opts = {}) {
            let boundaryMatch = findNearestBoundary(state.matches, routeId);
            deleteFetcher(key);
            updateState({
                errors: {
                    [boundaryMatch.route.id]: error,
                },
                fetchers: new Map(state.fetchers),
            }, { flushSync: (opts && opts.flushSync) === true });
        }
        function getFetcher(key) {
            activeFetchers.set(key, (activeFetchers.get(key) || 0) + 1);
            // If this fetcher was previously marked for deletion, unmark it since we
            // have a new instance
            if (fetchersQueuedForDeletion.has(key)) {
                fetchersQueuedForDeletion.delete(key);
            }
            return state.fetchers.get(key) || IDLE_FETCHER;
        }
        function deleteFetcher(key) {
            let fetcher = state.fetchers.get(key);
            // Don't abort the controller if this is a deletion of a fetcher.submit()
            // in it's loading phase since - we don't want to abort the corresponding
            // revalidation and want them to complete and land
            if (fetchControllers.has(key) &&
                !(fetcher && fetcher.state === "loading" && fetchReloadIds.has(key))) {
                abortFetcher(key);
            }
            fetchLoadMatches.delete(key);
            fetchReloadIds.delete(key);
            fetchRedirectIds.delete(key);
            fetchersQueuedForDeletion.delete(key);
            cancelledFetcherLoads.delete(key);
            state.fetchers.delete(key);
        }
        function queueFetcherForDeletion(key) {
            let count = (activeFetchers.get(key) || 0) - 1;
            if (count <= 0) {
                activeFetchers.delete(key);
                fetchersQueuedForDeletion.add(key);
            }
            else {
                activeFetchers.set(key, count);
            }
            updateState({ fetchers: new Map(state.fetchers) });
        }
        function abortFetcher(key) {
            let controller = fetchControllers.get(key);
            if (controller) {
                controller.abort();
                fetchControllers.delete(key);
            }
        }
        function markFetchersDone(keys) {
            for (let key of keys) {
                let fetcher = getFetcher(key);
                let doneFetcher = getDoneFetcher(fetcher.data);
                state.fetchers.set(key, doneFetcher);
            }
        }
        function markFetchRedirectsDone() {
            let doneKeys = [];
            let updatedFetchers = false;
            for (let key of fetchRedirectIds) {
                let fetcher = state.fetchers.get(key);
                invariant$2(fetcher, `Expected fetcher: ${key}`);
                if (fetcher.state === "loading") {
                    fetchRedirectIds.delete(key);
                    doneKeys.push(key);
                    updatedFetchers = true;
                }
            }
            markFetchersDone(doneKeys);
            return updatedFetchers;
        }
        function abortStaleFetchLoads(landedId) {
            let yeetedKeys = [];
            for (let [key, id] of fetchReloadIds) {
                if (id < landedId) {
                    let fetcher = state.fetchers.get(key);
                    invariant$2(fetcher, `Expected fetcher: ${key}`);
                    if (fetcher.state === "loading") {
                        abortFetcher(key);
                        fetchReloadIds.delete(key);
                        yeetedKeys.push(key);
                    }
                }
            }
            markFetchersDone(yeetedKeys);
            return yeetedKeys.length > 0;
        }
        function getBlocker(key, fn) {
            let blocker = state.blockers.get(key) || IDLE_BLOCKER;
            if (blockerFunctions.get(key) !== fn) {
                blockerFunctions.set(key, fn);
            }
            return blocker;
        }
        function deleteBlocker(key) {
            state.blockers.delete(key);
            blockerFunctions.delete(key);
        }
        // Utility function to update blockers, ensuring valid state transitions
        function updateBlocker(key, newBlocker) {
            let blocker = state.blockers.get(key) || IDLE_BLOCKER;
            // Poor mans state machine :)
            // https://mermaid.live/edit#pako:eNqVkc9OwzAMxl8l8nnjAYrEtDIOHEBIgwvKJTReGy3_lDpIqO27k6awMG0XcrLlnz87nwdonESogKXXBuE79rq75XZO3-yHds0RJVuv70YrPlUrCEe2HfrORS3rubqZfuhtpg5C9wk5tZ4VKcRUq88q9Z8RS0-48cE1iHJkL0ugbHuFLus9L6spZy8nX9MP2CNdomVaposqu3fGayT8T8-jJQwhepo_UtpgBQaDEUom04dZhAN1aJBDlUKJBxE1ceB2Smj0Mln-IBW5AFU2dwUiktt_2Qaq2dBfaKdEup85UV7Yd-dKjlnkabl2Pvr0DTkTreM
            invariant$2((blocker.state === "unblocked" && newBlocker.state === "blocked") ||
                (blocker.state === "blocked" && newBlocker.state === "blocked") ||
                (blocker.state === "blocked" && newBlocker.state === "proceeding") ||
                (blocker.state === "blocked" && newBlocker.state === "unblocked") ||
                (blocker.state === "proceeding" && newBlocker.state === "unblocked"), `Invalid blocker state transition: ${blocker.state} -> ${newBlocker.state}`);
            let blockers = new Map(state.blockers);
            blockers.set(key, newBlocker);
            updateState({ blockers });
        }
        function shouldBlockNavigation({ currentLocation, nextLocation, historyAction, }) {
            if (blockerFunctions.size === 0) {
                return;
            }
            // We ony support a single active blocker at the moment since we don't have
            // any compelling use cases for multi-blocker yet
            if (blockerFunctions.size > 1) {
                warning(false, "A router only supports one blocker at a time");
            }
            let entries = Array.from(blockerFunctions.entries());
            let [blockerKey, blockerFunction] = entries[entries.length - 1];
            let blocker = state.blockers.get(blockerKey);
            if (blocker && blocker.state === "proceeding") {
                // If the blocker is currently proceeding, we don't need to re-check
                // it and can let this navigation continue
                return;
            }
            // At this point, we know we're unblocked/blocked so we need to check the
            // user-provided blocker function
            if (blockerFunction({ currentLocation, nextLocation, historyAction })) {
                return blockerKey;
            }
        }
        function handleNavigational404(pathname) {
            let error = getInternalRouterError(404, { pathname });
            let routesToUse = inFlightDataRoutes || dataRoutes;
            let { matches, route } = getShortCircuitMatches(routesToUse);
            return { notFoundMatches: matches, route, error };
        }
        // Opt in to capturing and reporting scroll positions during navigations,
        // used by the <ScrollRestoration> component
        function enableScrollRestoration(positions, getPosition, getKey) {
            savedScrollPositions = positions;
            getScrollPosition = getPosition;
            getScrollRestorationKey = getKey || null;
            // Perform initial hydration scroll restoration, since we miss the boat on
            // the initial updateState() because we've not yet rendered <ScrollRestoration/>
            // and therefore have no savedScrollPositions available
            if (!initialScrollRestored && state.navigation === IDLE_NAVIGATION) {
                initialScrollRestored = true;
                let y = getSavedScrollPosition(state.location, state.matches);
                if (y != null) {
                    updateState({ restoreScrollPosition: y });
                }
            }
            return () => {
                savedScrollPositions = null;
                getScrollPosition = null;
                getScrollRestorationKey = null;
            };
        }
        function getScrollKey(location, matches) {
            if (getScrollRestorationKey) {
                let key = getScrollRestorationKey(location, matches.map((m) => convertRouteMatchToUiMatch(m, state.loaderData)));
                return key || location.key;
            }
            return location.key;
        }
        function saveScrollPosition(location, matches) {
            if (savedScrollPositions && getScrollPosition) {
                let key = getScrollKey(location, matches);
                savedScrollPositions[key] = getScrollPosition();
            }
        }
        function getSavedScrollPosition(location, matches) {
            if (savedScrollPositions) {
                let key = getScrollKey(location, matches);
                let y = savedScrollPositions[key];
                if (typeof y === "number") {
                    return y;
                }
            }
            return null;
        }
        function checkFogOfWar(matches, routesToUse, pathname) {
            if (init.patchRoutesOnNavigation) {
                if (!matches) {
                    let fogMatches = matchRoutesImpl(routesToUse, pathname, basename, true);
                    return { active: true, matches: fogMatches || [] };
                }
                else {
                    if (Object.keys(matches[0].params).length > 0) {
                        // If we matched a dynamic param or a splat, it might only be because
                        // we haven't yet discovered other routes that would match with a
                        // higher score.  Call patchRoutesOnNavigation just to be sure
                        let partialMatches = matchRoutesImpl(routesToUse, pathname, basename, true);
                        return { active: true, matches: partialMatches };
                    }
                }
            }
            return { active: false, matches: null };
        }
        async function discoverRoutes(matches, pathname, signal, fetcherKey) {
            if (!init.patchRoutesOnNavigation) {
                return { type: "success", matches };
            }
            let partialMatches = matches;
            while (true) {
                let isNonHMR = inFlightDataRoutes == null;
                let routesToUse = inFlightDataRoutes || dataRoutes;
                let localManifest = manifest;
                try {
                    await init.patchRoutesOnNavigation({
                        signal,
                        path: pathname,
                        matches: partialMatches,
                        fetcherKey,
                        patch: (routeId, children) => {
                            if (signal.aborted)
                                return;
                            patchRoutesImpl(routeId, children, routesToUse, localManifest, mapRouteProperties);
                        },
                    });
                }
                catch (e) {
                    return { type: "error", error: e, partialMatches };
                }
                finally {
                    // If we are not in the middle of an HMR revalidation and we changed the
                    // routes, provide a new identity so when we `updateState` at the end of
                    // this navigation/fetch `router.routes` will be a new identity and
                    // trigger a re-run of memoized `router.routes` dependencies.
                    // HMR will already update the identity and reflow when it lands
                    // `inFlightDataRoutes` in `completeNavigation`
                    if (isNonHMR && !signal.aborted) {
                        dataRoutes = [...dataRoutes];
                    }
                }
                if (signal.aborted) {
                    return { type: "aborted" };
                }
                let newMatches = matchRoutes(routesToUse, pathname, basename);
                if (newMatches) {
                    return { type: "success", matches: newMatches };
                }
                let newPartialMatches = matchRoutesImpl(routesToUse, pathname, basename, true);
                // Avoid loops if the second pass results in the same partial matches
                if (!newPartialMatches ||
                    (partialMatches.length === newPartialMatches.length &&
                        partialMatches.every((m, i) => m.route.id === newPartialMatches[i].route.id))) {
                    return { type: "success", matches: null };
                }
                partialMatches = newPartialMatches;
            }
        }
        function _internalSetRoutes(newRoutes) {
            manifest = {};
            inFlightDataRoutes = convertRoutesToDataRoutes(newRoutes, mapRouteProperties, undefined, manifest);
        }
        function patchRoutes(routeId, children) {
            let isNonHMR = inFlightDataRoutes == null;
            let routesToUse = inFlightDataRoutes || dataRoutes;
            patchRoutesImpl(routeId, children, routesToUse, manifest, mapRouteProperties);
            // If we are not in the middle of an HMR revalidation and we changed the
            // routes, provide a new identity and trigger a reflow via `updateState`
            // to re-run memoized `router.routes` dependencies.
            // HMR will already update the identity and reflow when it lands
            // `inFlightDataRoutes` in `completeNavigation`
            if (isNonHMR) {
                dataRoutes = [...dataRoutes];
                updateState({});
            }
        }
        router = {
            get basename() {
                return basename;
            },
            get future() {
                return future;
            },
            get state() {
                return state;
            },
            get routes() {
                return dataRoutes;
            },
            get window() {
                return routerWindow;
            },
            initialize,
            subscribe,
            enableScrollRestoration,
            navigate,
            fetch,
            revalidate,
            // Passthrough to history-aware createHref used by useHref so we get proper
            // hash-aware URLs in DOM paths
            createHref: (to) => init.history.createHref(to),
            encodeLocation: (to) => init.history.encodeLocation(to),
            getFetcher,
            deleteFetcher: queueFetcherForDeletion,
            dispose,
            getBlocker,
            deleteBlocker,
            patchRoutes,
            _internalFetchControllers: fetchControllers,
            // TODO: Remove setRoutes, it's temporary to avoid dealing with
            // updating the tree while validating the update algorithm.
            _internalSetRoutes,
        };
        return router;
    }
    function createStaticHandler$1(routes, opts) {
        invariant$2(routes.length > 0, "You must provide a non-empty routes array to createStaticHandler");
        let manifest = {};
        let basename = (opts ? opts.basename : null) || "/";
        let mapRouteProperties = opts?.mapRouteProperties || defaultMapRouteProperties;
        let dataRoutes = convertRoutesToDataRoutes(routes, mapRouteProperties, undefined, manifest);
        /**
         * The query() method is intended for document requests, in which we want to
         * call an optional action and potentially multiple loaders for all nested
         * routes.  It returns a StaticHandlerContext object, which is very similar
         * to the router state (location, loaderData, actionData, errors, etc.) and
         * also adds SSR-specific information such as the statusCode and headers
         * from action/loaders Responses.
         *
         * It _should_ never throw and should report all errors through the
         * returned handlerContext.errors object, properly associating errors to
         * their error boundary.  Additionally, it tracks _deepestRenderedBoundaryId
         * which can be used to emulate React error boundaries during SSR by performing
         * a second pass only down to the boundaryId.
         *
         * The one exception where we do not return a StaticHandlerContext is when a
         * redirect response is returned or thrown from any action/loader.  We
         * propagate that out and return the raw Response so the HTTP server can
         * return it directly.
         *
         * - `opts.requestContext` is an optional server context that will be passed
         *   to actions/loaders in the `context` parameter
         * - `opts.skipLoaderErrorBubbling` is an optional parameter that will prevent
         *   the bubbling of errors which allows single-fetch-type implementations
         *   where the client will handle the bubbling and we may need to return data
         *   for the handling route
         */
        async function query(request, { requestContext, filterMatchesToLoad, skipLoaderErrorBubbling, skipRevalidation, dataStrategy, unstable_respond: respond, } = {}) {
            let url = new URL(request.url);
            let method = request.method;
            let location = createLocation("", createPath(url), null, "default");
            let matches = matchRoutes(dataRoutes, location, basename);
            requestContext =
                requestContext != null
                    ? requestContext
                    : new unstable_RouterContextProvider();
            // SSR supports HEAD requests while SPA doesn't
            if (!isValidMethod(method) && method !== "HEAD") {
                let error = getInternalRouterError(405, { method });
                let { matches: methodNotAllowedMatches, route } = getShortCircuitMatches(dataRoutes);
                let staticContext = {
                    basename,
                    location,
                    matches: methodNotAllowedMatches,
                    loaderData: {},
                    actionData: null,
                    errors: {
                        [route.id]: error,
                    },
                    statusCode: error.status,
                    loaderHeaders: {},
                    actionHeaders: {},
                };
                return respond ? respond(staticContext) : staticContext;
            }
            else if (!matches) {
                let error = getInternalRouterError(404, { pathname: location.pathname });
                let { matches: notFoundMatches, route } = getShortCircuitMatches(dataRoutes);
                let staticContext = {
                    basename,
                    location,
                    matches: notFoundMatches,
                    loaderData: {},
                    actionData: null,
                    errors: {
                        [route.id]: error,
                    },
                    statusCode: error.status,
                    loaderHeaders: {},
                    actionHeaders: {},
                };
                return respond ? respond(staticContext) : staticContext;
            }
            if (respond &&
                matches.some((m) => m.route.unstable_middleware ||
                    (typeof m.route.lazy === "object" && m.route.lazy.unstable_middleware))) {
                invariant$2(requestContext instanceof unstable_RouterContextProvider, "When using middleware in `staticHandler.query()`, any provided " +
                    "`requestContext` must be an instance of `unstable_RouterContextProvider`");
                try {
                    await loadLazyMiddlewareForMatches(matches, manifest, mapRouteProperties);
                    let renderedStaticContext;
                    let response = await runMiddlewarePipeline({
                        request,
                        matches,
                        params: matches[0].params,
                        // If we're calling middleware then it must be enabled so we can cast
                        // this to the proper type knowing it's not an `AppLoadContext`
                        context: requestContext,
                    }, true, async () => {
                        let result = await queryImpl(request, location, matches, requestContext, dataStrategy || null, skipLoaderErrorBubbling === true, null, filterMatchesToLoad || null, skipRevalidation === true);
                        if (isResponse(result)) {
                            return result;
                        }
                        // When returning StaticHandlerContext, we patch back in the location here
                        // since we need it for React Context.  But this helps keep our submit and
                        // loadRouteData operating on a Request instead of a Location
                        renderedStaticContext = { location, basename, ...result };
                        let res = await respond(renderedStaticContext);
                        return res;
                    }, async (error, routeId) => {
                        if (isResponse(error)) {
                            return error;
                        }
                        if (renderedStaticContext) {
                            // We rendered an HTML response and caught an error going back up
                            // the middleware chain - render again with an updated context
                            // If we had loaderData for the route that threw, clear it out
                            // to align server/client behavior.  Client side middleware uses
                            // dataStrategy and a given route can only have one result, so the
                            // error overwrites any prior loader data.
                            if (routeId in renderedStaticContext.loaderData) {
                                renderedStaticContext.loaderData[routeId] = undefined;
                            }
                            return respond(getStaticContextFromError(dataRoutes, renderedStaticContext, error, findNearestBoundary(matches, routeId).route.id));
                        }
                        else {
                            // We never even got to the handlers, so we've got no data -
                            // just create an empty context reflecting the error.
                            // Find the boundary at or above the highest loader.  We can't
                            // render any UI below there since we have no loader data available
                            let loaderIdx = matches.findIndex((m) => m.route.loader);
                            let boundary = loaderIdx >= 0
                                ? findNearestBoundary(matches, matches[loaderIdx].route.id)
                                : findNearestBoundary(matches);
                            return respond({
                                matches: matches,
                                location,
                                basename,
                                loaderData: {},
                                actionData: null,
                                errors: {
                                    [boundary.route.id]: error,
                                },
                                statusCode: isRouteErrorResponse(error) ? error.status : 500,
                                actionHeaders: {},
                                loaderHeaders: {},
                            });
                        }
                    });
                    invariant$2(isResponse(response), "Expected a response in query()");
                    return response;
                }
                catch (e) {
                    if (isResponse(e)) {
                        return e;
                    }
                    throw e;
                }
            }
            let result = await queryImpl(request, location, matches, requestContext, dataStrategy || null, skipLoaderErrorBubbling === true, null, filterMatchesToLoad || null, skipRevalidation === true);
            if (isResponse(result)) {
                return result;
            }
            // When returning StaticHandlerContext, we patch back in the location here
            // since we need it for React Context.  But this helps keep our submit and
            // loadRouteData operating on a Request instead of a Location
            return { location, basename, ...result };
        }
        /**
         * The queryRoute() method is intended for targeted route requests, either
         * for fetch ?_data requests or resource route requests.  In this case, we
         * are only ever calling a single action or loader, and we are returning the
         * returned value directly.  In most cases, this will be a Response returned
         * from the action/loader, but it may be a primitive or other value as well -
         * and in such cases the calling context should handle that accordingly.
         *
         * We do respect the throw/return differentiation, so if an action/loader
         * throws, then this method will throw the value.  This is important so we
         * can do proper boundary identification in Remix where a thrown Response
         * must go to the Catch Boundary but a returned Response is happy-path.
         *
         * One thing to note is that any Router-initiated Errors that make sense
         * to associate with a status code will be thrown as an ErrorResponse
         * instance which include the raw Error, such that the calling context can
         * serialize the error as they see fit while including the proper response
         * code.  Examples here are 404 and 405 errors that occur prior to reaching
         * any user-defined loaders.
         *
         * - `opts.routeId` allows you to specify the specific route handler to call.
         *   If not provided the handler will determine the proper route by matching
         *   against `request.url`
         * - `opts.requestContext` is an optional server context that will be passed
         *    to actions/loaders in the `context` parameter
         */
        async function queryRoute(request, { routeId, requestContext, dataStrategy, unstable_respond: respond, } = {}) {
            let url = new URL(request.url);
            let method = request.method;
            let location = createLocation("", createPath(url), null, "default");
            let matches = matchRoutes(dataRoutes, location, basename);
            requestContext =
                requestContext != null
                    ? requestContext
                    : new unstable_RouterContextProvider();
            // SSR supports HEAD requests while SPA doesn't
            if (!isValidMethod(method) && method !== "HEAD" && method !== "OPTIONS") {
                throw getInternalRouterError(405, { method });
            }
            else if (!matches) {
                throw getInternalRouterError(404, { pathname: location.pathname });
            }
            let match = routeId
                ? matches.find((m) => m.route.id === routeId)
                : getTargetMatch(matches, location);
            if (routeId && !match) {
                throw getInternalRouterError(403, {
                    pathname: location.pathname,
                    routeId,
                });
            }
            else if (!match) {
                // This should never hit I don't think?
                throw getInternalRouterError(404, { pathname: location.pathname });
            }
            if (respond &&
                matches.some((m) => m.route.unstable_middleware ||
                    (typeof m.route.lazy === "object" && m.route.lazy.unstable_middleware))) {
                invariant$2(requestContext instanceof unstable_RouterContextProvider, "When using middleware in `staticHandler.queryRoute()`, any provided " +
                    "`requestContext` must be an instance of `unstable_RouterContextProvider`");
                await loadLazyMiddlewareForMatches(matches, manifest, mapRouteProperties);
                let response = await runMiddlewarePipeline({
                    request,
                    matches,
                    params: matches[0].params,
                    // If we're calling middleware then it must be enabled so we can cast
                    // this to the proper type knowing it's not an `AppLoadContext`
                    context: requestContext,
                }, true, async () => {
                    let result = await queryImpl(request, location, matches, requestContext, dataStrategy || null, false, match, null, false);
                    if (isResponse(result)) {
                        return respond(result);
                    }
                    let error = result.errors
                        ? Object.values(result.errors)[0]
                        : undefined;
                    if (error !== undefined) {
                        // If we got back result.errors, that means the loader/action threw
                        // _something_ that wasn't a Response, but it's not guaranteed/required
                        // to be an `instanceof Error` either, so we have to use throw here to
                        // preserve the "error" state outside of queryImpl.
                        throw error;
                    }
                    // Pick off the right state value to return
                    let value = result.actionData
                        ? Object.values(result.actionData)[0]
                        : Object.values(result.loaderData)[0];
                    return typeof value === "string"
                        ? new Response(value)
                        : Response.json(value);
                }, (error) => {
                    if (isResponse(error)) {
                        return respond(error);
                    }
                    return new Response(String(error), {
                        status: 500,
                        statusText: "Unexpected Server Error",
                    });
                });
                return response;
            }
            let result = await queryImpl(request, location, matches, requestContext, dataStrategy || null, false, match, null, false);
            if (isResponse(result)) {
                return result;
            }
            let error = result.errors ? Object.values(result.errors)[0] : undefined;
            if (error !== undefined) {
                // If we got back result.errors, that means the loader/action threw
                // _something_ that wasn't a Response, but it's not guaranteed/required
                // to be an `instanceof Error` either, so we have to use throw here to
                // preserve the "error" state outside of queryImpl.
                throw error;
            }
            // Pick off the right state value to return
            if (result.actionData) {
                return Object.values(result.actionData)[0];
            }
            if (result.loaderData) {
                return Object.values(result.loaderData)[0];
            }
            return undefined;
        }
        async function queryImpl(request, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch, filterMatchesToLoad, skipRevalidation) {
            invariant$2(request.signal, "query()/queryRoute() requests must contain an AbortController signal");
            try {
                if (isMutationMethod(request.method)) {
                    let result = await submit(request, matches, routeMatch || getTargetMatch(matches, location), requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch != null, filterMatchesToLoad, skipRevalidation);
                    return result;
                }
                let result = await loadRouteData(request, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch, filterMatchesToLoad);
                return isResponse(result)
                    ? result
                    : {
                        ...result,
                        actionData: null,
                        actionHeaders: {},
                    };
            }
            catch (e) {
                // If the user threw/returned a Response in callLoaderOrAction for a
                // `queryRoute` call, we throw the `DataStrategyResult` to bail out early
                // and then return or throw the raw Response here accordingly
                if (isDataStrategyResult(e) && isResponse(e.result)) {
                    if (e.type === ResultType.error) {
                        throw e.result;
                    }
                    return e.result;
                }
                // Redirects are always returned since they don't propagate to catch
                // boundaries
                if (isRedirectResponse(e)) {
                    return e;
                }
                throw e;
            }
        }
        async function submit(request, matches, actionMatch, requestContext, dataStrategy, skipLoaderErrorBubbling, isRouteRequest, filterMatchesToLoad, skipRevalidation) {
            let result;
            if (!actionMatch.route.action && !actionMatch.route.lazy) {
                let error = getInternalRouterError(405, {
                    method: request.method,
                    pathname: new URL(request.url).pathname,
                    routeId: actionMatch.route.id,
                });
                if (isRouteRequest) {
                    throw error;
                }
                result = {
                    type: ResultType.error,
                    error,
                };
            }
            else {
                let results = await callDataStrategy("action", request, [actionMatch], matches, isRouteRequest, requestContext, dataStrategy);
                result = results[actionMatch.route.id];
                if (request.signal.aborted) {
                    throwStaticHandlerAbortedError(request, isRouteRequest);
                }
            }
            if (isRedirectResult(result)) {
                // Uhhhh - this should never happen, we should always throw these from
                // callLoaderOrAction, but the type narrowing here keeps TS happy and we
                // can get back on the "throw all redirect responses" train here should
                // this ever happen :/
                throw new Response(null, {
                    status: result.response.status,
                    headers: {
                        Location: result.response.headers.get("Location"),
                    },
                });
            }
            if (isRouteRequest) {
                // Note: This should only be non-Response values if we get here, since
                // isRouteRequest should throw any Response received in callLoaderOrAction
                if (isErrorResult(result)) {
                    throw result.error;
                }
                return {
                    matches: [actionMatch],
                    loaderData: {},
                    actionData: { [actionMatch.route.id]: result.data },
                    errors: null,
                    // Note: statusCode + headers are unused here since queryRoute will
                    // return the raw Response or value
                    statusCode: 200,
                    loaderHeaders: {},
                    actionHeaders: {},
                };
            }
            if (skipRevalidation) {
                if (isErrorResult(result)) {
                    let boundaryMatch = skipLoaderErrorBubbling
                        ? actionMatch
                        : findNearestBoundary(matches, actionMatch.route.id);
                    return {
                        statusCode: isRouteErrorResponse(result.error)
                            ? result.error.status
                            : result.statusCode != null
                                ? result.statusCode
                                : 500,
                        actionData: null,
                        actionHeaders: {
                            ...(result.headers
                                ? { [actionMatch.route.id]: result.headers }
                                : {}),
                        },
                        matches,
                        loaderData: {},
                        errors: {
                            [boundaryMatch.route.id]: result.error,
                        },
                        loaderHeaders: {},
                    };
                }
                else {
                    return {
                        actionData: {
                            [actionMatch.route.id]: result.data,
                        },
                        actionHeaders: result.headers
                            ? { [actionMatch.route.id]: result.headers }
                            : {},
                        matches,
                        loaderData: {},
                        errors: null,
                        statusCode: result.statusCode || 200,
                        loaderHeaders: {},
                    };
                }
            }
            // Create a GET request for the loaders
            let loaderRequest = new Request(request.url, {
                headers: request.headers,
                redirect: request.redirect,
                signal: request.signal,
            });
            if (isErrorResult(result)) {
                // Store off the pending error - we use it to determine which loaders
                // to call and will commit it when we complete the navigation
                let boundaryMatch = skipLoaderErrorBubbling
                    ? actionMatch
                    : findNearestBoundary(matches, actionMatch.route.id);
                let handlerContext = await loadRouteData(loaderRequest, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, null, filterMatchesToLoad, [boundaryMatch.route.id, result]);
                // action status codes take precedence over loader status codes
                return {
                    ...handlerContext,
                    statusCode: isRouteErrorResponse(result.error)
                        ? result.error.status
                        : result.statusCode != null
                            ? result.statusCode
                            : 500,
                    actionData: null,
                    actionHeaders: {
                        ...(result.headers ? { [actionMatch.route.id]: result.headers } : {}),
                    },
                };
            }
            let handlerContext = await loadRouteData(loaderRequest, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, null, filterMatchesToLoad);
            return {
                ...handlerContext,
                actionData: {
                    [actionMatch.route.id]: result.data,
                },
                // action status codes take precedence over loader status codes
                ...(result.statusCode ? { statusCode: result.statusCode } : {}),
                actionHeaders: result.headers
                    ? { [actionMatch.route.id]: result.headers }
                    : {},
            };
        }
        async function loadRouteData(request, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch, filterMatchesToLoad, pendingActionResult) {
            let isRouteRequest = routeMatch != null;
            // Short circuit if we have no loaders to run (queryRoute())
            if (isRouteRequest &&
                !routeMatch?.route.loader &&
                !routeMatch?.route.lazy) {
                throw getInternalRouterError(400, {
                    method: request.method,
                    pathname: new URL(request.url).pathname,
                    routeId: routeMatch?.route.id,
                });
            }
            let requestMatches = routeMatch
                ? [routeMatch]
                : pendingActionResult && isErrorResult(pendingActionResult[1])
                    ? getLoaderMatchesUntilBoundary(matches, pendingActionResult[0])
                    : matches;
            let matchesToLoad = requestMatches.filter((m) => (m.route.loader || m.route.lazy) &&
                (!filterMatchesToLoad || filterMatchesToLoad(m)));
            // Short circuit if we have no loaders to run (query())
            if (matchesToLoad.length === 0) {
                return {
                    matches,
                    // Add a null for all matched routes for proper revalidation on the client
                    loaderData: matches.reduce((acc, m) => Object.assign(acc, { [m.route.id]: null }), {}),
                    errors: pendingActionResult && isErrorResult(pendingActionResult[1])
                        ? {
                            [pendingActionResult[0]]: pendingActionResult[1].error,
                        }
                        : null,
                    statusCode: 200,
                    loaderHeaders: {},
                };
            }
            let results = await callDataStrategy("loader", request, matchesToLoad, matches, isRouteRequest, requestContext, dataStrategy);
            if (request.signal.aborted) {
                throwStaticHandlerAbortedError(request, isRouteRequest);
            }
            // Process and commit output from loaders
            let handlerContext = processRouteLoaderData(matches, results, pendingActionResult, true, skipLoaderErrorBubbling);
            // Add a null for any non-loader matches for proper revalidation on the client
            let executedLoaders = new Set(matchesToLoad.map((match) => match.route.id));
            matches.forEach((match) => {
                if (!executedLoaders.has(match.route.id)) {
                    handlerContext.loaderData[match.route.id] = null;
                }
            });
            return {
                ...handlerContext,
                matches,
            };
        }
        // Utility wrapper for calling dataStrategy server-side without having to
        // pass around the manifest, mapRouteProperties, etc.
        async function callDataStrategy(type, request, matchesToLoad, matches, isRouteRequest, requestContext, dataStrategy) {
            let results = await callDataStrategyImpl(dataStrategy || defaultDataStrategy, type, request, matchesToLoad, matches, null, manifest, mapRouteProperties, requestContext);
            let dataResults = {};
            await Promise.all(matches.map(async (match) => {
                if (!(match.route.id in results)) {
                    return;
                }
                let result = results[match.route.id];
                if (isRedirectDataStrategyResult(result)) {
                    let response = result.result;
                    // Throw redirects and let the server handle them with an HTTP redirect
                    throw normalizeRelativeRoutingRedirectResponse(response, request, match.route.id, matches, basename);
                }
                if (isResponse(result.result) && isRouteRequest) {
                    // For SSR single-route requests, we want to hand Responses back
                    // directly without unwrapping
                    throw result;
                }
                dataResults[match.route.id] =
                    await convertDataStrategyResultToDataResult(result);
            }));
            return dataResults;
        }
        return {
            dataRoutes,
            query,
            queryRoute,
        };
    }
    //#endregion
    ////////////////////////////////////////////////////////////////////////////////
    //#region Helpers
    ////////////////////////////////////////////////////////////////////////////////
    /**
     * Given an existing StaticHandlerContext and an error thrown at render time,
     * provide an updated StaticHandlerContext suitable for a second SSR render
     *
     * @category Utils
     */
    function getStaticContextFromError(routes, handlerContext, error, boundaryId) {
        let errorBoundaryId = boundaryId || handlerContext._deepestRenderedBoundaryId || routes[0].id;
        return {
            ...handlerContext,
            statusCode: isRouteErrorResponse(error) ? error.status : 500,
            errors: {
                [errorBoundaryId]: error,
            },
        };
    }
    function throwStaticHandlerAbortedError(request, isRouteRequest) {
        if (request.signal.reason !== undefined) {
            throw request.signal.reason;
        }
        let method = isRouteRequest ? "queryRoute" : "query";
        throw new Error(`${method}() call aborted without an \`AbortSignal.reason\`: ${request.method} ${request.url}`);
    }
    function isSubmissionNavigation(opts) {
        return (opts != null &&
            (("formData" in opts && opts.formData != null) ||
                ("body" in opts && opts.body !== undefined)));
    }
    function normalizeTo(location, matches, basename, to, fromRouteId, relative) {
        let contextualMatches;
        let activeRouteMatch;
        if (fromRouteId) {
            // Grab matches up to the calling route so our route-relative logic is
            // relative to the correct source route
            contextualMatches = [];
            for (let match of matches) {
                contextualMatches.push(match);
                if (match.route.id === fromRouteId) {
                    activeRouteMatch = match;
                    break;
                }
            }
        }
        else {
            contextualMatches = matches;
            activeRouteMatch = matches[matches.length - 1];
        }
        // Resolve the relative path
        let path = resolveTo(to ? to : ".", getResolveToMatches(contextualMatches), stripBasename(location.pathname, basename) || location.pathname, relative === "path");
        // When `to` is not specified we inherit search/hash from the current
        // location, unlike when to="." and we just inherit the path.
        // See https://github.com/remix-run/remix/issues/927
        if (to == null) {
            path.search = location.search;
            path.hash = location.hash;
        }
        // Account for `?index` params when routing to the current location
        if ((to == null || to === "" || to === ".") && activeRouteMatch) {
            let nakedIndex = hasNakedIndexQuery(path.search);
            if (activeRouteMatch.route.index && !nakedIndex) {
                // Add one when we're targeting an index route
                path.search = path.search
                    ? path.search.replace(/^\?/, "?index&")
                    : "?index";
            }
            else if (!activeRouteMatch.route.index && nakedIndex) {
                // Remove existing ones when we're not
                let params = new URLSearchParams(path.search);
                let indexValues = params.getAll("index");
                params.delete("index");
                indexValues.filter((v) => v).forEach((v) => params.append("index", v));
                let qs = params.toString();
                path.search = qs ? `?${qs}` : "";
            }
        }
        // If we're operating within a basename, prepend it to the pathname.  If
        // this is a root navigation, then just use the raw basename which allows
        // the basename to have full control over the presence of a trailing slash
        // on root actions
        if (basename !== "/") {
            path.pathname =
                path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
        }
        return createPath(path);
    }
    // Normalize navigation options by converting formMethod=GET formData objects to
    // URLSearchParams so they behave identically to links with query params
    function normalizeNavigateOptions(isFetcher, path, opts) {
        // Return location verbatim on non-submission navigations
        if (!opts || !isSubmissionNavigation(opts)) {
            return { path };
        }
        if (opts.formMethod && !isValidMethod(opts.formMethod)) {
            return {
                path,
                error: getInternalRouterError(405, { method: opts.formMethod }),
            };
        }
        let getInvalidBodyError = () => ({
            path,
            error: getInternalRouterError(400, { type: "invalid-body" }),
        });
        // Create a Submission on non-GET navigations
        let rawFormMethod = opts.formMethod || "get";
        let formMethod = rawFormMethod.toUpperCase();
        let formAction = stripHashFromPath(path);
        if (opts.body !== undefined) {
            if (opts.formEncType === "text/plain") {
                // text only support POST/PUT/PATCH/DELETE submissions
                if (!isMutationMethod(formMethod)) {
                    return getInvalidBodyError();
                }
                let text = typeof opts.body === "string"
                    ? opts.body
                    : opts.body instanceof FormData ||
                        opts.body instanceof URLSearchParams
                        ? // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#plain-text-form-data
                            Array.from(opts.body.entries()).reduce((acc, [name, value]) => `${acc}${name}=${value}\n`, "")
                        : String(opts.body);
                return {
                    path,
                    submission: {
                        formMethod,
                        formAction,
                        formEncType: opts.formEncType,
                        formData: undefined,
                        json: undefined,
                        text,
                    },
                };
            }
            else if (opts.formEncType === "application/json") {
                // json only supports POST/PUT/PATCH/DELETE submissions
                if (!isMutationMethod(formMethod)) {
                    return getInvalidBodyError();
                }
                try {
                    let json = typeof opts.body === "string" ? JSON.parse(opts.body) : opts.body;
                    return {
                        path,
                        submission: {
                            formMethod,
                            formAction,
                            formEncType: opts.formEncType,
                            formData: undefined,
                            json,
                            text: undefined,
                        },
                    };
                }
                catch (e) {
                    return getInvalidBodyError();
                }
            }
        }
        invariant$2(typeof FormData === "function", "FormData is not available in this environment");
        let searchParams;
        let formData;
        if (opts.formData) {
            searchParams = convertFormDataToSearchParams(opts.formData);
            formData = opts.formData;
        }
        else if (opts.body instanceof FormData) {
            searchParams = convertFormDataToSearchParams(opts.body);
            formData = opts.body;
        }
        else if (opts.body instanceof URLSearchParams) {
            searchParams = opts.body;
            formData = convertSearchParamsToFormData(searchParams);
        }
        else if (opts.body == null) {
            searchParams = new URLSearchParams();
            formData = new FormData();
        }
        else {
            try {
                searchParams = new URLSearchParams(opts.body);
                formData = convertSearchParamsToFormData(searchParams);
            }
            catch (e) {
                return getInvalidBodyError();
            }
        }
        let submission = {
            formMethod,
            formAction,
            formEncType: (opts && opts.formEncType) || "application/x-www-form-urlencoded",
            formData,
            json: undefined,
            text: undefined,
        };
        if (isMutationMethod(submission.formMethod)) {
            return { path, submission };
        }
        // Flatten submission onto URLSearchParams for GET submissions
        let parsedPath = parsePath(path);
        // On GET navigation submissions we can drop the ?index param from the
        // resulting location since all loaders will run.  But fetcher GET submissions
        // only run a single loader so we need to preserve any incoming ?index params
        if (isFetcher && parsedPath.search && hasNakedIndexQuery(parsedPath.search)) {
            searchParams.append("index", "");
        }
        parsedPath.search = `?${searchParams}`;
        return { path: createPath(parsedPath), submission };
    }
    // Filter out all routes at/below any caught error as they aren't going to
    // render so we don't need to load them
    function getLoaderMatchesUntilBoundary(matches, boundaryId, includeBoundary = false) {
        let index = matches.findIndex((m) => m.route.id === boundaryId);
        if (index >= 0) {
            return matches.slice(0, includeBoundary ? index + 1 : index);
        }
        return matches;
    }
    function getMatchesToLoad(history, state, matches, submission, location, initialHydration, isRevalidationRequired, cancelledFetcherLoads, fetchersQueuedForDeletion, fetchLoadMatches, fetchRedirectIds, routesToUse, basename, pendingActionResult) {
        let actionResult = pendingActionResult
            ? isErrorResult(pendingActionResult[1])
                ? pendingActionResult[1].error
                : pendingActionResult[1].data
            : undefined;
        let currentUrl = history.createURL(state.location);
        let nextUrl = history.createURL(location);
        // Pick navigation matches that are net-new or qualify for revalidation
        let boundaryMatches = matches;
        if (initialHydration && state.errors) {
            // On initial hydration, only consider matches up to _and including_ the boundary.
            // This is inclusive to handle cases where a server loader ran successfully,
            // a child server loader bubbled up to this route, but this route has
            // `clientLoader.hydrate` so we want to still run the `clientLoader` so that
            // we have a complete version of `loaderData`
            boundaryMatches = getLoaderMatchesUntilBoundary(matches, Object.keys(state.errors)[0], true);
        }
        else if (pendingActionResult && isErrorResult(pendingActionResult[1])) {
            // If an action threw an error, we call loaders up to, but not including the
            // boundary
            boundaryMatches = getLoaderMatchesUntilBoundary(matches, pendingActionResult[0]);
        }
        // Don't revalidate loaders by default after action 4xx/5xx responses
        // when the flag is enabled.  They can still opt-into revalidation via
        // `shouldRevalidate` via `actionResult`
        let actionStatus = pendingActionResult
            ? pendingActionResult[1].statusCode
            : undefined;
        let shouldSkipRevalidation = actionStatus && actionStatus >= 400;
        let navigationMatches = boundaryMatches.filter((match, index) => {
            let { route } = match;
            if (route.lazy) {
                // We haven't loaded this route yet so we don't know if it's got a loader!
                return true;
            }
            if (route.loader == null) {
                return false;
            }
            if (initialHydration) {
                return shouldLoadRouteOnHydration(route, state.loaderData, state.errors);
            }
            // Always call the loader on new route instances
            if (isNewLoader(state.loaderData, state.matches[index], match)) {
                return true;
            }
            // This is the default implementation for when we revalidate.  If the route
            // provides it's own implementation, then we give them full control but
            // provide this value so they can leverage it if needed after they check
            // their own specific use cases
            let currentRouteMatch = state.matches[index];
            let nextRouteMatch = match;
            return shouldRevalidateLoader(match, {
                currentUrl,
                currentParams: currentRouteMatch.params,
                nextUrl,
                nextParams: nextRouteMatch.params,
                ...submission,
                actionResult,
                actionStatus,
                defaultShouldRevalidate: shouldSkipRevalidation
                    ? false
                    : // Forced revalidation due to submission, useRevalidator, or X-Remix-Revalidate
                        isRevalidationRequired ||
                            currentUrl.pathname + currentUrl.search ===
                                nextUrl.pathname + nextUrl.search ||
                            // Search params affect all loaders
                            currentUrl.search !== nextUrl.search ||
                            isNewRouteInstance(currentRouteMatch, nextRouteMatch),
            });
        });
        // Pick fetcher.loads that need to be revalidated
        let revalidatingFetchers = [];
        fetchLoadMatches.forEach((f, key) => {
            // Don't revalidate:
            //  - on initial hydration (shouldn't be any fetchers then anyway)
            //  - if fetcher won't be present in the subsequent render
            //    - no longer matches the URL (v7_fetcherPersist=false)
            //    - was unmounted but persisted due to v7_fetcherPersist=true
            if (initialHydration ||
                !matches.some((m) => m.route.id === f.routeId) ||
                fetchersQueuedForDeletion.has(key)) {
                return;
            }
            let fetcherMatches = matchRoutes(routesToUse, f.path, basename);
            // If the fetcher path no longer matches, push it in with null matches so
            // we can trigger a 404 in callLoadersAndMaybeResolveData.  Note this is
            // currently only a use-case for Remix HMR where the route tree can change
            // at runtime and remove a route previously loaded via a fetcher
            if (!fetcherMatches) {
                revalidatingFetchers.push({
                    key,
                    routeId: f.routeId,
                    path: f.path,
                    matches: null,
                    match: null,
                    controller: null,
                });
                return;
            }
            // Revalidating fetchers are decoupled from the route matches since they
            // load from a static href.  They revalidate based on explicit revalidation
            // (submission, useRevalidator, or X-Remix-Revalidate)
            let fetcher = state.fetchers.get(key);
            let fetcherMatch = getTargetMatch(fetcherMatches, f.path);
            let shouldRevalidate = false;
            if (fetchRedirectIds.has(key)) {
                // Never trigger a revalidation of an actively redirecting fetcher
                shouldRevalidate = false;
            }
            else if (cancelledFetcherLoads.has(key)) {
                // Always mark for revalidation if the fetcher was cancelled
                cancelledFetcherLoads.delete(key);
                shouldRevalidate = true;
            }
            else if (fetcher &&
                fetcher.state !== "idle" &&
                fetcher.data === undefined) {
                // If the fetcher hasn't ever completed loading yet, then this isn't a
                // revalidation, it would just be a brand new load if an explicit
                // revalidation is required
                shouldRevalidate = isRevalidationRequired;
            }
            else {
                // Otherwise fall back on any user-defined shouldRevalidate, defaulting
                // to explicit revalidations only
                shouldRevalidate = shouldRevalidateLoader(fetcherMatch, {
                    currentUrl,
                    currentParams: state.matches[state.matches.length - 1].params,
                    nextUrl,
                    nextParams: matches[matches.length - 1].params,
                    ...submission,
                    actionResult,
                    actionStatus,
                    defaultShouldRevalidate: shouldSkipRevalidation
                        ? false
                        : isRevalidationRequired,
                });
            }
            if (shouldRevalidate) {
                revalidatingFetchers.push({
                    key,
                    routeId: f.routeId,
                    path: f.path,
                    matches: fetcherMatches,
                    match: fetcherMatch,
                    controller: new AbortController(),
                });
            }
        });
        return [navigationMatches, revalidatingFetchers];
    }
    function shouldLoadRouteOnHydration(route, loaderData, errors) {
        // We dunno if we have a loader - gotta find out!
        if (route.lazy) {
            return true;
        }
        // No loader, nothing to initialize
        if (!route.loader) {
            return false;
        }
        let hasData = loaderData != null && loaderData[route.id] !== undefined;
        let hasError = errors != null && errors[route.id] !== undefined;
        // Don't run if we error'd during SSR
        if (!hasData && hasError) {
            return false;
        }
        // Explicitly opting-in to running on hydration
        if (typeof route.loader === "function" && route.loader.hydrate === true) {
            return true;
        }
        // Otherwise, run if we're not yet initialized with anything
        return !hasData && !hasError;
    }
    function isNewLoader(currentLoaderData, currentMatch, match) {
        let isNew = 
        // [a] -> [a, b]
        !currentMatch ||
            // [a, b] -> [a, c]
            match.route.id !== currentMatch.route.id;
        // Handle the case that we don't have data for a re-used route, potentially
        // from a prior error
        let isMissingData = !currentLoaderData.hasOwnProperty(match.route.id);
        // Always load if this is a net-new route or we don't yet have data
        return isNew || isMissingData;
    }
    function isNewRouteInstance(currentMatch, match) {
        let currentPath = currentMatch.route.path;
        return (
        // param change for this match, /users/123 -> /users/456
        currentMatch.pathname !== match.pathname ||
            // splat param changed, which is not present in match.path
            // e.g. /files/images/avatar.jpg -> files/finances.xls
            (currentPath != null &&
                currentPath.endsWith("*") &&
                currentMatch.params["*"] !== match.params["*"]));
    }
    function shouldRevalidateLoader(loaderMatch, arg) {
        if (loaderMatch.route.shouldRevalidate) {
            let routeChoice = loaderMatch.route.shouldRevalidate(arg);
            if (typeof routeChoice === "boolean") {
                return routeChoice;
            }
        }
        return arg.defaultShouldRevalidate;
    }
    function patchRoutesImpl(routeId, children, routesToUse, manifest, mapRouteProperties) {
        let childrenToPatch;
        if (routeId) {
            let route = manifest[routeId];
            invariant$2(route, `No route found to patch children into: routeId = ${routeId}`);
            if (!route.children) {
                route.children = [];
            }
            childrenToPatch = route.children;
        }
        else {
            childrenToPatch = routesToUse;
        }
        // Don't patch in routes we already know about so that `patch` is idempotent
        // to simplify user-land code. This is useful because we re-call the
        // `patchRoutesOnNavigation` function for matched routes with params.
        let uniqueChildren = children.filter((newRoute) => !childrenToPatch.some((existingRoute) => isSameRoute(newRoute, existingRoute)));
        let newRoutes = convertRoutesToDataRoutes(uniqueChildren, mapRouteProperties, [routeId || "_", "patch", String(childrenToPatch?.length || "0")], manifest);
        childrenToPatch.push(...newRoutes);
    }
    function isSameRoute(newRoute, existingRoute) {
        // Most optimal check is by id
        if ("id" in newRoute &&
            "id" in existingRoute &&
            newRoute.id === existingRoute.id) {
            return true;
        }
        // Second is by pathing differences
        if (!(newRoute.index === existingRoute.index &&
            newRoute.path === existingRoute.path &&
            newRoute.caseSensitive === existingRoute.caseSensitive)) {
            return false;
        }
        // Pathless layout routes are trickier since we need to check children.
        // If they have no children then they're the same as far as we can tell
        if ((!newRoute.children || newRoute.children.length === 0) &&
            (!existingRoute.children || existingRoute.children.length === 0)) {
            return true;
        }
        // Otherwise, we look to see if every child in the new route is already
        // represented in the existing route's children
        return newRoute.children.every((aChild, i) => existingRoute.children?.some((bChild) => isSameRoute(aChild, bChild)));
    }
    const lazyRoutePropertyCache = new WeakMap();
    const loadLazyRouteProperty = ({ key, route, manifest, mapRouteProperties, }) => {
        let routeToUpdate = manifest[route.id];
        invariant$2(routeToUpdate, "No route found in manifest");
        if (!routeToUpdate.lazy || typeof routeToUpdate.lazy !== "object") {
            return;
        }
        let lazyFn = routeToUpdate.lazy[key];
        if (!lazyFn) {
            return;
        }
        let cache = lazyRoutePropertyCache.get(routeToUpdate);
        if (!cache) {
            cache = {};
            lazyRoutePropertyCache.set(routeToUpdate, cache);
        }
        let cachedPromise = cache[key];
        if (cachedPromise) {
            return cachedPromise;
        }
        let propertyPromise = (async () => {
            let isUnsupported = isUnsupportedLazyRouteObjectKey(key);
            let staticRouteValue = routeToUpdate[key];
            let isStaticallyDefined = staticRouteValue !== undefined && key !== "hasErrorBoundary";
            if (isUnsupported) {
                warning(!isUnsupported, "Route property " +
                    key +
                    " is not a supported lazy route property. This property will be ignored.");
                cache[key] = Promise.resolve();
            }
            else if (isStaticallyDefined) {
                warning(false, `Route "${routeToUpdate.id}" has a static property "${key}" ` +
                    `defined. The lazy property will be ignored.`);
            }
            else {
                let value = await lazyFn();
                if (value != null) {
                    Object.assign(routeToUpdate, { [key]: value });
                    Object.assign(routeToUpdate, mapRouteProperties(routeToUpdate));
                }
            }
            // Clean up lazy property and clean up lazy object if it's now empty
            if (typeof routeToUpdate.lazy === "object") {
                routeToUpdate.lazy[key] = undefined;
                if (Object.values(routeToUpdate.lazy).every((value) => value === undefined)) {
                    routeToUpdate.lazy = undefined;
                }
            }
        })();
        cache[key] = propertyPromise;
        return propertyPromise;
    };
    const lazyRouteFunctionCache = new WeakMap();
    /**
     * Execute route.lazy functions to lazily load route modules (loader, action,
     * shouldRevalidate) and update the routeManifest in place which shares objects
     * with dataRoutes so those get updated as well.
     */
    function loadLazyRoute(route, type, manifest, mapRouteProperties) {
        let routeToUpdate = manifest[route.id];
        invariant$2(routeToUpdate, "No route found in manifest");
        if (!route.lazy) {
            return {
                lazyRoutePromise: undefined,
                lazyHandlerPromise: undefined,
            };
        }
        if (typeof route.lazy === "function") {
            // Check if we have a cached promise from a previous call
            let cachedPromise = lazyRouteFunctionCache.get(routeToUpdate);
            if (cachedPromise) {
                return {
                    lazyRoutePromise: cachedPromise,
                    lazyHandlerPromise: cachedPromise,
                };
            }
            // We use `.then` to chain additional logic to the lazy route promise so that
            // the consumer's lazy route logic is coupled to our logic for updating the
            // route in place in a single task. This ensures that the cached promise
            // contains all logic for managing the lazy route. This chained promise is
            // then awaited so that consumers of this function see the updated route.
            let lazyRoutePromise = (async () => {
                invariant$2(typeof route.lazy === "function", "No lazy route function found");
                let lazyRoute = await route.lazy();
                // Here we update the route in place.  This should be safe because there's
                // no way we could yet be sitting on this route as we can't get there
                // without resolving lazy() first.
                //
                // This is different than the HMR "update" use-case where we may actively be
                // on the route being updated.  The main concern boils down to "does this
                // mutation affect any ongoing navigations or any current state.matches
                // values?".  If not, it should be safe to update in place.
                let routeUpdates = {};
                for (let lazyRouteProperty in lazyRoute) {
                    let lazyValue = lazyRoute[lazyRouteProperty];
                    if (lazyValue === undefined) {
                        continue;
                    }
                    let isUnsupported = isUnsupportedLazyRouteFunctionKey(lazyRouteProperty);
                    let staticRouteValue = routeToUpdate[lazyRouteProperty];
                    let isStaticallyDefined = staticRouteValue !== undefined &&
                        // This property isn't static since it should always be updated based
                        // on the route updates
                        lazyRouteProperty !== "hasErrorBoundary";
                    if (isUnsupported) {
                        warning(!isUnsupported, "Route property " +
                            lazyRouteProperty +
                            " is not a supported property to be returned from a lazy route function. This property will be ignored.");
                    }
                    else if (isStaticallyDefined) {
                        warning(!isStaticallyDefined, `Route "${routeToUpdate.id}" has a static property "${lazyRouteProperty}" ` +
                            `defined but its lazy function is also returning a value for this property. ` +
                            `The lazy route property "${lazyRouteProperty}" will be ignored.`);
                    }
                    else {
                        routeUpdates[lazyRouteProperty] = lazyValue;
                    }
                }
                // Mutate the route with the provided updates.  Do this first so we pass
                // the updated version to mapRouteProperties
                Object.assign(routeToUpdate, routeUpdates);
                // Mutate the `hasErrorBoundary` property on the route based on the route
                // updates and remove the `lazy` function so we don't resolve the lazy
                // route again.
                Object.assign(routeToUpdate, {
                    // To keep things framework agnostic, we use the provided `mapRouteProperties`
                    // function to set the framework-aware properties (`element`/`hasErrorBoundary`)
                    // since the logic will differ between frameworks.
                    ...mapRouteProperties(routeToUpdate),
                    lazy: undefined,
                });
            })();
            lazyRouteFunctionCache.set(routeToUpdate, lazyRoutePromise);
            return {
                lazyRoutePromise,
                lazyHandlerPromise: lazyRoutePromise,
            };
        }
        let lazyKeys = Object.keys(route.lazy);
        let lazyPropertyPromises = [];
        let lazyHandlerPromise = undefined;
        for (let key of lazyKeys) {
            let promise = loadLazyRouteProperty({
                key,
                route,
                manifest,
                mapRouteProperties,
            });
            if (promise) {
                lazyPropertyPromises.push(promise);
                if (key === type) {
                    lazyHandlerPromise = promise;
                }
            }
        }
        let lazyRoutePromise = Promise.all(lazyPropertyPromises)
            // Ensure type is Promise<void>, not Promise<void[]>
            .then(() => { });
        return {
            lazyRoutePromise,
            lazyHandlerPromise,
        };
    }
    function isNonNullable(value) {
        return value !== undefined;
    }
    function loadLazyMiddlewareForMatches(matches, manifest, mapRouteProperties) {
        let promises = matches
            .map(({ route }) => {
            if (typeof route.lazy !== "object" || !route.lazy.unstable_middleware) {
                return undefined;
            }
            return loadLazyRouteProperty({
                key: "unstable_middleware",
                route,
                manifest,
                mapRouteProperties,
            });
        })
            .filter(isNonNullable);
        return promises.length > 0 ? Promise.all(promises) : undefined;
    }
    // Default implementation of `dataStrategy` which fetches all loaders in parallel
    async function defaultDataStrategy(args) {
        let matchesToLoad = args.matches.filter((m) => m.shouldLoad);
        let keyedResults = {};
        let results = await Promise.all(matchesToLoad.map((m) => m.resolve()));
        results.forEach((result, i) => {
            keyedResults[matchesToLoad[i].route.id] = result;
        });
        return keyedResults;
    }
    // Middleware-enabled implementation of `dataStrategy` which calls middleware
    // and fetches all loaders in parallel
    async function defaultDataStrategyWithMiddleware(args) {
        // Short circuit all the middleware logic if we have no middlewares
        if (!args.matches.some((m) => m.route.unstable_middleware)) {
            return defaultDataStrategy(args);
        }
        return runMiddlewarePipeline(args, false, () => defaultDataStrategy(args), (error, routeId) => ({ [routeId]: { type: "error", result: error } }));
    }
    async function runMiddlewarePipeline(args, propagateResult, handler, errorHandler) {
        let { matches, request, params, context } = args;
        let middlewareState = {
            handlerResult: undefined,
        };
        try {
            let tuples = matches.flatMap((m) => m.route.unstable_middleware
                ? m.route.unstable_middleware.map((fn) => [m.route.id, fn])
                : []);
            let result = await callRouteMiddleware({ request, params, context }, tuples, propagateResult, middlewareState, handler);
            return propagateResult ? result : middlewareState.handlerResult;
        }
        catch (e) {
            if (!middlewareState.middlewareError) {
                // This shouldn't happen?  This would have to come from a bug in our
                // library code...
                throw e;
            }
            let result = await errorHandler(middlewareState.middlewareError.error, middlewareState.middlewareError.routeId);
            if (propagateResult || !middlewareState.handlerResult) {
                return result;
            }
            return Object.assign(middlewareState.handlerResult, result);
        }
    }
    async function callRouteMiddleware(args, middlewares, propagateResult, middlewareState, handler, idx = 0) {
        let { request } = args;
        if (request.signal.aborted) {
            if (request.signal.reason) {
                throw request.signal.reason;
            }
            throw new Error(`Request aborted without an \`AbortSignal.reason\`: ${request.method} ${request.url}`);
        }
        let tuple = middlewares[idx];
        if (!tuple) {
            // We reached the end of our middlewares, call the handler
            middlewareState.handlerResult = await handler();
            return middlewareState.handlerResult;
        }
        let [routeId, middleware] = tuple;
        let nextCalled = false;
        let nextResult = undefined;
        let next = async () => {
            if (nextCalled) {
                throw new Error("You may only call `next()` once per middleware");
            }
            nextCalled = true;
            let result = await callRouteMiddleware(args, middlewares, propagateResult, middlewareState, handler, idx + 1);
            if (propagateResult) {
                nextResult = result;
                return nextResult;
            }
        };
        try {
            let result = await middleware({
                request: args.request,
                params: args.params,
                context: args.context,
            }, next);
            if (nextCalled) {
                if (result === undefined) {
                    // If they called next() but didn't return the response, we can bubble
                    // it for them. This lets folks do things like grab the response and
                    // add a header without then re-returning it
                    return nextResult;
                }
                else {
                    return result;
                }
            }
            else {
                return next();
            }
        }
        catch (error) {
            if (!middlewareState.middlewareError) {
                middlewareState.middlewareError = { routeId, error };
            }
            else if (middlewareState.middlewareError.error !== error) {
                // Another middleware already threw, so only capture this new routeId if
                // it's a different error and not just bubbling up the existing error
                middlewareState.middlewareError = { routeId, error };
            }
            throw error;
        }
    }
    async function callDataStrategyImpl(dataStrategyImpl, type, request, matchesToLoad, matches, fetcherKey, manifest, mapRouteProperties, scopedContext) {
        // Ensure all lazy/lazyMiddleware async functions are kicked off in parallel
        // before we await them where needed below
        let loadMiddlewarePromise = loadLazyMiddlewareForMatches(matches, manifest, mapRouteProperties);
        let lazyRoutePromises = matches.map((m) => loadLazyRoute(m.route, type, manifest, mapRouteProperties));
        // Ensure all middleware is loaded before we start executing routes
        if (loadMiddlewarePromise) {
            await loadMiddlewarePromise;
        }
        let dsMatches = matches.map((match, i) => {
            let { lazyRoutePromise, lazyHandlerPromise } = lazyRoutePromises[i];
            let shouldLoad = matchesToLoad.some((m) => m.route.id === match.route.id);
            // `resolve` encapsulates route.lazy(), executing the loader/action,
            // and mapping return values/thrown errors to a `DataStrategyResult`.  Users
            // can pass a callback to take fine-grained control over the execution
            // of the loader/action
            let resolve = async (handlerOverride) => {
                if (handlerOverride &&
                    request.method === "GET" &&
                    (match.route.lazy || match.route.loader)) {
                    shouldLoad = true;
                }
                return shouldLoad
                    ? callLoaderOrAction({
                        type,
                        request,
                        match,
                        lazyHandlerPromise,
                        lazyRoutePromise,
                        handlerOverride,
                        scopedContext,
                    })
                    : Promise.resolve({ type: ResultType.data, result: undefined });
            };
            return {
                ...match,
                shouldLoad,
                resolve,
            };
        });
        // Send all matches here to allow for a middleware-type implementation.
        // handler will be a no-op for unneeded routes and we filter those results
        // back out below.
        let results = await dataStrategyImpl({
            matches: dsMatches,
            request,
            params: matches[0].params,
            fetcherKey,
            context: scopedContext,
        });
        // Wait for all routes to load here but swallow the error since we want
        // it to bubble up from the `await loadRoutePromise` in `callLoaderOrAction` -
        // called from `match.resolve()`. We also ensure that all promises are
        // awaited so that we don't inadvertently leave any hanging promises.
        let allLazyRoutePromises = lazyRoutePromises.flatMap((promiseMap) => Object.values(promiseMap).filter(isNonNullable));
        try {
            await Promise.all(allLazyRoutePromises);
        }
        catch (e) {
            // No-op
        }
        return results;
    }
    // Default logic for calling a loader/action is the user has no specified a dataStrategy
    async function callLoaderOrAction({ type, request, match, lazyHandlerPromise, lazyRoutePromise, handlerOverride, scopedContext, }) {
        let result;
        let onReject;
        let runHandler = (handler) => {
            // Setup a promise we can race against so that abort signals short circuit
            let reject;
            // This will never resolve so safe to type it as Promise<DataStrategyResult> to
            // satisfy the function return value
            let abortPromise = new Promise((_, r) => (reject = r));
            onReject = () => reject();
            request.signal.addEventListener("abort", onReject);
            let actualHandler = (ctx) => {
                if (typeof handler !== "function") {
                    return Promise.reject(new Error(`You cannot call the handler for a route which defines a boolean ` +
                        `"${type}" [routeId: ${match.route.id}]`));
                }
                return handler({
                    request,
                    params: match.params,
                    context: scopedContext,
                }, ...(ctx !== undefined ? [ctx] : []));
            };
            let handlerPromise = (async () => {
                try {
                    let val = await (handlerOverride
                        ? handlerOverride((ctx) => actualHandler(ctx))
                        : actualHandler());
                    return { type: "data", result: val };
                }
                catch (e) {
                    return { type: "error", result: e };
                }
            })();
            return Promise.race([handlerPromise, abortPromise]);
        };
        try {
            let handler = match.route[type];
            // If we have a promise for a lazy route, await that first
            if (lazyHandlerPromise || lazyRoutePromise) {
                if (handler) {
                    // Run statically defined handler in parallel with lazy route loading
                    let handlerError;
                    let [value] = await Promise.all([
                        // If the handler throws, don't let it immediately bubble out,
                        // since we need to let the lazy() execution finish so we know if this
                        // route has a boundary that can handle the error
                        runHandler(handler).catch((e) => {
                            handlerError = e;
                        }),
                        // Ensure all lazy route promises are resolved before continuing
                        lazyHandlerPromise,
                        lazyRoutePromise,
                    ]);
                    if (handlerError !== undefined) {
                        throw handlerError;
                    }
                    result = value;
                }
                else {
                    // Load lazy loader/action before running it
                    await lazyHandlerPromise;
                    handler = match.route[type];
                    if (handler) {
                        // Handler still runs even if we got interrupted to maintain consistency
                        // with un-abortable behavior of handler execution on non-lazy or
                        // previously-lazy-loaded routes. We also ensure all lazy route
                        // promises are resolved before continuing.
                        [result] = await Promise.all([runHandler(handler), lazyRoutePromise]);
                    }
                    else if (type === "action") {
                        let url = new URL(request.url);
                        let pathname = url.pathname + url.search;
                        throw getInternalRouterError(405, {
                            method: request.method,
                            pathname,
                            routeId: match.route.id,
                        });
                    }
                    else {
                        // lazy route has no loader to run.  Short circuit here so we don't
                        // hit the invariant below that errors on returning undefined.
                        return { type: ResultType.data, result: undefined };
                    }
                }
            }
            else if (!handler) {
                let url = new URL(request.url);
                let pathname = url.pathname + url.search;
                throw getInternalRouterError(404, {
                    pathname,
                });
            }
            else {
                result = await runHandler(handler);
            }
        }
        catch (e) {
            // We should already be catching and converting normal handler executions to
            // DataStrategyResults and returning them, so anything that throws here is an
            // unexpected error we still need to wrap
            return { type: ResultType.error, result: e };
        }
        finally {
            if (onReject) {
                request.signal.removeEventListener("abort", onReject);
            }
        }
        return result;
    }
    async function convertDataStrategyResultToDataResult(dataStrategyResult) {
        let { result, type } = dataStrategyResult;
        if (isResponse(result)) {
            let data;
            try {
                let contentType = result.headers.get("Content-Type");
                // Check between word boundaries instead of startsWith() due to the last
                // paragraph of https://httpwg.org/specs/rfc9110.html#field.content-type
                if (contentType && /\bapplication\/json\b/.test(contentType)) {
                    if (result.body == null) {
                        data = null;
                    }
                    else {
                        data = await result.json();
                    }
                }
                else {
                    data = await result.text();
                }
            }
            catch (e) {
                return { type: ResultType.error, error: e };
            }
            if (type === ResultType.error) {
                return {
                    type: ResultType.error,
                    error: new ErrorResponseImpl(result.status, result.statusText, data),
                    statusCode: result.status,
                    headers: result.headers,
                };
            }
            return {
                type: ResultType.data,
                data,
                statusCode: result.status,
                headers: result.headers,
            };
        }
        if (type === ResultType.error) {
            if (isDataWithResponseInit(result)) {
                if (result.data instanceof Error) {
                    return {
                        type: ResultType.error,
                        error: result.data,
                        statusCode: result.init?.status,
                        headers: result.init?.headers
                            ? new Headers(result.init.headers)
                            : undefined,
                    };
                }
                // Convert thrown data() to ErrorResponse instances
                return {
                    type: ResultType.error,
                    error: new ErrorResponseImpl(result.init?.status || 500, undefined, result.data),
                    statusCode: isRouteErrorResponse(result) ? result.status : undefined,
                    headers: result.init?.headers
                        ? new Headers(result.init.headers)
                        : undefined,
                };
            }
            return {
                type: ResultType.error,
                error: result,
                statusCode: isRouteErrorResponse(result) ? result.status : undefined,
            };
        }
        if (isDataWithResponseInit(result)) {
            return {
                type: ResultType.data,
                data: result.data,
                statusCode: result.init?.status,
                headers: result.init?.headers
                    ? new Headers(result.init.headers)
                    : undefined,
            };
        }
        return { type: ResultType.data, data: result };
    }
    // Support relative routing in internal redirects
    function normalizeRelativeRoutingRedirectResponse(response, request, routeId, matches, basename) {
        let location = response.headers.get("Location");
        invariant$2(location, "Redirects returned/thrown from loaders/actions must have a Location header");
        if (!ABSOLUTE_URL_REGEX$2.test(location)) {
            let trimmedMatches = matches.slice(0, matches.findIndex((m) => m.route.id === routeId) + 1);
            location = normalizeTo(new URL(request.url), trimmedMatches, basename, location);
            response.headers.set("Location", location);
        }
        return response;
    }
    function normalizeRedirectLocation(location, currentUrl, basename) {
        if (ABSOLUTE_URL_REGEX$2.test(location)) {
            // Strip off the protocol+origin for same-origin + same-basename absolute redirects
            let normalizedLocation = location;
            let url = normalizedLocation.startsWith("//")
                ? new URL(currentUrl.protocol + normalizedLocation)
                : new URL(normalizedLocation);
            let isSameBasename = stripBasename(url.pathname, basename) != null;
            if (url.origin === currentUrl.origin && isSameBasename) {
                return url.pathname + url.search + url.hash;
            }
        }
        return location;
    }
    // Utility method for creating the Request instances for loaders/actions during
    // client-side navigations and fetches.  During SSR we will always have a
    // Request instance from the static handler (query/queryRoute)
    function createClientSideRequest(history, location, signal, submission) {
        let url = history.createURL(stripHashFromPath(location)).toString();
        let init = { signal };
        if (submission && isMutationMethod(submission.formMethod)) {
            let { formMethod, formEncType } = submission;
            // Didn't think we needed this but it turns out unlike other methods, patch
            // won't be properly normalized to uppercase and results in a 405 error.
            // See: https://fetch.spec.whatwg.org/#concept-method
            init.method = formMethod.toUpperCase();
            if (formEncType === "application/json") {
                init.headers = new Headers({ "Content-Type": formEncType });
                init.body = JSON.stringify(submission.json);
            }
            else if (formEncType === "text/plain") {
                // Content-Type is inferred (https://fetch.spec.whatwg.org/#dom-request)
                init.body = submission.text;
            }
            else if (formEncType === "application/x-www-form-urlencoded" &&
                submission.formData) {
                // Content-Type is inferred (https://fetch.spec.whatwg.org/#dom-request)
                init.body = convertFormDataToSearchParams(submission.formData);
            }
            else {
                // Content-Type is inferred (https://fetch.spec.whatwg.org/#dom-request)
                init.body = submission.formData;
            }
        }
        return new Request(url, init);
    }
    function convertFormDataToSearchParams(formData) {
        let searchParams = new URLSearchParams();
        for (let [key, value] of formData.entries()) {
            // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#converting-an-entry-list-to-a-list-of-name-value-pairs
            searchParams.append(key, typeof value === "string" ? value : value.name);
        }
        return searchParams;
    }
    function convertSearchParamsToFormData(searchParams) {
        let formData = new FormData();
        for (let [key, value] of searchParams.entries()) {
            formData.append(key, value);
        }
        return formData;
    }
    function processRouteLoaderData(matches, results, pendingActionResult, isStaticHandler = false, skipLoaderErrorBubbling = false) {
        // Fill in loaderData/errors from our loaders
        let loaderData = {};
        let errors = null;
        let statusCode;
        let foundError = false;
        let loaderHeaders = {};
        let pendingError = pendingActionResult && isErrorResult(pendingActionResult[1])
            ? pendingActionResult[1].error
            : undefined;
        // Process loader results into state.loaderData/state.errors
        matches.forEach((match) => {
            if (!(match.route.id in results)) {
                return;
            }
            let id = match.route.id;
            let result = results[id];
            invariant$2(!isRedirectResult(result), "Cannot handle redirect results in processLoaderData");
            if (isErrorResult(result)) {
                let error = result.error;
                // If we have a pending action error, we report it at the highest-route
                // that throws a loader error, and then clear it out to indicate that
                // it was consumed
                if (pendingError !== undefined) {
                    error = pendingError;
                    pendingError = undefined;
                }
                errors = errors || {};
                if (skipLoaderErrorBubbling) {
                    errors[id] = error;
                }
                else {
                    // Look upwards from the matched route for the closest ancestor error
                    // boundary, defaulting to the root match.  Prefer higher error values
                    // if lower errors bubble to the same boundary
                    let boundaryMatch = findNearestBoundary(matches, id);
                    if (errors[boundaryMatch.route.id] == null) {
                        errors[boundaryMatch.route.id] = error;
                    }
                }
                // Clear our any prior loaderData for the throwing route
                if (!isStaticHandler) {
                    loaderData[id] = ResetLoaderDataSymbol;
                }
                // Once we find our first (highest) error, we set the status code and
                // prevent deeper status codes from overriding
                if (!foundError) {
                    foundError = true;
                    statusCode = isRouteErrorResponse(result.error)
                        ? result.error.status
                        : 500;
                }
                if (result.headers) {
                    loaderHeaders[id] = result.headers;
                }
            }
            else {
                loaderData[id] = result.data;
                // Error status codes always override success status codes, but if all
                // loaders are successful we take the deepest status code.
                if (result.statusCode && result.statusCode !== 200 && !foundError) {
                    statusCode = result.statusCode;
                }
                if (result.headers) {
                    loaderHeaders[id] = result.headers;
                }
            }
        });
        // If we didn't consume the pending action error (i.e., all loaders
        // resolved), then consume it here.  Also clear out any loaderData for the
        // throwing route
        if (pendingError !== undefined && pendingActionResult) {
            errors = { [pendingActionResult[0]]: pendingError };
            loaderData[pendingActionResult[0]] = undefined;
        }
        return {
            loaderData,
            errors,
            statusCode: statusCode || 200,
            loaderHeaders,
        };
    }
    function processLoaderData(state, matches, results, pendingActionResult, revalidatingFetchers, fetcherResults) {
        let { loaderData, errors } = processRouteLoaderData(matches, results, pendingActionResult);
        // Process results from our revalidating fetchers
        revalidatingFetchers.forEach((rf) => {
            let { key, match, controller } = rf;
            let result = fetcherResults[key];
            invariant$2(result, "Did not find corresponding fetcher result");
            // Process fetcher non-redirect errors
            if (controller && controller.signal.aborted) {
                // Nothing to do for aborted fetchers
                return;
            }
            else if (isErrorResult(result)) {
                let boundaryMatch = findNearestBoundary(state.matches, match?.route.id);
                if (!(errors && errors[boundaryMatch.route.id])) {
                    errors = {
                        ...errors,
                        [boundaryMatch.route.id]: result.error,
                    };
                }
                state.fetchers.delete(key);
            }
            else if (isRedirectResult(result)) {
                // Should never get here, redirects should get processed above, but we
                // keep this to type narrow to a success result in the else
                invariant$2(false, "Unhandled fetcher revalidation redirect");
            }
            else {
                let doneFetcher = getDoneFetcher(result.data);
                state.fetchers.set(key, doneFetcher);
            }
        });
        return { loaderData, errors };
    }
    function mergeLoaderData(loaderData, newLoaderData, matches, errors) {
        // Start with all new entries that are not being reset
        let mergedLoaderData = Object.entries(newLoaderData)
            .filter(([, v]) => v !== ResetLoaderDataSymbol)
            .reduce((merged, [k, v]) => {
            merged[k] = v;
            return merged;
        }, {});
        // Preserve existing `loaderData` for routes not included in `newLoaderData` and
        // where a loader wasn't removed by HMR
        for (let match of matches) {
            let id = match.route.id;
            if (!newLoaderData.hasOwnProperty(id) &&
                loaderData.hasOwnProperty(id) &&
                match.route.loader) {
                mergedLoaderData[id] = loaderData[id];
            }
            if (errors && errors.hasOwnProperty(id)) {
                // Don't keep any loader data below the boundary
                break;
            }
        }
        return mergedLoaderData;
    }
    function getActionDataForCommit(pendingActionResult) {
        if (!pendingActionResult) {
            return {};
        }
        return isErrorResult(pendingActionResult[1])
            ? {
                // Clear out prior actionData on errors
                actionData: {},
            }
            : {
                actionData: {
                    [pendingActionResult[0]]: pendingActionResult[1].data,
                },
            };
    }
    // Find the nearest error boundary, looking upwards from the leaf route (or the
    // route specified by routeId) for the closest ancestor error boundary,
    // defaulting to the root match
    function findNearestBoundary(matches, routeId) {
        let eligibleMatches = routeId
            ? matches.slice(0, matches.findIndex((m) => m.route.id === routeId) + 1)
            : [...matches];
        return (eligibleMatches.reverse().find((m) => m.route.hasErrorBoundary === true) ||
            matches[0]);
    }
    function getShortCircuitMatches(routes) {
        // Prefer a root layout route if present, otherwise shim in a route object
        let route = routes.length === 1
            ? routes[0]
            : routes.find((r) => r.index || !r.path || r.path === "/") || {
                id: `__shim-error-route__`,
            };
        return {
            matches: [
                {
                    params: {},
                    pathname: "",
                    pathnameBase: "",
                    route,
                },
            ],
            route,
        };
    }
    function getInternalRouterError(status, { pathname, routeId, method, type, message, } = {}) {
        let statusText = "Unknown Server Error";
        let errorMessage = "Unknown @remix-run/router error";
        if (status === 400) {
            statusText = "Bad Request";
            if (method && pathname && routeId) {
                errorMessage =
                    `You made a ${method} request to "${pathname}" but ` +
                        `did not provide a \`loader\` for route "${routeId}", ` +
                        `so there is no way to handle the request.`;
            }
            else if (type === "invalid-body") {
                errorMessage = "Unable to encode submission body";
            }
        }
        else if (status === 403) {
            statusText = "Forbidden";
            errorMessage = `Route "${routeId}" does not match URL "${pathname}"`;
        }
        else if (status === 404) {
            statusText = "Not Found";
            errorMessage = `No route matches URL "${pathname}"`;
        }
        else if (status === 405) {
            statusText = "Method Not Allowed";
            if (method && pathname && routeId) {
                errorMessage =
                    `You made a ${method.toUpperCase()} request to "${pathname}" but ` +
                        `did not provide an \`action\` for route "${routeId}", ` +
                        `so there is no way to handle the request.`;
            }
            else if (method) {
                errorMessage = `Invalid request method "${method.toUpperCase()}"`;
            }
        }
        return new ErrorResponseImpl(status || 500, statusText, new Error(errorMessage), true);
    }
    // Find any returned redirect errors, starting from the lowest match
    function findRedirect(results) {
        let entries = Object.entries(results);
        for (let i = entries.length - 1; i >= 0; i--) {
            let [key, result] = entries[i];
            if (isRedirectResult(result)) {
                return { key, result };
            }
        }
    }
    function stripHashFromPath(path) {
        let parsedPath = typeof path === "string" ? parsePath(path) : path;
        return createPath({ ...parsedPath, hash: "" });
    }
    function isHashChangeOnly(a, b) {
        if (a.pathname !== b.pathname || a.search !== b.search) {
            return false;
        }
        if (a.hash === "") {
            // /page -> /page#hash
            return b.hash !== "";
        }
        else if (a.hash === b.hash) {
            // /page#hash -> /page#hash
            return true;
        }
        else if (b.hash !== "") {
            // /page#hash -> /page#other
            return true;
        }
        // If the hash is removed the browser will re-perform a request to the server
        // /page#hash -> /page
        return false;
    }
    function isDataStrategyResult(result) {
        return (result != null &&
            typeof result === "object" &&
            "type" in result &&
            "result" in result &&
            (result.type === ResultType.data || result.type === ResultType.error));
    }
    function isRedirectDataStrategyResult(result) {
        return (isResponse(result.result) && redirectStatusCodes.has(result.result.status));
    }
    function isErrorResult(result) {
        return result.type === ResultType.error;
    }
    function isRedirectResult(result) {
        return (result && result.type) === ResultType.redirect;
    }
    function isDataWithResponseInit(value) {
        return (typeof value === "object" &&
            value != null &&
            "type" in value &&
            "data" in value &&
            "init" in value &&
            value.type === "DataWithResponseInit");
    }
    function isResponse(value) {
        return (value != null &&
            typeof value.status === "number" &&
            typeof value.statusText === "string" &&
            typeof value.headers === "object" &&
            typeof value.body !== "undefined");
    }
    function isRedirectStatusCode(statusCode) {
        return redirectStatusCodes.has(statusCode);
    }
    function isRedirectResponse(result) {
        return (isResponse(result) &&
            isRedirectStatusCode(result.status) &&
            result.headers.has("Location"));
    }
    function isValidMethod(method) {
        return validRequestMethods.has(method.toUpperCase());
    }
    function isMutationMethod(method) {
        return validMutationMethods.has(method.toUpperCase());
    }
    function hasNakedIndexQuery(search) {
        return new URLSearchParams(search).getAll("index").some((v) => v === "");
    }
    function getTargetMatch(matches, location) {
        let search = typeof location === "string" ? parsePath(location).search : location.search;
        if (matches[matches.length - 1].route.index &&
            hasNakedIndexQuery(search || "")) {
            // Return the leaf index route when index is present
            return matches[matches.length - 1];
        }
        // Otherwise grab the deepest "path contributing" match (ignoring index and
        // pathless layout routes)
        let pathMatches = getPathContributingMatches(matches);
        return pathMatches[pathMatches.length - 1];
    }
    function getSubmissionFromNavigation(navigation) {
        let { formMethod, formAction, formEncType, text, formData, json } = navigation;
        if (!formMethod || !formAction || !formEncType) {
            return;
        }
        if (text != null) {
            return {
                formMethod,
                formAction,
                formEncType,
                formData: undefined,
                json: undefined,
                text,
            };
        }
        else if (formData != null) {
            return {
                formMethod,
                formAction,
                formEncType,
                formData,
                json: undefined,
                text: undefined,
            };
        }
        else if (json !== undefined) {
            return {
                formMethod,
                formAction,
                formEncType,
                formData: undefined,
                json,
                text: undefined,
            };
        }
    }
    function getLoadingNavigation(location, submission) {
        if (submission) {
            let navigation = {
                state: "loading",
                location,
                formMethod: submission.formMethod,
                formAction: submission.formAction,
                formEncType: submission.formEncType,
                formData: submission.formData,
                json: submission.json,
                text: submission.text,
            };
            return navigation;
        }
        else {
            let navigation = {
                state: "loading",
                location,
                formMethod: undefined,
                formAction: undefined,
                formEncType: undefined,
                formData: undefined,
                json: undefined,
                text: undefined,
            };
            return navigation;
        }
    }
    function getSubmittingNavigation(location, submission) {
        let navigation = {
            state: "submitting",
            location,
            formMethod: submission.formMethod,
            formAction: submission.formAction,
            formEncType: submission.formEncType,
            formData: submission.formData,
            json: submission.json,
            text: submission.text,
        };
        return navigation;
    }
    function getLoadingFetcher(submission, data) {
        if (submission) {
            let fetcher = {
                state: "loading",
                formMethod: submission.formMethod,
                formAction: submission.formAction,
                formEncType: submission.formEncType,
                formData: submission.formData,
                json: submission.json,
                text: submission.text,
                data,
            };
            return fetcher;
        }
        else {
            let fetcher = {
                state: "loading",
                formMethod: undefined,
                formAction: undefined,
                formEncType: undefined,
                formData: undefined,
                json: undefined,
                text: undefined,
                data,
            };
            return fetcher;
        }
    }
    function getSubmittingFetcher(submission, existingFetcher) {
        let fetcher = {
            state: "submitting",
            formMethod: submission.formMethod,
            formAction: submission.formAction,
            formEncType: submission.formEncType,
            formData: submission.formData,
            json: submission.json,
            text: submission.text,
            data: existingFetcher ? existingFetcher.data : undefined,
        };
        return fetcher;
    }
    function getDoneFetcher(data) {
        let fetcher = {
            state: "idle",
            formMethod: undefined,
            formAction: undefined,
            formEncType: undefined,
            formData: undefined,
            json: undefined,
            text: undefined,
            data,
        };
        return fetcher;
    }
    function restoreAppliedTransitions(_window, transitions) {
        try {
            let sessionPositions = _window.sessionStorage.getItem(TRANSITIONS_STORAGE_KEY);
            if (sessionPositions) {
                let json = JSON.parse(sessionPositions);
                for (let [k, v] of Object.entries(json || {})) {
                    if (v && Array.isArray(v)) {
                        transitions.set(k, new Set(v || []));
                    }
                }
            }
        }
        catch (e) {
            // no-op, use default empty object
        }
    }
    function persistAppliedTransitions(_window, transitions) {
        if (transitions.size > 0) {
            let json = {};
            for (let [k, v] of transitions) {
                json[k] = [...v];
            }
            try {
                _window.sessionStorage.setItem(TRANSITIONS_STORAGE_KEY, JSON.stringify(json));
            }
            catch (error) {
                warning(false, `Failed to save applied view transitions in sessionStorage (${error}).`);
            }
        }
    }
    function createDeferred$1() {
        let resolve;
        let reject;
        let promise = new Promise((res, rej) => {
            resolve = async (val) => {
                res(val);
                try {
                    await promise;
                }
                catch (e) { }
            };
            reject = async (error) => {
                rej(error);
                try {
                    await promise;
                }
                catch (e) { }
            };
        });
        return {
            promise,
            //@ts-ignore
            resolve,
            //@ts-ignore
            reject,
        };
    }
    //#endregion

    const DataRouterContext = React__namespace.createContext(null);
    DataRouterContext.displayName = "DataRouter";
    const DataRouterStateContext = React__namespace.createContext(null);
    DataRouterStateContext.displayName = "DataRouterState";
    const ViewTransitionContext = React__namespace.createContext({
        isTransitioning: false,
    });
    ViewTransitionContext.displayName = "ViewTransition";
    const FetchersContext = React__namespace.createContext(new Map());
    FetchersContext.displayName = "Fetchers";
    const AwaitContext = React__namespace.createContext(null);
    AwaitContext.displayName = "Await";
    const NavigationContext = React__namespace.createContext(null);
    NavigationContext.displayName = "Navigation";
    const LocationContext = React__namespace.createContext(null);
    LocationContext.displayName = "Location";
    const RouteContext = React__namespace.createContext({
        outlet: null,
        matches: [],
        isDataRoute: false,
    });
    RouteContext.displayName = "Route";
    const RouteErrorContext = React__namespace.createContext(null);
    RouteErrorContext.displayName = "RouteError";

    /**
      Resolves a URL against the current location.

      ```tsx
      import { useHref } from "react-router"

      function SomeComponent() {
        let href = useHref("some/where");
        // "/resolved/some/where"
      }
      ```

      @category Hooks
     */
    function useHref(to, { relative } = {}) {
        invariant$2(useInRouterContext(), 
        // TODO: This error is probably because they somehow have 2 versions of the
        // router loaded. We can help them understand how to avoid that.
        `useHref() may be used only in the context of a <Router> component.`);
        let { basename, navigator } = React__namespace.useContext(NavigationContext);
        let { hash, pathname, search } = useResolvedPath(to, { relative });
        let joinedPathname = pathname;
        // If we're operating within a basename, prepend it to the pathname prior
        // to creating the href.  If this is a root navigation, then just use the raw
        // basename which allows the basename to have full control over the presence
        // of a trailing slash on root links
        if (basename !== "/") {
            joinedPathname =
                pathname === "/" ? basename : joinPaths([basename, pathname]);
        }
        return navigator.createHref({ pathname: joinedPathname, search, hash });
    }
    /**
     * Returns true if this component is a descendant of a Router, useful to ensure
     * a component is used within a Router.
     *
     * @category Hooks
     */
    function useInRouterContext() {
        return React__namespace.useContext(LocationContext) != null;
    }
    /**
      Returns the current {@link Location}. This can be useful if you'd like to perform some side effect whenever it changes.

      ```tsx
      import * as React from 'react'
      import { useLocation } from 'react-router'

      function SomeComponent() {
        let location = useLocation()

        React.useEffect(() => {
          // Google Analytics
          ga('send', 'pageview')
        }, [location]);

        return (
          // ...
        );
      }
      ```

      @category Hooks
     */
    function useLocation() {
        invariant$2(useInRouterContext(), 
        // TODO: This error is probably because they somehow have 2 versions of the
        // router loaded. We can help them understand how to avoid that.
        `useLocation() may be used only in the context of a <Router> component.`);
        return React__namespace.useContext(LocationContext).location;
    }
    /**
     * Returns the current navigation action which describes how the router came to
     * the current location, either by a pop, push, or replace on the history stack.
     *
     * @category Hooks
     */
    function useNavigationType() {
        return React__namespace.useContext(LocationContext).navigationType;
    }
    /**
     * Returns a PathMatch object if the given pattern matches the current URL.
     * This is useful for components that need to know "active" state, e.g.
     * `<NavLink>`.
     *
     * @category Hooks
     */
    function useMatch(pattern) {
        invariant$2(useInRouterContext(), 
        // TODO: This error is probably because they somehow have 2 versions of the
        // router loaded. We can help them understand how to avoid that.
        `useMatch() may be used only in the context of a <Router> component.`);
        let { pathname } = useLocation();
        return React__namespace.useMemo(() => matchPath(pattern, decodePath(pathname)), [pathname, pattern]);
    }
    const navigateEffectWarning = `You should call navigate() in a React.useEffect(), not when ` +
        `your component is first rendered.`;
    // Mute warnings for calls to useNavigate in SSR environments
    function useIsomorphicLayoutEffect(cb) {
        let isStatic = React__namespace.useContext(NavigationContext).static;
        if (!isStatic) {
            // We should be able to get rid of this once react 18.3 is released
            // See: https://github.com/facebook/react/pull/26395
            // eslint-disable-next-line react-hooks/rules-of-hooks
            React__namespace.useLayoutEffect(cb);
        }
    }
    /**
      Returns a function that lets you navigate programmatically in the browser in response to user interactions or effects.

      ```tsx
      import { useNavigate } from "react-router";

      function SomeComponent() {
        let navigate = useNavigate();
        return (
          <button
            onClick={() => {
              navigate(-1);
            }}
          />
        );
      }
      ```

      It's often better to use {@link redirect} in {@link ActionFunction | actions} and {@link LoaderFunction | loaders} than this hook.

      @category Hooks
     */
    function useNavigate() {
        let { isDataRoute } = React__namespace.useContext(RouteContext);
        // Conditional usage is OK here because the usage of a data router is static
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return isDataRoute ? useNavigateStable() : useNavigateUnstable();
    }
    function useNavigateUnstable() {
        invariant$2(useInRouterContext(), 
        // TODO: This error is probably because they somehow have 2 versions of the
        // router loaded. We can help them understand how to avoid that.
        `useNavigate() may be used only in the context of a <Router> component.`);
        let dataRouterContext = React__namespace.useContext(DataRouterContext);
        let { basename, navigator } = React__namespace.useContext(NavigationContext);
        let { matches } = React__namespace.useContext(RouteContext);
        let { pathname: locationPathname } = useLocation();
        let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
        let activeRef = React__namespace.useRef(false);
        useIsomorphicLayoutEffect(() => {
            activeRef.current = true;
        });
        let navigate = React__namespace.useCallback((to, options = {}) => {
            warning(activeRef.current, navigateEffectWarning);
            // Short circuit here since if this happens on first render the navigate
            // is useless because we haven't wired up our history listener yet
            if (!activeRef.current)
                return;
            if (typeof to === "number") {
                navigator.go(to);
                return;
            }
            let path = resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, options.relative === "path");
            // If we're operating within a basename, prepend it to the pathname prior
            // to handing off to history (but only if we're not in a data router,
            // otherwise it'll prepend the basename inside of the router).
            // If this is a root navigation, then we navigate to the raw basename
            // which allows the basename to have full control over the presence of a
            // trailing slash on root links
            if (dataRouterContext == null && basename !== "/") {
                path.pathname =
                    path.pathname === "/"
                        ? basename
                        : joinPaths([basename, path.pathname]);
            }
            (!!options.replace ? navigator.replace : navigator.push)(path, options.state, options);
        }, [
            basename,
            navigator,
            routePathnamesJson,
            locationPathname,
            dataRouterContext,
        ]);
        return navigate;
    }
    const OutletContext = React__namespace.createContext(null);
    /**
     * Returns the parent route {@link OutletProps.context | `<Outlet context>`}.
     *
     * @category Hooks
     */
    function useOutletContext() {
        return React__namespace.useContext(OutletContext);
    }
    /**
     * Returns the element for the child route at this level of the route
     * hierarchy. Used internally by `<Outlet>` to render child routes.
     *
     * @category Hooks
     */
    function useOutlet(context) {
        let outlet = React__namespace.useContext(RouteContext).outlet;
        if (outlet) {
            return (React__namespace.createElement(OutletContext.Provider, { value: context }, outlet));
        }
        return outlet;
    }
    /**
      Returns an object of key/value pairs of the dynamic params from the current URL that were matched by the routes. Child routes inherit all params from their parent routes.

      ```tsx
      import { useParams } from "react-router"

      function SomeComponent() {
        let params = useParams()
        params.postId
      }
      ```

      Assuming a route pattern like `/posts/:postId` is matched by `/posts/123` then `params.postId` will be `"123"`.

      @category Hooks
     */
    function useParams() {
        let { matches } = React__namespace.useContext(RouteContext);
        let routeMatch = matches[matches.length - 1];
        return routeMatch ? routeMatch.params : {};
    }
    /**
      Resolves the pathname of the given `to` value against the current location. Similar to {@link useHref}, but returns a {@link Path} instead of a string.

      ```tsx
      import { useResolvedPath } from "react-router"

      function SomeComponent() {
        // if the user is at /dashboard/profile
        let path = useResolvedPath("../accounts")
        path.pathname // "/dashboard/accounts"
        path.search // ""
        path.hash // ""
      }
      ```

      @category Hooks
     */
    function useResolvedPath(to, { relative } = {}) {
        let { matches } = React__namespace.useContext(RouteContext);
        let { pathname: locationPathname } = useLocation();
        let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
        return React__namespace.useMemo(() => resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, relative === "path"), [to, routePathnamesJson, locationPathname, relative]);
    }
    /**
      Hook version of {@link Routes | `<Routes>`} that uses objects instead of components. These objects have the same properties as the component props.

      The return value of `useRoutes` is either a valid React element you can use to render the route tree, or `null` if nothing matched.

      ```tsx
      import * as React from "react";
      import { useRoutes } from "react-router";

      function App() {
        let element = useRoutes([
          {
            path: "/",
            element: <Dashboard />,
            children: [
              {
                path: "messages",
                element: <DashboardMessages />,
              },
              { path: "tasks", element: <DashboardTasks /> },
            ],
          },
          { path: "team", element: <AboutPage /> },
        ]);

        return element;
      }
      ```

     @category Hooks
     */
    function useRoutes(routes, locationArg) {
        return useRoutesImpl(routes, locationArg);
    }
    /**
     * Internal implementation with accept optional param for RouterProvider usage
     *
     * @private
     * @category Hooks
     */
    function useRoutesImpl(routes, locationArg, dataRouterState, future) {
        invariant$2(useInRouterContext(), 
        // TODO: This error is probably because they somehow have 2 versions of the
        // router loaded. We can help them understand how to avoid that.
        `useRoutes() may be used only in the context of a <Router> component.`);
        let { navigator, static: isStatic } = React__namespace.useContext(NavigationContext);
        let { matches: parentMatches } = React__namespace.useContext(RouteContext);
        let routeMatch = parentMatches[parentMatches.length - 1];
        let parentParams = routeMatch ? routeMatch.params : {};
        let parentPathname = routeMatch ? routeMatch.pathname : "/";
        let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
        let parentRoute = routeMatch && routeMatch.route;
        {
            // You won't get a warning about 2 different <Routes> under a <Route>
            // without a trailing *, but this is a best-effort warning anyway since we
            // cannot even give the warning unless they land at the parent route.
            //
            // Example:
            //
            // <Routes>
            //   {/* This route path MUST end with /* because otherwise
            //       it will never match /blog/post/123 */}
            //   <Route path="blog" element={<Blog />} />
            //   <Route path="blog/feed" element={<BlogFeed />} />
            // </Routes>
            //
            // function Blog() {
            //   return (
            //     <Routes>
            //       <Route path="post/:id" element={<Post />} />
            //     </Routes>
            //   );
            // }
            let parentPath = (parentRoute && parentRoute.path) || "";
            warningOnce(parentPathname, !parentRoute || parentPath.endsWith("*") || parentPath.endsWith("*?"), `You rendered descendant <Routes> (or called \`useRoutes()\`) at ` +
                `"${parentPathname}" (under <Route path="${parentPath}">) but the ` +
                `parent route path has no trailing "*". This means if you navigate ` +
                `deeper, the parent won't match anymore and therefore the child ` +
                `routes will never render.\n\n` +
                `Please change the parent <Route path="${parentPath}"> to <Route ` +
                `path="${parentPath === "/" ? "*" : `${parentPath}/*`}">.`);
        }
        let locationFromContext = useLocation();
        let location;
        if (locationArg) {
            let parsedLocationArg = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
            invariant$2(parentPathnameBase === "/" ||
                parsedLocationArg.pathname?.startsWith(parentPathnameBase), `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, ` +
                `the location pathname must begin with the portion of the URL pathname that was ` +
                `matched by all parent routes. The current pathname base is "${parentPathnameBase}" ` +
                `but pathname "${parsedLocationArg.pathname}" was given in the \`location\` prop.`);
            location = parsedLocationArg;
        }
        else {
            location = locationFromContext;
        }
        let pathname = location.pathname || "/";
        let remainingPathname = pathname;
        if (parentPathnameBase !== "/") {
            // Determine the remaining pathname by removing the # of URL segments the
            // parentPathnameBase has, instead of removing based on character count.
            // This is because we can't guarantee that incoming/outgoing encodings/
            // decodings will match exactly.
            // We decode paths before matching on a per-segment basis with
            // decodeURIComponent(), but we re-encode pathnames via `new URL()` so they
            // match what `window.location.pathname` would reflect.  Those don't 100%
            // align when it comes to encoded URI characters such as % and &.
            //
            // So we may end up with:
            //   pathname:           "/descendant/a%25b/match"
            //   parentPathnameBase: "/descendant/a%b"
            //
            // And the direct substring removal approach won't work :/
            let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
            let segments = pathname.replace(/^\//, "").split("/");
            remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
        }
        // Use data router matches when available to avoid another match routes call.
        // Skip this during SSR because the matches coming in from StaticHandlerContext
        // might be UI agnostic and we want the matches from the createStaticRouter's
        // routes
        let matches = !isStatic &&
            dataRouterState &&
            dataRouterState.matches &&
            dataRouterState.matches.length > 0
            ? dataRouterState.matches
            : matchRoutes(routes, { pathname: remainingPathname });
        {
            warning(parentRoute || matches != null, `No routes matched location "${location.pathname}${location.search}${location.hash}" `);
            warning(matches == null ||
                matches[matches.length - 1].route.element !== undefined ||
                matches[matches.length - 1].route.Component !== undefined ||
                matches[matches.length - 1].route.lazy !== undefined, `Matched leaf route at location "${location.pathname}${location.search}${location.hash}" ` +
                `does not have an element or Component. This means it will render an <Outlet /> with a ` +
                `null value by default resulting in an "empty" page.`);
        }
        let renderedMatches = _renderMatches(matches &&
            matches.map((match) => Object.assign({}, match, {
                params: Object.assign({}, parentParams, match.params),
                pathname: joinPaths([
                    parentPathnameBase,
                    // Re-encode pathnames that were decoded inside matchRoutes
                    navigator.encodeLocation
                        ? navigator.encodeLocation(match.pathname).pathname
                        : match.pathname,
                ]),
                pathnameBase: match.pathnameBase === "/"
                    ? parentPathnameBase
                    : joinPaths([
                        parentPathnameBase,
                        // Re-encode pathnames that were decoded inside matchRoutes
                        navigator.encodeLocation
                            ? navigator.encodeLocation(match.pathnameBase).pathname
                            : match.pathnameBase,
                    ]),
            })), parentMatches, dataRouterState, future);
        // When a user passes in a `locationArg`, the associated routes need to
        // be wrapped in a new `LocationContext.Provider` in order for `useLocation`
        // to use the scoped location instead of the global location.
        if (locationArg && renderedMatches) {
            return (React__namespace.createElement(LocationContext.Provider, { value: {
                    location: {
                        pathname: "/",
                        search: "",
                        hash: "",
                        state: null,
                        key: "default",
                        ...location,
                    },
                    navigationType: exports.NavigationType.Pop,
                } }, renderedMatches));
        }
        return renderedMatches;
    }
    function DefaultErrorComponent() {
        let error = useRouteError();
        let message = isRouteErrorResponse(error)
            ? `${error.status} ${error.statusText}`
            : error instanceof Error
                ? error.message
                : JSON.stringify(error);
        let stack = error instanceof Error ? error.stack : null;
        let lightgrey = "rgba(200,200,200, 0.5)";
        let preStyles = { padding: "0.5rem", backgroundColor: lightgrey };
        let codeStyles = { padding: "2px 4px", backgroundColor: lightgrey };
        let devInfo = null;
        {
            console.error("Error handled by React Router default ErrorBoundary:", error);
            devInfo = (React__namespace.createElement(React__namespace.Fragment, null,
                React__namespace.createElement("p", null, "\uD83D\uDCBF Hey developer \uD83D\uDC4B"),
                React__namespace.createElement("p", null,
                    "You can provide a way better UX than this when your app throws errors by providing your own ",
                    React__namespace.createElement("code", { style: codeStyles }, "ErrorBoundary"),
                    " or",
                    " ",
                    React__namespace.createElement("code", { style: codeStyles }, "errorElement"),
                    " prop on your route.")));
        }
        return (React__namespace.createElement(React__namespace.Fragment, null,
            React__namespace.createElement("h2", null, "Unexpected Application Error!"),
            React__namespace.createElement("h3", { style: { fontStyle: "italic" } }, message),
            stack ? React__namespace.createElement("pre", { style: preStyles }, stack) : null,
            devInfo));
    }
    const defaultErrorElement = React__namespace.createElement(DefaultErrorComponent, null);
    class RenderErrorBoundary extends React__namespace.Component {
        constructor(props) {
            super(props);
            this.state = {
                location: props.location,
                revalidation: props.revalidation,
                error: props.error,
            };
        }
        static getDerivedStateFromError(error) {
            return { error: error };
        }
        static getDerivedStateFromProps(props, state) {
            // When we get into an error state, the user will likely click "back" to the
            // previous page that didn't have an error. Because this wraps the entire
            // application, that will have no effect--the error page continues to display.
            // This gives us a mechanism to recover from the error when the location changes.
            //
            // Whether we're in an error state or not, we update the location in state
            // so that when we are in an error state, it gets reset when a new location
            // comes in and the user recovers from the error.
            if (state.location !== props.location ||
                (state.revalidation !== "idle" && props.revalidation === "idle")) {
                return {
                    error: props.error,
                    location: props.location,
                    revalidation: props.revalidation,
                };
            }
            // If we're not changing locations, preserve the location but still surface
            // any new errors that may come through. We retain the existing error, we do
            // this because the error provided from the app state may be cleared without
            // the location changing.
            return {
                error: props.error !== undefined ? props.error : state.error,
                location: state.location,
                revalidation: props.revalidation || state.revalidation,
            };
        }
        componentDidCatch(error, errorInfo) {
            console.error("React Router caught the following error during render", error, errorInfo);
        }
        render() {
            return this.state.error !== undefined ? (React__namespace.createElement(RouteContext.Provider, { value: this.props.routeContext },
                React__namespace.createElement(RouteErrorContext.Provider, { value: this.state.error, children: this.props.component }))) : (this.props.children);
        }
    }
    function RenderedRoute({ routeContext, match, children }) {
        let dataRouterContext = React__namespace.useContext(DataRouterContext);
        // Track how deep we got in our render pass to emulate SSR componentDidCatch
        // in a DataStaticRouter
        if (dataRouterContext &&
            dataRouterContext.static &&
            dataRouterContext.staticContext &&
            (match.route.errorElement || match.route.ErrorBoundary)) {
            dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
        }
        return (React__namespace.createElement(RouteContext.Provider, { value: routeContext }, children));
    }
    function _renderMatches(matches, parentMatches = [], dataRouterState = null, future = null) {
        if (matches == null) {
            if (!dataRouterState) {
                return null;
            }
            if (dataRouterState.errors) {
                // Don't bail if we have data router errors so we can render them in the
                // boundary.  Use the pre-matched (or shimmed) matches
                matches = dataRouterState.matches;
            }
            else if (parentMatches.length === 0 &&
                !dataRouterState.initialized &&
                dataRouterState.matches.length > 0) {
                // Don't bail if we're initializing with partial hydration and we have
                // router matches.  That means we're actively running `patchRoutesOnNavigation`
                // so we should render down the partial matches to the appropriate
                // `HydrateFallback`.  We only do this if `parentMatches` is empty so it
                // only impacts the root matches for `RouterProvider` and no descendant
                // `<Routes>`
                matches = dataRouterState.matches;
            }
            else {
                return null;
            }
        }
        let renderedMatches = matches;
        // If we have data errors, trim matches to the highest error boundary
        let errors = dataRouterState?.errors;
        if (errors != null) {
            let errorIndex = renderedMatches.findIndex((m) => m.route.id && errors?.[m.route.id] !== undefined);
            invariant$2(errorIndex >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(errors).join(",")}`);
            renderedMatches = renderedMatches.slice(0, Math.min(renderedMatches.length, errorIndex + 1));
        }
        // If we're in a partial hydration mode, detect if we need to render down to
        // a given HydrateFallback while we load the rest of the hydration data
        let renderFallback = false;
        let fallbackIndex = -1;
        if (dataRouterState) {
            for (let i = 0; i < renderedMatches.length; i++) {
                let match = renderedMatches[i];
                // Track the deepest fallback up until the first route without data
                if (match.route.HydrateFallback || match.route.hydrateFallbackElement) {
                    fallbackIndex = i;
                }
                if (match.route.id) {
                    let { loaderData, errors } = dataRouterState;
                    let needsToRunLoader = match.route.loader &&
                        !loaderData.hasOwnProperty(match.route.id) &&
                        (!errors || errors[match.route.id] === undefined);
                    if (match.route.lazy || needsToRunLoader) {
                        // We found the first route that's not ready to render (waiting on
                        // lazy, or has a loader that hasn't run yet).  Flag that we need to
                        // render a fallback and render up until the appropriate fallback
                        renderFallback = true;
                        if (fallbackIndex >= 0) {
                            renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
                        }
                        else {
                            renderedMatches = [renderedMatches[0]];
                        }
                        break;
                    }
                }
            }
        }
        return renderedMatches.reduceRight((outlet, match, index) => {
            // Only data routers handle errors/fallbacks
            let error;
            let shouldRenderHydrateFallback = false;
            let errorElement = null;
            let hydrateFallbackElement = null;
            if (dataRouterState) {
                error = errors && match.route.id ? errors[match.route.id] : undefined;
                errorElement = match.route.errorElement || defaultErrorElement;
                if (renderFallback) {
                    if (fallbackIndex < 0 && index === 0) {
                        warningOnce("route-fallback", false, "No `HydrateFallback` element provided to render during initial hydration");
                        shouldRenderHydrateFallback = true;
                        hydrateFallbackElement = null;
                    }
                    else if (fallbackIndex === index) {
                        shouldRenderHydrateFallback = true;
                        hydrateFallbackElement = match.route.hydrateFallbackElement || null;
                    }
                }
            }
            let matches = parentMatches.concat(renderedMatches.slice(0, index + 1));
            let getChildren = () => {
                let children;
                if (error) {
                    children = errorElement;
                }
                else if (shouldRenderHydrateFallback) {
                    children = hydrateFallbackElement;
                }
                else if (match.route.Component) {
                    // Note: This is a de-optimized path since React won't re-use the
                    // ReactElement since it's identity changes with each new
                    // React.createElement call.  We keep this so folks can use
                    // `<Route Component={...}>` in `<Routes>` but generally `Component`
                    // usage is only advised in `RouterProvider` when we can convert it to
                    // `element` ahead of time.
                    children = React__namespace.createElement(match.route.Component, null);
                }
                else if (match.route.element) {
                    children = match.route.element;
                }
                else {
                    children = outlet;
                }
                return (React__namespace.createElement(RenderedRoute, { match: match, routeContext: {
                        outlet,
                        matches,
                        isDataRoute: dataRouterState != null,
                    }, children: children }));
            };
            // Only wrap in an error boundary within data router usages when we have an
            // ErrorBoundary/errorElement on this route.  Otherwise let it bubble up to
            // an ancestor ErrorBoundary/errorElement
            return dataRouterState &&
                (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? (React__namespace.createElement(RenderErrorBoundary, { location: dataRouterState.location, revalidation: dataRouterState.revalidation, component: errorElement, error: error, children: getChildren(), routeContext: { outlet: null, matches, isDataRoute: true } })) : (getChildren());
        }, null);
    }
    var DataRouterHook$1;
    (function (DataRouterHook) {
        DataRouterHook["UseBlocker"] = "useBlocker";
        DataRouterHook["UseRevalidator"] = "useRevalidator";
        DataRouterHook["UseNavigateStable"] = "useNavigate";
    })(DataRouterHook$1 || (DataRouterHook$1 = {}));
    var DataRouterStateHook$1;
    (function (DataRouterStateHook) {
        DataRouterStateHook["UseBlocker"] = "useBlocker";
        DataRouterStateHook["UseLoaderData"] = "useLoaderData";
        DataRouterStateHook["UseActionData"] = "useActionData";
        DataRouterStateHook["UseRouteError"] = "useRouteError";
        DataRouterStateHook["UseNavigation"] = "useNavigation";
        DataRouterStateHook["UseRouteLoaderData"] = "useRouteLoaderData";
        DataRouterStateHook["UseMatches"] = "useMatches";
        DataRouterStateHook["UseRevalidator"] = "useRevalidator";
        DataRouterStateHook["UseNavigateStable"] = "useNavigate";
        DataRouterStateHook["UseRouteId"] = "useRouteId";
    })(DataRouterStateHook$1 || (DataRouterStateHook$1 = {}));
    function getDataRouterConsoleError$1(hookName) {
        return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
    }
    function useDataRouterContext$2(hookName) {
        let ctx = React__namespace.useContext(DataRouterContext);
        invariant$2(ctx, getDataRouterConsoleError$1(hookName));
        return ctx;
    }
    function useDataRouterState$1(hookName) {
        let state = React__namespace.useContext(DataRouterStateContext);
        invariant$2(state, getDataRouterConsoleError$1(hookName));
        return state;
    }
    function useRouteContext(hookName) {
        let route = React__namespace.useContext(RouteContext);
        invariant$2(route, getDataRouterConsoleError$1(hookName));
        return route;
    }
    // Internal version with hookName-aware debugging
    function useCurrentRouteId(hookName) {
        let route = useRouteContext(hookName);
        let thisRoute = route.matches[route.matches.length - 1];
        invariant$2(thisRoute.route.id, `${hookName} can only be used on routes that contain a unique "id"`);
        return thisRoute.route.id;
    }
    /**
     * Returns the ID for the nearest contextual route
     */
    function useRouteId() {
        return useCurrentRouteId(DataRouterStateHook$1.UseRouteId);
    }
    /**
      Returns the current navigation, defaulting to an "idle" navigation when no navigation is in progress. You can use this to render pending UI (like a global spinner) or read FormData from a form navigation.

      ```tsx
      import { useNavigation } from "react-router"

      function SomeComponent() {
        let navigation = useNavigation();
        navigation.state
        navigation.formData
        // etc.
      }
      ```

      @category Hooks
     */
    function useNavigation() {
        let state = useDataRouterState$1(DataRouterStateHook$1.UseNavigation);
        return state.navigation;
    }
    /**
      Revalidate the data on the page for reasons outside of normal data mutations like window focus or polling on an interval.

      ```tsx
      import { useRevalidator } from "react-router";

      function WindowFocusRevalidator() {
        const revalidator = useRevalidator();

        useFakeWindowFocus(() => {
          revalidator.revalidate();
        });

        return (
          <div hidden={revalidator.state === "idle"}>
            Revalidating...
          </div>
        );
      }
      ```

      Note that page data is already revalidated automatically after actions. If you find yourself using this for normal CRUD operations on your data in response to user interactions, you're probably not taking advantage of the other APIs like {@link useFetcher}, {@link Form}, {@link useSubmit} that do this automatically.

      @category Hooks
     */
    function useRevalidator() {
        let dataRouterContext = useDataRouterContext$2(DataRouterHook$1.UseRevalidator);
        let state = useDataRouterState$1(DataRouterStateHook$1.UseRevalidator);
        return React__namespace.useMemo(() => ({
            async revalidate() {
                await dataRouterContext.router.revalidate();
            },
            state: state.revalidation,
        }), [dataRouterContext.router, state.revalidation]);
    }
    /**
     * Returns the active route matches, useful for accessing loaderData for
     * parent/child routes or the route "handle" property
     *
     * @category Hooks
     */
    function useMatches() {
        let { matches, loaderData } = useDataRouterState$1(DataRouterStateHook$1.UseMatches);
        return React__namespace.useMemo(() => matches.map((m) => convertRouteMatchToUiMatch(m, loaderData)), [matches, loaderData]);
    }
    /**
      Returns the data from the closest route {@link LoaderFunction | loader} or {@link ClientLoaderFunction | client loader}.

      ```tsx
      import { useLoaderData } from "react-router"

      export async function loader() {
        return await fakeDb.invoices.findAll();
      }

      export default function Invoices() {
        let invoices = useLoaderData<typeof loader>();
        // ...
      }
      ```

      @category Hooks
     */
    function useLoaderData() {
        let state = useDataRouterState$1(DataRouterStateHook$1.UseLoaderData);
        let routeId = useCurrentRouteId(DataRouterStateHook$1.UseLoaderData);
        return state.loaderData[routeId];
    }
    /**
      Returns the loader data for a given route by route ID.

      ```tsx
      import { useRouteLoaderData } from "react-router";

      function SomeComponent() {
        const { user } = useRouteLoaderData("root");
      }
      ```

      Route IDs are created automatically. They are simply the path of the route file relative to the app folder without the extension.

      | Route Filename             | Route ID             |
      | -------------------------- | -------------------- |
      | `app/root.tsx`             | `"root"`             |
      | `app/routes/teams.tsx`     | `"routes/teams"`     |
      | `app/whatever/teams.$id.tsx` | `"whatever/teams.$id"` |

      If you created an ID manually, you can use that instead:

      ```tsx
      route("/", "containers/app.tsx", { id: "app" }})
      ```

      @category Hooks
     */
    function useRouteLoaderData(routeId) {
        let state = useDataRouterState$1(DataRouterStateHook$1.UseRouteLoaderData);
        return state.loaderData[routeId];
    }
    /**
      Returns the action data from the most recent POST navigation form submission or `undefined` if there hasn't been one.

      ```tsx
      import { Form, useActionData } from "react-router"

      export async function action({ request }) {
        const body = await request.formData()
        const name = body.get("visitorsName")
        return { message: `Hello, ${name}` }
      }

      export default function Invoices() {
        const data = useActionData()
        return (
          <Form method="post">
            <input type="text" name="visitorsName" />
            {data ? data.message : "Waiting..."}
          </Form>
        )
      }
      ```

      @category Hooks
     */
    function useActionData() {
        let state = useDataRouterState$1(DataRouterStateHook$1.UseActionData);
        let routeId = useCurrentRouteId(DataRouterStateHook$1.UseLoaderData);
        return (state.actionData ? state.actionData[routeId] : undefined);
    }
    /**
      Accesses the error thrown during an {@link ActionFunction | action}, {@link LoaderFunction | loader}, or component render to be used in a route module Error Boundary.

      ```tsx
      export function ErrorBoundary() {
        const error = useRouteError();
        return <div>{error.message}</div>;
      }
      ```

      @category Hooks
     */
    function useRouteError() {
        let error = React__namespace.useContext(RouteErrorContext);
        let state = useDataRouterState$1(DataRouterStateHook$1.UseRouteError);
        let routeId = useCurrentRouteId(DataRouterStateHook$1.UseRouteError);
        // If this was a render error, we put it in a RouteError context inside
        // of RenderErrorBoundary
        if (error !== undefined) {
            return error;
        }
        // Otherwise look for errors from our data router state
        return state.errors?.[routeId];
    }
    /**
      Returns the resolved promise value from the closest {@link Await | `<Await>`}.

      ```tsx
      function SomeDescendant() {
        const value = useAsyncValue();
        // ...
      }

      // somewhere in your app
      <Await resolve={somePromise}>
        <SomeDescendant />
      </Await>
      ```

      @category Hooks
     */
    function useAsyncValue() {
        let value = React__namespace.useContext(AwaitContext);
        return value?._data;
    }
    /**
      Returns the rejection value from the closest {@link Await | `<Await>`}.

      ```tsx
      import { Await, useAsyncError } from "react-router"

      function ErrorElement() {
        const error = useAsyncError();
        return (
          <p>Uh Oh, something went wrong! {error.message}</p>
        );
      }

      // somewhere in your app
      <Await
        resolve={promiseThatRejects}
        errorElement={<ErrorElement />}
      />
      ```

      @category Hooks
     */
    function useAsyncError() {
        let value = React__namespace.useContext(AwaitContext);
        return value?._error;
    }
    let blockerId = 0;
    /**
     * Allow the application to block navigations within the SPA and present the
     * user a confirmation dialog to confirm the navigation.  Mostly used to avoid
     * using half-filled form data.  This does not handle hard-reloads or
     * cross-origin navigations.
     *
     * @category Hooks
     */
    function useBlocker(shouldBlock) {
        let { router, basename } = useDataRouterContext$2(DataRouterHook$1.UseBlocker);
        let state = useDataRouterState$1(DataRouterStateHook$1.UseBlocker);
        let [blockerKey, setBlockerKey] = React__namespace.useState("");
        let blockerFunction = React__namespace.useCallback((arg) => {
            if (typeof shouldBlock !== "function") {
                return !!shouldBlock;
            }
            if (basename === "/") {
                return shouldBlock(arg);
            }
            // If they provided us a function and we've got an active basename, strip
            // it from the locations we expose to the user to match the behavior of
            // useLocation
            let { currentLocation, nextLocation, historyAction } = arg;
            return shouldBlock({
                currentLocation: {
                    ...currentLocation,
                    pathname: stripBasename(currentLocation.pathname, basename) ||
                        currentLocation.pathname,
                },
                nextLocation: {
                    ...nextLocation,
                    pathname: stripBasename(nextLocation.pathname, basename) ||
                        nextLocation.pathname,
                },
                historyAction,
            });
        }, [basename, shouldBlock]);
        // This effect is in charge of blocker key assignment and deletion (which is
        // tightly coupled to the key)
        React__namespace.useEffect(() => {
            let key = String(++blockerId);
            setBlockerKey(key);
            return () => router.deleteBlocker(key);
        }, [router]);
        // This effect handles assigning the blockerFunction.  This is to handle
        // unstable blocker function identities, and happens only after the prior
        // effect so we don't get an orphaned blockerFunction in the router with a
        // key of "".  Until then we just have the IDLE_BLOCKER.
        React__namespace.useEffect(() => {
            if (blockerKey !== "") {
                router.getBlocker(blockerKey, blockerFunction);
            }
        }, [router, blockerKey, blockerFunction]);
        // Prefer the blocker from `state` not `router.state` since DataRouterContext
        // is memoized so this ensures we update on blocker state updates
        return blockerKey && state.blockers.has(blockerKey)
            ? state.blockers.get(blockerKey)
            : IDLE_BLOCKER;
    }
    /**
     * Stable version of useNavigate that is used when we are in the context of
     * a RouterProvider.
     *
     * @private
     */
    function useNavigateStable() {
        let { router } = useDataRouterContext$2(DataRouterHook$1.UseNavigateStable);
        let id = useCurrentRouteId(DataRouterStateHook$1.UseNavigateStable);
        let activeRef = React__namespace.useRef(false);
        useIsomorphicLayoutEffect(() => {
            activeRef.current = true;
        });
        let navigate = React__namespace.useCallback(async (to, options = {}) => {
            warning(activeRef.current, navigateEffectWarning);
            // Short circuit here since if this happens on first render the navigate
            // is useless because we haven't wired up our router subscriber yet
            if (!activeRef.current)
                return;
            if (typeof to === "number") {
                router.navigate(to);
            }
            else {
                await router.navigate(to, { fromRouteId: id, ...options });
            }
        }, [router, id]);
        return navigate;
    }
    const alreadyWarned$1 = {};
    function warningOnce(key, cond, message) {
        if (!cond && !alreadyWarned$1[key]) {
            alreadyWarned$1[key] = true;
            warning(false, message);
        }
    }

    const alreadyWarned = {};
    function warnOnce(condition, message) {
        if (!condition && !alreadyWarned[message]) {
            alreadyWarned[message] = true;
            console.warn(message);
        }
    }

    /**
     * @private
     */
    function mapRouteProperties(route) {
        let updates = {
            // Note: this check also occurs in createRoutesFromChildren so update
            // there if you change this -- please and thank you!
            hasErrorBoundary: route.hasErrorBoundary ||
                route.ErrorBoundary != null ||
                route.errorElement != null,
        };
        if (route.Component) {
            {
                if (route.element) {
                    warning(false, "You should not include both `Component` and `element` on your route - " +
                        "`Component` will be used.");
                }
            }
            Object.assign(updates, {
                element: React__namespace.createElement(route.Component),
                Component: undefined,
            });
        }
        if (route.HydrateFallback) {
            {
                if (route.hydrateFallbackElement) {
                    warning(false, "You should not include both `HydrateFallback` and `hydrateFallbackElement` on your route - " +
                        "`HydrateFallback` will be used.");
                }
            }
            Object.assign(updates, {
                hydrateFallbackElement: React__namespace.createElement(route.HydrateFallback),
                HydrateFallback: undefined,
            });
        }
        if (route.ErrorBoundary) {
            {
                if (route.errorElement) {
                    warning(false, "You should not include both `ErrorBoundary` and `errorElement` on your route - " +
                        "`ErrorBoundary` will be used.");
                }
            }
            Object.assign(updates, {
                errorElement: React__namespace.createElement(route.ErrorBoundary),
                ErrorBoundary: undefined,
            });
        }
        return updates;
    }
    /**
     * Create a new data router that manages the application path using an in-memory
     * history stack.  Useful for non-browser environments without a DOM API.
     *
     * @category Data Routers
     */
    function createMemoryRouter(
    /**
     * Application routes
     */
    routes, 
    /**
     * Router options
     */
    opts) {
        return createRouter({
            basename: opts?.basename,
            unstable_getContext: opts?.unstable_getContext,
            future: opts?.future,
            history: createMemoryHistory({
                initialEntries: opts?.initialEntries,
                initialIndex: opts?.initialIndex,
            }),
            hydrationData: opts?.hydrationData,
            routes,
            mapRouteProperties,
            dataStrategy: opts?.dataStrategy,
            patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
        }).initialize();
    }
    let Deferred$1 = class Deferred {
        status = "pending";
        promise;
        // @ts-expect-error - no initializer
        resolve;
        // @ts-expect-error - no initializer
        reject;
        constructor() {
            this.promise = new Promise((resolve, reject) => {
                this.resolve = (value) => {
                    if (this.status === "pending") {
                        this.status = "resolved";
                        resolve(value);
                    }
                };
                this.reject = (reason) => {
                    if (this.status === "pending") {
                        this.status = "rejected";
                        reject(reason);
                    }
                };
            });
        }
    };
    /**
     * Given a Remix Router instance, render the appropriate UI
     */
    function RouterProvider({ router, flushSync: reactDomFlushSyncImpl, }) {
        let [state, setStateImpl] = React__namespace.useState(router.state);
        let [pendingState, setPendingState] = React__namespace.useState();
        let [vtContext, setVtContext] = React__namespace.useState({
            isTransitioning: false,
        });
        let [renderDfd, setRenderDfd] = React__namespace.useState();
        let [transition, setTransition] = React__namespace.useState();
        let [interruption, setInterruption] = React__namespace.useState();
        let fetcherData = React__namespace.useRef(new Map());
        let setState = React__namespace.useCallback((newState, { deletedFetchers, flushSync, viewTransitionOpts }) => {
            newState.fetchers.forEach((fetcher, key) => {
                if (fetcher.data !== undefined) {
                    fetcherData.current.set(key, fetcher.data);
                }
            });
            deletedFetchers.forEach((key) => fetcherData.current.delete(key));
            warnOnce(flushSync === false || reactDomFlushSyncImpl != null, "You provided the `flushSync` option to a router update, " +
                "but you are not using the `<RouterProvider>` from `react-router/dom` " +
                "so `ReactDOM.flushSync()` is unavailable.  Please update your app " +
                'to `import { RouterProvider } from "react-router/dom"` and ensure ' +
                "you have `react-dom` installed as a dependency to use the " +
                "`flushSync` option.");
            let isViewTransitionAvailable = router.window != null &&
                router.window.document != null &&
                typeof router.window.document.startViewTransition === "function";
            warnOnce(viewTransitionOpts == null || isViewTransitionAvailable, "You provided the `viewTransition` option to a router update, " +
                "but you do not appear to be running in a DOM environment as " +
                "`window.startViewTransition` is not available.");
            // If this isn't a view transition or it's not available in this browser,
            // just update and be done with it
            if (!viewTransitionOpts || !isViewTransitionAvailable) {
                if (reactDomFlushSyncImpl && flushSync) {
                    reactDomFlushSyncImpl(() => setStateImpl(newState));
                }
                else {
                    React__namespace.startTransition(() => setStateImpl(newState));
                }
                return;
            }
            // flushSync + startViewTransition
            if (reactDomFlushSyncImpl && flushSync) {
                // Flush through the context to mark DOM elements as transition=ing
                reactDomFlushSyncImpl(() => {
                    // Cancel any pending transitions
                    if (transition) {
                        renderDfd && renderDfd.resolve();
                        transition.skipTransition();
                    }
                    setVtContext({
                        isTransitioning: true,
                        flushSync: true,
                        currentLocation: viewTransitionOpts.currentLocation,
                        nextLocation: viewTransitionOpts.nextLocation,
                    });
                });
                // Update the DOM
                let t = router.window.document.startViewTransition(() => {
                    reactDomFlushSyncImpl(() => setStateImpl(newState));
                });
                // Clean up after the animation completes
                t.finished.finally(() => {
                    reactDomFlushSyncImpl(() => {
                        setRenderDfd(undefined);
                        setTransition(undefined);
                        setPendingState(undefined);
                        setVtContext({ isTransitioning: false });
                    });
                });
                reactDomFlushSyncImpl(() => setTransition(t));
                return;
            }
            // startTransition + startViewTransition
            if (transition) {
                // Interrupting an in-progress transition, cancel and let everything flush
                // out, and then kick off a new transition from the interruption state
                renderDfd && renderDfd.resolve();
                transition.skipTransition();
                setInterruption({
                    state: newState,
                    currentLocation: viewTransitionOpts.currentLocation,
                    nextLocation: viewTransitionOpts.nextLocation,
                });
            }
            else {
                // Completed navigation update with opted-in view transitions, let 'er rip
                setPendingState(newState);
                setVtContext({
                    isTransitioning: true,
                    flushSync: false,
                    currentLocation: viewTransitionOpts.currentLocation,
                    nextLocation: viewTransitionOpts.nextLocation,
                });
            }
        }, [router.window, reactDomFlushSyncImpl, transition, renderDfd]);
        // Need to use a layout effect here so we are subscribed early enough to
        // pick up on any render-driven redirects/navigations (useEffect/<Navigate>)
        React__namespace.useLayoutEffect(() => router.subscribe(setState), [router, setState]);
        // When we start a view transition, create a Deferred we can use for the
        // eventual "completed" render
        React__namespace.useEffect(() => {
            if (vtContext.isTransitioning && !vtContext.flushSync) {
                setRenderDfd(new Deferred$1());
            }
        }, [vtContext]);
        // Once the deferred is created, kick off startViewTransition() to update the
        // DOM and then wait on the Deferred to resolve (indicating the DOM update has
        // happened)
        React__namespace.useEffect(() => {
            if (renderDfd && pendingState && router.window) {
                let newState = pendingState;
                let renderPromise = renderDfd.promise;
                let transition = router.window.document.startViewTransition(async () => {
                    React__namespace.startTransition(() => setStateImpl(newState));
                    await renderPromise;
                });
                transition.finished.finally(() => {
                    setRenderDfd(undefined);
                    setTransition(undefined);
                    setPendingState(undefined);
                    setVtContext({ isTransitioning: false });
                });
                setTransition(transition);
            }
        }, [pendingState, renderDfd, router.window]);
        // When the new location finally renders and is committed to the DOM, this
        // effect will run to resolve the transition
        React__namespace.useEffect(() => {
            if (renderDfd &&
                pendingState &&
                state.location.key === pendingState.location.key) {
                renderDfd.resolve();
            }
        }, [renderDfd, transition, state.location, pendingState]);
        // If we get interrupted with a new navigation during a transition, we skip
        // the active transition, let it cleanup, then kick it off again here
        React__namespace.useEffect(() => {
            if (!vtContext.isTransitioning && interruption) {
                setPendingState(interruption.state);
                setVtContext({
                    isTransitioning: true,
                    flushSync: false,
                    currentLocation: interruption.currentLocation,
                    nextLocation: interruption.nextLocation,
                });
                setInterruption(undefined);
            }
        }, [vtContext.isTransitioning, interruption]);
        let navigator = React__namespace.useMemo(() => {
            return {
                createHref: router.createHref,
                encodeLocation: router.encodeLocation,
                go: (n) => router.navigate(n),
                push: (to, state, opts) => router.navigate(to, {
                    state,
                    preventScrollReset: opts?.preventScrollReset,
                }),
                replace: (to, state, opts) => router.navigate(to, {
                    replace: true,
                    state,
                    preventScrollReset: opts?.preventScrollReset,
                }),
            };
        }, [router]);
        let basename = router.basename || "/";
        let dataRouterContext = React__namespace.useMemo(() => ({
            router,
            navigator,
            static: false,
            basename,
        }), [router, navigator, basename]);
        // The fragment and {null} here are important!  We need them to keep React 18's
        // useId happy when we are server-rendering since we may have a <script> here
        // containing the hydrated server-side staticContext (from StaticRouterProvider).
        // useId relies on the component tree structure to generate deterministic id's
        // so we need to ensure it remains the same on the client even though
        // we don't need the <script> tag
        return (React__namespace.createElement(React__namespace.Fragment, null,
            React__namespace.createElement(DataRouterContext.Provider, { value: dataRouterContext },
                React__namespace.createElement(DataRouterStateContext.Provider, { value: state },
                    React__namespace.createElement(FetchersContext.Provider, { value: fetcherData.current },
                        React__namespace.createElement(ViewTransitionContext.Provider, { value: vtContext },
                            React__namespace.createElement(Router, { basename: basename, location: state.location, navigationType: state.historyAction, navigator: navigator },
                                React__namespace.createElement(MemoizedDataRoutes, { routes: router.routes, future: router.future, state: state })))))),
            null));
    }
    // Memoize to avoid re-renders when updating `ViewTransitionContext`
    const MemoizedDataRoutes = React__namespace.memo(DataRoutes$1);
    function DataRoutes$1({ routes, future, state, }) {
        return useRoutesImpl(routes, undefined, state, future);
    }
    /**
     * A `<Router>` that stores all entries in memory.
     *
     * @category Component Routers
     */
    function MemoryRouter({ basename, children, initialEntries, initialIndex, }) {
        let historyRef = React__namespace.useRef();
        if (historyRef.current == null) {
            historyRef.current = createMemoryHistory({
                initialEntries,
                initialIndex,
                v5Compat: true,
            });
        }
        let history = historyRef.current;
        let [state, setStateImpl] = React__namespace.useState({
            action: history.action,
            location: history.location,
        });
        let setState = React__namespace.useCallback((newState) => {
            React__namespace.startTransition(() => setStateImpl(newState));
        }, [setStateImpl]);
        React__namespace.useLayoutEffect(() => history.listen(setState), [history, setState]);
        return (React__namespace.createElement(Router, { basename: basename, children: children, location: state.location, navigationType: state.action, navigator: history }));
    }
    /**
     * A component-based version of {@link useNavigate} to use in a [`React.Component
     * Class`](https://reactjs.org/docs/react-component.html) where hooks are not
     * able to be used.
     *
     * It's recommended to avoid using this component in favor of {@link useNavigate}
     *
     * @category Components
     */
    function Navigate({ to, replace, state, relative, }) {
        invariant$2(useInRouterContext(), 
        // TODO: This error is probably because they somehow have 2 versions of
        // the router loaded. We can help them understand how to avoid that.
        `<Navigate> may be used only in the context of a <Router> component.`);
        let { static: isStatic } = React__namespace.useContext(NavigationContext);
        warning(!isStatic, `<Navigate> must not be used on the initial render in a <StaticRouter>. ` +
            `This is a no-op, but you should modify your code so the <Navigate> is ` +
            `only ever rendered in response to some user interaction or state change.`);
        let { matches } = React__namespace.useContext(RouteContext);
        let { pathname: locationPathname } = useLocation();
        let navigate = useNavigate();
        // Resolve the path outside of the effect so that when effects run twice in
        // StrictMode they navigate to the same place
        let path = resolveTo(to, getResolveToMatches(matches), locationPathname, relative === "path");
        let jsonPath = JSON.stringify(path);
        React__namespace.useEffect(() => {
            navigate(JSON.parse(jsonPath), { replace, state, relative });
        }, [navigate, jsonPath, relative, replace, state]);
        return null;
    }
    /**
      Renders the matching child route of a parent route or nothing if no child route matches.

      ```tsx
      import { Outlet } from "react-router"

      export default function SomeParent() {
        return (
          <div>
            <h1>Parent Content</h1>
            <Outlet />
          </div>
        );
      }
      ```

      @category Components
     */
    function Outlet(props) {
        return useOutlet(props.context);
    }
    /**
     * Configures an element to render when a pattern matches the current location.
     * It must be rendered within a {@link Routes} element. Note that these routes
     * do not participate in data loading, actions, code splitting, or any other
     * route module features.
     *
     * @category Components
     */
    function Route(_props) {
        invariant$2(false, `A <Route> is only ever to be used as the child of <Routes> element, ` +
            `never rendered directly. Please wrap your <Route> in a <Routes>.`);
    }
    /**
     * Provides location context for the rest of the app.
     *
     * Note: You usually won't render a `<Router>` directly. Instead, you'll render a
     * router that is more specific to your environment such as a `<BrowserRouter>`
     * in web browsers or a `<StaticRouter>` for server rendering.
     *
     * @category Components
     */
    function Router({ basename: basenameProp = "/", children = null, location: locationProp, navigationType = exports.NavigationType.Pop, navigator, static: staticProp = false, }) {
        invariant$2(!useInRouterContext(), `You cannot render a <Router> inside another <Router>.` +
            ` You should never have more than one in your app.`);
        // Preserve trailing slashes on basename, so we can let the user control
        // the enforcement of trailing slashes throughout the app
        let basename = basenameProp.replace(/^\/*/, "/");
        let navigationContext = React__namespace.useMemo(() => ({
            basename,
            navigator,
            static: staticProp,
            future: {},
        }), [basename, navigator, staticProp]);
        if (typeof locationProp === "string") {
            locationProp = parsePath(locationProp);
        }
        let { pathname = "/", search = "", hash = "", state = null, key = "default", } = locationProp;
        let locationContext = React__namespace.useMemo(() => {
            let trailingPathname = stripBasename(pathname, basename);
            if (trailingPathname == null) {
                return null;
            }
            return {
                location: {
                    pathname: trailingPathname,
                    search,
                    hash,
                    state,
                    key,
                },
                navigationType,
            };
        }, [basename, pathname, search, hash, state, key, navigationType]);
        warning(locationContext != null, `<Router basename="${basename}"> is not able to match the URL ` +
            `"${pathname}${search}${hash}" because it does not start with the ` +
            `basename, so the <Router> won't render anything.`);
        if (locationContext == null) {
            return null;
        }
        return (React__namespace.createElement(NavigationContext.Provider, { value: navigationContext },
            React__namespace.createElement(LocationContext.Provider, { children: children, value: locationContext })));
    }
    /**
     Renders a branch of {@link Route | `<Routes>`} that best matches the current
     location. Note that these routes do not participate in data loading, actions,
     code splitting, or any other route module features.

     ```tsx
     import { Routes, Route } from "react-router"

    <Routes>
      <Route index element={<StepOne />} />
      <Route path="step-2" element={<StepTwo />} />
      <Route path="step-3" element={<StepThree />}>
    </Routes>
     ```

     @category Components
     */
    function Routes({ children, location, }) {
        return useRoutes(createRoutesFromChildren(children), location);
    }
    /**
    Used to render promise values with automatic error handling.

    ```tsx
    import { Await, useLoaderData } from "react-router";

    export function loader() {
      // not awaited
      const reviews = getReviews()
      // awaited (blocks the transition)
      const book = await fetch("/api/book").then((res) => res.json())
      return { book, reviews }
    }

    function Book() {
      const { book, reviews } = useLoaderData();
      return (
        <div>
          <h1>{book.title}</h1>
          <p>{book.description}</p>
          <React.Suspense fallback={<ReviewsSkeleton />}>
            <Await
              resolve={reviews}
              errorElement={
                <div>Could not load reviews 😬</div>
              }
              children={(resolvedReviews) => (
                <Reviews items={resolvedReviews} />
              )}
            />
          </React.Suspense>
        </div>
      );
    }
    ```

    **Note:** `<Await>` expects to be rendered inside of a `<React.Suspense>`

    @category Components

    */
    function Await({ children, errorElement, resolve, }) {
        return (React__namespace.createElement(AwaitErrorBoundary, { resolve: resolve, errorElement: errorElement },
            React__namespace.createElement(ResolveAwait, null, children)));
    }
    var AwaitRenderStatus;
    (function (AwaitRenderStatus) {
        AwaitRenderStatus[AwaitRenderStatus["pending"] = 0] = "pending";
        AwaitRenderStatus[AwaitRenderStatus["success"] = 1] = "success";
        AwaitRenderStatus[AwaitRenderStatus["error"] = 2] = "error";
    })(AwaitRenderStatus || (AwaitRenderStatus = {}));
    class AwaitErrorBoundary extends React__namespace.Component {
        constructor(props) {
            super(props);
            this.state = { error: null };
        }
        static getDerivedStateFromError(error) {
            return { error };
        }
        componentDidCatch(error, errorInfo) {
            console.error("<Await> caught the following error during render", error, errorInfo);
        }
        render() {
            let { children, errorElement, resolve } = this.props;
            let promise = null;
            let status = AwaitRenderStatus.pending;
            if (!(resolve instanceof Promise)) {
                // Didn't get a promise - provide as a resolved promise
                status = AwaitRenderStatus.success;
                promise = Promise.resolve();
                Object.defineProperty(promise, "_tracked", { get: () => true });
                Object.defineProperty(promise, "_data", { get: () => resolve });
            }
            else if (this.state.error) {
                // Caught a render error, provide it as a rejected promise
                status = AwaitRenderStatus.error;
                let renderError = this.state.error;
                promise = Promise.reject().catch(() => { }); // Avoid unhandled rejection warnings
                Object.defineProperty(promise, "_tracked", { get: () => true });
                Object.defineProperty(promise, "_error", { get: () => renderError });
            }
            else if (resolve._tracked) {
                // Already tracked promise - check contents
                promise = resolve;
                status =
                    "_error" in promise
                        ? AwaitRenderStatus.error
                        : "_data" in promise
                            ? AwaitRenderStatus.success
                            : AwaitRenderStatus.pending;
            }
            else {
                // Raw (untracked) promise - track it
                status = AwaitRenderStatus.pending;
                Object.defineProperty(resolve, "_tracked", { get: () => true });
                promise = resolve.then((data) => Object.defineProperty(resolve, "_data", { get: () => data }), (error) => Object.defineProperty(resolve, "_error", { get: () => error }));
            }
            if (status === AwaitRenderStatus.error && !errorElement) {
                // No errorElement, throw to the nearest route-level error boundary
                throw promise._error;
            }
            if (status === AwaitRenderStatus.error) {
                // Render via our errorElement
                return React__namespace.createElement(AwaitContext.Provider, { value: promise, children: errorElement });
            }
            if (status === AwaitRenderStatus.success) {
                // Render children with resolved value
                return React__namespace.createElement(AwaitContext.Provider, { value: promise, children: children });
            }
            // Throw to the suspense boundary
            throw promise;
        }
    }
    /**
     * @private
     * Indirection to leverage useAsyncValue for a render-prop API on `<Await>`
     */
    function ResolveAwait({ children, }) {
        let data = useAsyncValue();
        let toRender = typeof children === "function" ? children(data) : children;
        return React__namespace.createElement(React__namespace.Fragment, null, toRender);
    }
    ///////////////////////////////////////////////////////////////////////////////
    // UTILS
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a route config from a React "children" object, which is usually
     * either a `<Route>` element or an array of them. Used internally by
     * `<Routes>` to create a route config from its children.
     *
     * @category Utils
     */
    function createRoutesFromChildren(children, parentPath = []) {
        let routes = [];
        React__namespace.Children.forEach(children, (element, index) => {
            if (!React__namespace.isValidElement(element)) {
                // Ignore non-elements. This allows people to more easily inline
                // conditionals in their route config.
                return;
            }
            let treePath = [...parentPath, index];
            if (element.type === React__namespace.Fragment) {
                // Transparently support React.Fragment and its children.
                routes.push.apply(routes, createRoutesFromChildren(element.props.children, treePath));
                return;
            }
            invariant$2(element.type === Route, `[${typeof element.type === "string" ? element.type : element.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`);
            invariant$2(!element.props.index || !element.props.children, "An index route cannot have child routes.");
            let route = {
                id: element.props.id || treePath.join("-"),
                caseSensitive: element.props.caseSensitive,
                element: element.props.element,
                Component: element.props.Component,
                index: element.props.index,
                path: element.props.path,
                loader: element.props.loader,
                action: element.props.action,
                hydrateFallbackElement: element.props.hydrateFallbackElement,
                HydrateFallback: element.props.HydrateFallback,
                errorElement: element.props.errorElement,
                ErrorBoundary: element.props.ErrorBoundary,
                hasErrorBoundary: element.props.hasErrorBoundary === true ||
                    element.props.ErrorBoundary != null ||
                    element.props.errorElement != null,
                shouldRevalidate: element.props.shouldRevalidate,
                handle: element.props.handle,
                lazy: element.props.lazy,
            };
            if (element.props.children) {
                route.children = createRoutesFromChildren(element.props.children, treePath);
            }
            routes.push(route);
        });
        return routes;
    }
    /**
     * Create route objects from JSX elements instead of arrays of objects
     */
    let createRoutesFromElements = createRoutesFromChildren;
    /**
     * Renders the result of `matchRoutes()` into a React element.
     *
     * @category Utils
     */
    function renderMatches(matches) {
        return _renderMatches(matches);
    }

    const defaultMethod = "get";
    const defaultEncType = "application/x-www-form-urlencoded";
    function isHtmlElement(object) {
        return object != null && typeof object.tagName === "string";
    }
    function isButtonElement(object) {
        return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
    }
    function isFormElement(object) {
        return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
    }
    function isInputElement(object) {
        return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
    }
    function isModifiedEvent(event) {
        return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
    }
    function shouldProcessLinkClick(event, target) {
        return (event.button === 0 && // Ignore everything but left clicks
            (!target || target === "_self") && // Let browser handle "target=_blank" etc.
            !isModifiedEvent(event) // Ignore clicks with modifier keys
        );
    }
    /**
      Creates a URLSearchParams object using the given initializer.

      This is identical to `new URLSearchParams(init)` except it also
      supports arrays as values in the object form of the initializer
      instead of just strings. This is convenient when you need multiple
      values for a given key, but don't want to use an array initializer.

      For example, instead of:

      ```tsx
      let searchParams = new URLSearchParams([
        ['sort', 'name'],
        ['sort', 'price']
      ]);
      ```
      you can do:

      ```
      let searchParams = createSearchParams({
        sort: ['name', 'price']
      });
      ```

      @category Utils
     */
    function createSearchParams(init = "") {
        return new URLSearchParams(typeof init === "string" ||
            Array.isArray(init) ||
            init instanceof URLSearchParams
            ? init
            : Object.keys(init).reduce((memo, key) => {
                let value = init[key];
                return memo.concat(Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]);
            }, []));
    }
    function getSearchParamsForLocation(locationSearch, defaultSearchParams) {
        let searchParams = createSearchParams(locationSearch);
        if (defaultSearchParams) {
            // Use `defaultSearchParams.forEach(...)` here instead of iterating of
            // `defaultSearchParams.keys()` to work-around a bug in Firefox related to
            // web extensions. Relevant Bugzilla tickets:
            // https://bugzilla.mozilla.org/show_bug.cgi?id=1414602
            // https://bugzilla.mozilla.org/show_bug.cgi?id=1023984
            defaultSearchParams.forEach((_, key) => {
                if (!searchParams.has(key)) {
                    defaultSearchParams.getAll(key).forEach((value) => {
                        searchParams.append(key, value);
                    });
                }
            });
        }
        return searchParams;
    }
    // One-time check for submitter support
    let _formDataSupportsSubmitter = null;
    function isFormDataSubmitterSupported() {
        if (_formDataSupportsSubmitter === null) {
            try {
                new FormData(document.createElement("form"), 
                // @ts-expect-error if FormData supports the submitter parameter, this will throw
                0);
                _formDataSupportsSubmitter = false;
            }
            catch (e) {
                _formDataSupportsSubmitter = true;
            }
        }
        return _formDataSupportsSubmitter;
    }
    const supportedFormEncTypes = new Set([
        "application/x-www-form-urlencoded",
        "multipart/form-data",
        "text/plain",
    ]);
    function getFormEncType(encType) {
        if (encType != null && !supportedFormEncTypes.has(encType)) {
            warning(false, `"${encType}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` ` +
                `and will default to "${defaultEncType}"`);
            return null;
        }
        return encType;
    }
    function getFormSubmissionInfo(target, basename) {
        let method;
        let action;
        let encType;
        let formData;
        let body;
        if (isFormElement(target)) {
            // When grabbing the action from the element, it will have had the basename
            // prefixed to ensure non-JS scenarios work, so strip it since we'll
            // re-prefix in the router
            let attr = target.getAttribute("action");
            action = attr ? stripBasename(attr, basename) : null;
            method = target.getAttribute("method") || defaultMethod;
            encType = getFormEncType(target.getAttribute("enctype")) || defaultEncType;
            formData = new FormData(target);
        }
        else if (isButtonElement(target) ||
            (isInputElement(target) &&
                (target.type === "submit" || target.type === "image"))) {
            let form = target.form;
            if (form == null) {
                throw new Error(`Cannot submit a <button> or <input type="submit"> without a <form>`);
            }
            // <button>/<input type="submit"> may override attributes of <form>
            // When grabbing the action from the element, it will have had the basename
            // prefixed to ensure non-JS scenarios work, so strip it since we'll
            // re-prefix in the router
            let attr = target.getAttribute("formaction") || form.getAttribute("action");
            action = attr ? stripBasename(attr, basename) : null;
            method =
                target.getAttribute("formmethod") ||
                    form.getAttribute("method") ||
                    defaultMethod;
            encType =
                getFormEncType(target.getAttribute("formenctype")) ||
                    getFormEncType(form.getAttribute("enctype")) ||
                    defaultEncType;
            // Build a FormData object populated from a form and submitter
            formData = new FormData(form, target);
            // If this browser doesn't support the `FormData(el, submitter)` format,
            // then tack on the submitter value at the end.  This is a lightweight
            // solution that is not 100% spec compliant.  For complete support in older
            // browsers, consider using the `formdata-submitter-polyfill` package
            if (!isFormDataSubmitterSupported()) {
                let { name, type, value } = target;
                if (type === "image") {
                    let prefix = name ? `${name}.` : "";
                    formData.append(`${prefix}x`, "0");
                    formData.append(`${prefix}y`, "0");
                }
                else if (name) {
                    formData.append(name, value);
                }
            }
        }
        else if (isHtmlElement(target)) {
            throw new Error(`Cannot submit element that is not <form>, <button>, or ` +
                `<input type="submit|image">`);
        }
        else {
            method = defaultMethod;
            action = null;
            encType = defaultEncType;
            body = target;
        }
        // Send body for <Form encType="text/plain" so we encode it into text
        if (formData && encType === "text/plain") {
            body = formData;
            formData = undefined;
        }
        return { action, method: method.toLowerCase(), encType, formData, body };
    }

    function invariant$1(value, message) {
        if (value === false || value === null || typeof value === "undefined") {
            throw new Error(message);
        }
    }

    async function loadRouteModule(route, routeModulesCache) {
        if (route.id in routeModulesCache) {
            return routeModulesCache[route.id];
        }
        try {
            let routeModule = await import(
            /* @vite-ignore */
            /* webpackIgnore: true */
            route.module);
            routeModulesCache[route.id] = routeModule;
            return routeModule;
        }
        catch (error) {
            // If we can't load the route it's likely one of 2 things:
            // - User got caught in the middle of a deploy and the CDN no longer has the
            //   asset we're trying to import! Reload from the server and the user
            //   (should) get the new manifest--unless the developer purged the static
            //   assets, the manifest path, but not the documents 😬
            // - Or, the asset trying to be imported has an error (usually in vite dev
            //   mode), so the best we can do here is log the error for visibility
            //   (via `Preserve log`) and reload
            // Log the error so it can be accessed via the `Preserve Log` setting
            console.error(`Error loading route module \`${route.module}\`, reloading page...`);
            console.error(error);
            if (window.__reactRouterContext &&
                window.__reactRouterContext.isSpaMode &&
                // @ts-expect-error
                undefined) {
                // In SPA Mode (which implies vite) we don't want to perform a hard reload
                // on dev-time errors since it's a vite compilation error and a reload is
                // just going to fail with the same issue.  Let the UI bubble to the error
                // boundary and let them see the error in the overlay or the dev server log
                throw error;
            }
            window.location.reload();
            return new Promise(() => {
                // check out of this hook cause the DJs never gonna re[s]olve this
            });
        }
    }

    /**
     * Gets all the links for a set of matches. The modules are assumed to have been
     * loaded already.
     */
    function getKeyedLinksForMatches(matches, routeModules, manifest) {
        let descriptors = matches
            .map((match) => {
            let module = routeModules[match.route.id];
            let route = manifest.routes[match.route.id];
            return [
                route && route.css
                    ? route.css.map((href) => ({ rel: "stylesheet", href }))
                    : [],
                module?.links?.() || [],
            ];
        })
            .flat(2);
        let preloads = getModuleLinkHrefs(matches, manifest);
        return dedupeLinkDescriptors(descriptors, preloads);
    }
    function getRouteCssDescriptors(route) {
        if (!route.css)
            return [];
        return route.css.map((href) => ({ rel: "stylesheet", href }));
    }
    async function prefetchRouteCss(route) {
        if (!route.css)
            return;
        let descriptors = getRouteCssDescriptors(route);
        await Promise.all(descriptors.map(prefetchStyleLink));
    }
    async function prefetchStyleLinks(route, routeModule) {
        if ((!route.css && !routeModule.links) || !isPreloadSupported())
            return;
        let descriptors = [];
        if (route.css) {
            descriptors.push(...getRouteCssDescriptors(route));
        }
        if (routeModule.links) {
            descriptors.push(...routeModule.links());
        }
        if (descriptors.length === 0)
            return;
        let styleLinks = [];
        for (let descriptor of descriptors) {
            if (!isPageLinkDescriptor(descriptor) && descriptor.rel === "stylesheet") {
                styleLinks.push({
                    ...descriptor,
                    rel: "preload",
                    as: "style",
                });
            }
        }
        await Promise.all(styleLinks.map(prefetchStyleLink));
    }
    async function prefetchStyleLink(descriptor) {
        return new Promise((resolve) => {
            // don't prefetch non-matching media queries, or stylesheets that are
            // already in the DOM (active route revalidations)
            if ((descriptor.media && !window.matchMedia(descriptor.media).matches) ||
                document.querySelector(`link[rel="stylesheet"][href="${descriptor.href}"]`)) {
                return resolve();
            }
            let link = document.createElement("link");
            Object.assign(link, descriptor);
            function removeLink() {
                // if a navigation interrupts this prefetch React will update the <head>
                // and remove the link we put in there manually, so we check if it's still
                // there before trying to remove it
                if (document.head.contains(link)) {
                    document.head.removeChild(link);
                }
            }
            link.onload = () => {
                removeLink();
                resolve();
            };
            link.onerror = () => {
                removeLink();
                resolve();
            };
            document.head.appendChild(link);
        });
    }
    ////////////////////////////////////////////////////////////////////////////////
    function isPageLinkDescriptor(object) {
        return object != null && typeof object.page === "string";
    }
    function isHtmlLinkDescriptor(object) {
        if (object == null) {
            return false;
        }
        // <link> may not have an href if <link rel="preload"> is used with imageSrcSet + imageSizes
        // https://github.com/remix-run/remix/issues/184
        // https://html.spec.whatwg.org/commit-snapshots/cb4f5ff75de5f4cbd7013c4abad02f21c77d4d1c/#attr-link-imagesrcset
        if (object.href == null) {
            return (object.rel === "preload" &&
                typeof object.imageSrcSet === "string" &&
                typeof object.imageSizes === "string");
        }
        return typeof object.rel === "string" && typeof object.href === "string";
    }
    async function getKeyedPrefetchLinks(matches, manifest, routeModules) {
        let links = await Promise.all(matches.map(async (match) => {
            let route = manifest.routes[match.route.id];
            if (route) {
                let mod = await loadRouteModule(route, routeModules);
                return mod.links ? mod.links() : [];
            }
            return [];
        }));
        return dedupeLinkDescriptors(links
            .flat(1)
            .filter(isHtmlLinkDescriptor)
            .filter((link) => link.rel === "stylesheet" || link.rel === "preload")
            .map((link) => link.rel === "stylesheet"
            ? { ...link, rel: "prefetch", as: "style" }
            : { ...link, rel: "prefetch" }));
    }
    // This is ridiculously identical to transition.ts `filterMatchesToLoad`
    function getNewMatchesForLinks(page, nextMatches, currentMatches, manifest, location, mode) {
        let isNew = (match, index) => {
            if (!currentMatches[index])
                return true;
            return match.route.id !== currentMatches[index].route.id;
        };
        let matchPathChanged = (match, index) => {
            return (
            // param change, /users/123 -> /users/456
            currentMatches[index].pathname !== match.pathname ||
                // splat param changed, which is not present in match.path
                // e.g. /files/images/avatar.jpg -> files/finances.xls
                (currentMatches[index].route.path?.endsWith("*") &&
                    currentMatches[index].params["*"] !== match.params["*"]));
        };
        if (mode === "assets") {
            return nextMatches.filter((match, index) => isNew(match, index) || matchPathChanged(match, index));
        }
        // NOTE: keep this mostly up-to-date w/ the router data diff, but this
        // version doesn't care about submissions
        // TODO: this is really similar to stuff in router.ts, maybe somebody smarter
        // than me (or in less of a hurry) can share some of it. You're the best.
        if (mode === "data") {
            return nextMatches.filter((match, index) => {
                let manifestRoute = manifest.routes[match.route.id];
                if (!manifestRoute || !manifestRoute.hasLoader) {
                    return false;
                }
                if (isNew(match, index) || matchPathChanged(match, index)) {
                    return true;
                }
                if (match.route.shouldRevalidate) {
                    let routeChoice = match.route.shouldRevalidate({
                        currentUrl: new URL(location.pathname + location.search + location.hash, window.origin),
                        currentParams: currentMatches[0]?.params || {},
                        nextUrl: new URL(page, window.origin),
                        nextParams: match.params,
                        defaultShouldRevalidate: true,
                    });
                    if (typeof routeChoice === "boolean") {
                        return routeChoice;
                    }
                }
                return true;
            });
        }
        return [];
    }
    function getModuleLinkHrefs(matches, manifest, { includeHydrateFallback } = {}) {
        return dedupeHrefs(matches
            .map((match) => {
            let route = manifest.routes[match.route.id];
            if (!route)
                return [];
            let hrefs = [route.module];
            if (route.clientActionModule) {
                hrefs = hrefs.concat(route.clientActionModule);
            }
            if (route.clientLoaderModule) {
                hrefs = hrefs.concat(route.clientLoaderModule);
            }
            if (includeHydrateFallback && route.hydrateFallbackModule) {
                hrefs = hrefs.concat(route.hydrateFallbackModule);
            }
            if (route.imports) {
                hrefs = hrefs.concat(route.imports);
            }
            return hrefs;
        })
            .flat(1));
    }
    function dedupeHrefs(hrefs) {
        return [...new Set(hrefs)];
    }
    function sortKeys(obj) {
        let sorted = {};
        let keys = Object.keys(obj).sort();
        for (let key of keys) {
            sorted[key] = obj[key];
        }
        return sorted;
    }
    function dedupeLinkDescriptors(descriptors, preloads) {
        let set = new Set();
        let preloadsSet = new Set(preloads);
        return descriptors.reduce((deduped, descriptor) => {
            let alreadyModulePreload = preloads &&
                !isPageLinkDescriptor(descriptor) &&
                descriptor.as === "script" &&
                descriptor.href &&
                preloadsSet.has(descriptor.href);
            if (alreadyModulePreload) {
                return deduped;
            }
            let key = JSON.stringify(sortKeys(descriptor));
            if (!set.has(key)) {
                set.add(key);
                deduped.push({ key, link: descriptor });
            }
            return deduped;
        }, []);
    }
    // Detect if this browser supports <link rel="preload"> (or has it enabled).
    // Originally added to handle the firefox `network.preload` config:
    //   https://bugzilla.mozilla.org/show_bug.cgi?id=1847811
    let _isPreloadSupported;
    function isPreloadSupported() {
        if (_isPreloadSupported !== undefined) {
            return _isPreloadSupported;
        }
        let el = document.createElement("link");
        _isPreloadSupported = el.relList.supports("preload");
        el = null;
        return _isPreloadSupported;
    }

    // This escapeHtml utility is based on https://github.com/zertosh/htmlescape
    // License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE
    // We've chosen to inline the utility here to reduce the number of npm dependencies we have,
    // slightly decrease the code size compared the original package and make it esm compatible.
    const ESCAPE_LOOKUP$2 = {
        "&": "\\u0026",
        ">": "\\u003e",
        "<": "\\u003c",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029",
    };
    const ESCAPE_REGEX$2 = /[&><\u2028\u2029]/g;
    function escapeHtml$1(html) {
        return html.replace(ESCAPE_REGEX$2, (match) => ESCAPE_LOOKUP$2[match]);
    }
    function createHtml(html) {
        return { __html: html };
    }

    // src/utils.ts
    var HOLE = -1;
    var NAN = -2;
    var NEGATIVE_INFINITY = -3;
    var NEGATIVE_ZERO = -4;
    var NULL = -5;
    var POSITIVE_INFINITY = -6;
    var UNDEFINED = -7;
    var TYPE_BIGINT = "B";
    var TYPE_DATE = "D";
    var TYPE_ERROR = "E";
    var TYPE_MAP = "M";
    var TYPE_NULL_OBJECT = "N";
    var TYPE_PROMISE = "P";
    var TYPE_REGEXP = "R";
    var TYPE_SET = "S";
    var TYPE_SYMBOL = "Y";
    var TYPE_URL = "U";
    var TYPE_PREVIOUS_RESOLVED = "Z";
    var Deferred = class {
      promise;
      resolve;
      reject;
      constructor() {
        this.promise = new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
        });
      }
    };
    function createLineSplittingTransform() {
      const decoder = new TextDecoder();
      let leftover = "";
      return new TransformStream({
        transform(chunk, controller) {
          const str = decoder.decode(chunk, { stream: true });
          const parts = (leftover + str).split("\n");
          leftover = parts.pop() || "";
          for (const part of parts) {
            controller.enqueue(part);
          }
        },
        flush(controller) {
          if (leftover) {
            controller.enqueue(leftover);
          }
        }
      });
    }

    // src/flatten.ts
    function flatten(input) {
      const { indices } = this;
      const existing = indices.get(input);
      if (existing)
        return [existing];
      if (input === void 0)
        return UNDEFINED;
      if (input === null)
        return NULL;
      if (Number.isNaN(input))
        return NAN;
      if (input === Number.POSITIVE_INFINITY)
        return POSITIVE_INFINITY;
      if (input === Number.NEGATIVE_INFINITY)
        return NEGATIVE_INFINITY;
      if (input === 0 && 1 / input < 0)
        return NEGATIVE_ZERO;
      const index = this.index++;
      indices.set(input, index);
      stringify.call(this, input, index);
      return index;
    }
    function stringify(input, index) {
      const { deferred, plugins, postPlugins } = this;
      const str = this.stringified;
      const stack = [[input, index]];
      while (stack.length > 0) {
        const [input2, index2] = stack.pop();
        const partsForObj = (obj) => Object.keys(obj).map((k) => `"_${flatten.call(this, k)}":${flatten.call(this, obj[k])}`).join(",");
        let error = null;
        switch (typeof input2) {
          case "boolean":
          case "number":
          case "string":
            str[index2] = JSON.stringify(input2);
            break;
          case "bigint":
            str[index2] = `["${TYPE_BIGINT}","${input2}"]`;
            break;
          case "symbol": {
            const keyFor = Symbol.keyFor(input2);
            if (!keyFor) {
              error = new Error(
                "Cannot encode symbol unless created with Symbol.for()"
              );
            } else {
              str[index2] = `["${TYPE_SYMBOL}",${JSON.stringify(keyFor)}]`;
            }
            break;
          }
          case "object": {
            if (!input2) {
              str[index2] = `${NULL}`;
              break;
            }
            const isArray = Array.isArray(input2);
            let pluginHandled = false;
            if (!isArray && plugins) {
              for (const plugin of plugins) {
                const pluginResult = plugin(input2);
                if (Array.isArray(pluginResult)) {
                  pluginHandled = true;
                  const [pluginIdentifier, ...rest] = pluginResult;
                  str[index2] = `[${JSON.stringify(pluginIdentifier)}`;
                  if (rest.length > 0) {
                    str[index2] += `,${rest.map((v) => flatten.call(this, v)).join(",")}`;
                  }
                  str[index2] += "]";
                  break;
                }
              }
            }
            if (!pluginHandled) {
              let result = isArray ? "[" : "{";
              if (isArray) {
                for (let i = 0; i < input2.length; i++)
                  result += (i ? "," : "") + (i in input2 ? flatten.call(this, input2[i]) : HOLE);
                str[index2] = `${result}]`;
              } else if (input2 instanceof Date) {
                str[index2] = `["${TYPE_DATE}",${input2.getTime()}]`;
              } else if (input2 instanceof URL) {
                str[index2] = `["${TYPE_URL}",${JSON.stringify(input2.href)}]`;
              } else if (input2 instanceof RegExp) {
                str[index2] = `["${TYPE_REGEXP}",${JSON.stringify(
              input2.source
            )},${JSON.stringify(input2.flags)}]`;
              } else if (input2 instanceof Set) {
                if (input2.size > 0) {
                  str[index2] = `["${TYPE_SET}",${[...input2].map((val) => flatten.call(this, val)).join(",")}]`;
                } else {
                  str[index2] = `["${TYPE_SET}"]`;
                }
              } else if (input2 instanceof Map) {
                if (input2.size > 0) {
                  str[index2] = `["${TYPE_MAP}",${[...input2].flatMap(([k, v]) => [
                flatten.call(this, k),
                flatten.call(this, v)
              ]).join(",")}]`;
                } else {
                  str[index2] = `["${TYPE_MAP}"]`;
                }
              } else if (input2 instanceof Promise) {
                str[index2] = `["${TYPE_PROMISE}",${index2}]`;
                deferred[index2] = input2;
              } else if (input2 instanceof Error) {
                str[index2] = `["${TYPE_ERROR}",${JSON.stringify(input2.message)}`;
                if (input2.name !== "Error") {
                  str[index2] += `,${JSON.stringify(input2.name)}`;
                }
                str[index2] += "]";
              } else if (Object.getPrototypeOf(input2) === null) {
                str[index2] = `["${TYPE_NULL_OBJECT}",{${partsForObj(input2)}}]`;
              } else if (isPlainObject(input2)) {
                str[index2] = `{${partsForObj(input2)}}`;
              } else {
                error = new Error("Cannot encode object with prototype");
              }
            }
            break;
          }
          default: {
            const isArray = Array.isArray(input2);
            let pluginHandled = false;
            if (!isArray && plugins) {
              for (const plugin of plugins) {
                const pluginResult = plugin(input2);
                if (Array.isArray(pluginResult)) {
                  pluginHandled = true;
                  const [pluginIdentifier, ...rest] = pluginResult;
                  str[index2] = `[${JSON.stringify(pluginIdentifier)}`;
                  if (rest.length > 0) {
                    str[index2] += `,${rest.map((v) => flatten.call(this, v)).join(",")}`;
                  }
                  str[index2] += "]";
                  break;
                }
              }
            }
            if (!pluginHandled) {
              error = new Error("Cannot encode function or unexpected type");
            }
          }
        }
        if (error) {
          let pluginHandled = false;
          if (postPlugins) {
            for (const plugin of postPlugins) {
              const pluginResult = plugin(input2);
              if (Array.isArray(pluginResult)) {
                pluginHandled = true;
                const [pluginIdentifier, ...rest] = pluginResult;
                str[index2] = `[${JSON.stringify(pluginIdentifier)}`;
                if (rest.length > 0) {
                  str[index2] += `,${rest.map((v) => flatten.call(this, v)).join(",")}`;
                }
                str[index2] += "]";
                break;
              }
            }
          }
          if (!pluginHandled) {
            throw error;
          }
        }
      }
    }
    var objectProtoNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
    function isPlainObject(thing) {
      const proto = Object.getPrototypeOf(thing);
      return proto === Object.prototype || proto === null || Object.getOwnPropertyNames(proto).sort().join("\0") === objectProtoNames;
    }

    // src/unflatten.ts
    var globalObj = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : void 0;
    function unflatten(parsed) {
      const { hydrated, values } = this;
      if (typeof parsed === "number")
        return hydrate.call(this, parsed);
      if (!Array.isArray(parsed) || !parsed.length)
        throw new SyntaxError();
      const startIndex = values.length;
      for (const value of parsed) {
        values.push(value);
      }
      hydrated.length = values.length;
      return hydrate.call(this, startIndex);
    }
    function hydrate(index) {
      const { hydrated, values, deferred, plugins } = this;
      let result;
      const stack = [
        [
          index,
          (v) => {
            result = v;
          }
        ]
      ];
      let postRun = [];
      while (stack.length > 0) {
        const [index2, set] = stack.pop();
        switch (index2) {
          case UNDEFINED:
            set(void 0);
            continue;
          case NULL:
            set(null);
            continue;
          case NAN:
            set(NaN);
            continue;
          case POSITIVE_INFINITY:
            set(Infinity);
            continue;
          case NEGATIVE_INFINITY:
            set(-Infinity);
            continue;
          case NEGATIVE_ZERO:
            set(-0);
            continue;
        }
        if (hydrated[index2]) {
          set(hydrated[index2]);
          continue;
        }
        const value = values[index2];
        if (!value || typeof value !== "object") {
          hydrated[index2] = value;
          set(value);
          continue;
        }
        if (Array.isArray(value)) {
          if (typeof value[0] === "string") {
            const [type, b, c] = value;
            switch (type) {
              case TYPE_DATE:
                set(hydrated[index2] = new Date(b));
                continue;
              case TYPE_URL:
                set(hydrated[index2] = new URL(b));
                continue;
              case TYPE_BIGINT:
                set(hydrated[index2] = BigInt(b));
                continue;
              case TYPE_REGEXP:
                set(hydrated[index2] = new RegExp(b, c));
                continue;
              case TYPE_SYMBOL:
                set(hydrated[index2] = Symbol.for(b));
                continue;
              case TYPE_SET:
                const newSet = /* @__PURE__ */ new Set();
                hydrated[index2] = newSet;
                for (let i = 1; i < value.length; i++)
                  stack.push([
                    value[i],
                    (v) => {
                      newSet.add(v);
                    }
                  ]);
                set(newSet);
                continue;
              case TYPE_MAP:
                const map = /* @__PURE__ */ new Map();
                hydrated[index2] = map;
                for (let i = 1; i < value.length; i += 2) {
                  const r = [];
                  stack.push([
                    value[i + 1],
                    (v) => {
                      r[1] = v;
                    }
                  ]);
                  stack.push([
                    value[i],
                    (k) => {
                      r[0] = k;
                    }
                  ]);
                  postRun.push(() => {
                    map.set(r[0], r[1]);
                  });
                }
                set(map);
                continue;
              case TYPE_NULL_OBJECT:
                const obj = /* @__PURE__ */ Object.create(null);
                hydrated[index2] = obj;
                for (const key of Object.keys(b).reverse()) {
                  const r = [];
                  stack.push([
                    b[key],
                    (v) => {
                      r[1] = v;
                    }
                  ]);
                  stack.push([
                    Number(key.slice(1)),
                    (k) => {
                      r[0] = k;
                    }
                  ]);
                  postRun.push(() => {
                    obj[r[0]] = r[1];
                  });
                }
                set(obj);
                continue;
              case TYPE_PROMISE:
                if (hydrated[b]) {
                  set(hydrated[index2] = hydrated[b]);
                } else {
                  const d = new Deferred();
                  deferred[b] = d;
                  set(hydrated[index2] = d.promise);
                }
                continue;
              case TYPE_ERROR:
                const [, message, errorType] = value;
                let error = errorType && globalObj && globalObj[errorType] ? new globalObj[errorType](message) : new Error(message);
                hydrated[index2] = error;
                set(error);
                continue;
              case TYPE_PREVIOUS_RESOLVED:
                set(hydrated[index2] = hydrated[b]);
                continue;
              default:
                if (Array.isArray(plugins)) {
                  const r = [];
                  const vals = value.slice(1);
                  for (let i = 0; i < vals.length; i++) {
                    const v = vals[i];
                    stack.push([
                      v,
                      (v2) => {
                        r[i] = v2;
                      }
                    ]);
                  }
                  postRun.push(() => {
                    for (const plugin of plugins) {
                      const result2 = plugin(value[0], ...r);
                      if (result2) {
                        set(hydrated[index2] = result2.value);
                        return;
                      }
                    }
                    throw new SyntaxError();
                  });
                  continue;
                }
                throw new SyntaxError();
            }
          } else {
            const array = [];
            hydrated[index2] = array;
            for (let i = 0; i < value.length; i++) {
              const n = value[i];
              if (n !== HOLE) {
                stack.push([
                  n,
                  (v) => {
                    array[i] = v;
                  }
                ]);
              }
            }
            set(array);
            continue;
          }
        } else {
          const object = {};
          hydrated[index2] = object;
          for (const key of Object.keys(value).reverse()) {
            const r = [];
            stack.push([
              value[key],
              (v) => {
                r[1] = v;
              }
            ]);
            stack.push([
              Number(key.slice(1)),
              (k) => {
                r[0] = k;
              }
            ]);
            postRun.push(() => {
              object[r[0]] = r[1];
            });
          }
          set(object);
          continue;
        }
      }
      while (postRun.length > 0) {
        postRun.pop()();
      }
      return result;
    }

    // src/turbo-stream.ts
    async function decode(readable, options) {
      const { plugins } = options ?? {};
      const done = new Deferred();
      const reader = readable.pipeThrough(createLineSplittingTransform()).getReader();
      const decoder = {
        values: [],
        hydrated: [],
        deferred: {},
        plugins
      };
      const decoded = await decodeInitial.call(decoder, reader);
      let donePromise = done.promise;
      if (decoded.done) {
        done.resolve();
      } else {
        donePromise = decodeDeferred.call(decoder, reader).then(done.resolve).catch((reason) => {
          for (const deferred of Object.values(decoder.deferred)) {
            deferred.reject(reason);
          }
          done.reject(reason);
        });
      }
      return {
        done: donePromise.then(() => reader.closed),
        value: decoded.value
      };
    }
    async function decodeInitial(reader) {
      const read = await reader.read();
      if (!read.value) {
        throw new SyntaxError();
      }
      let line;
      try {
        line = JSON.parse(read.value);
      } catch (reason) {
        throw new SyntaxError();
      }
      return {
        done: read.done,
        value: unflatten.call(this, line)
      };
    }
    async function decodeDeferred(reader) {
      let read = await reader.read();
      while (!read.done) {
        if (!read.value)
          continue;
        const line = read.value;
        switch (line[0]) {
          case TYPE_PROMISE: {
            const colonIndex = line.indexOf(":");
            const deferredId = Number(line.slice(1, colonIndex));
            const deferred = this.deferred[deferredId];
            if (!deferred) {
              throw new Error(`Deferred ID ${deferredId} not found in stream`);
            }
            const lineData = line.slice(colonIndex + 1);
            let jsonLine;
            try {
              jsonLine = JSON.parse(lineData);
            } catch (reason) {
              throw new SyntaxError();
            }
            const value = unflatten.call(this, jsonLine);
            deferred.resolve(value);
            break;
          }
          case TYPE_ERROR: {
            const colonIndex = line.indexOf(":");
            const deferredId = Number(line.slice(1, colonIndex));
            const deferred = this.deferred[deferredId];
            if (!deferred) {
              throw new Error(`Deferred ID ${deferredId} not found in stream`);
            }
            const lineData = line.slice(colonIndex + 1);
            let jsonLine;
            try {
              jsonLine = JSON.parse(lineData);
            } catch (reason) {
              throw new SyntaxError();
            }
            const value = unflatten.call(this, jsonLine);
            deferred.reject(value);
            break;
          }
          default:
            throw new SyntaxError();
        }
        read = await reader.read();
      }
    }
    function encode(input, options) {
      const { plugins, postPlugins, signal } = options ?? {};
      const encoder = {
        deferred: {},
        index: 0,
        indices: /* @__PURE__ */ new Map(),
        stringified: [],
        plugins,
        postPlugins,
        signal
      };
      const textEncoder = new TextEncoder();
      let lastSentIndex = 0;
      const readable = new ReadableStream({
        async start(controller) {
          const id = flatten.call(encoder, input);
          if (Array.isArray(id)) {
            throw new Error("This should never happen");
          }
          if (id < 0) {
            controller.enqueue(textEncoder.encode(`${id}
`));
          } else {
            controller.enqueue(
              textEncoder.encode(`[${encoder.stringified.join(",")}]
`)
            );
            lastSentIndex = encoder.stringified.length - 1;
          }
          const seenPromises = /* @__PURE__ */ new WeakSet();
          while (Object.keys(encoder.deferred).length > 0) {
            for (const [deferredId, deferred] of Object.entries(encoder.deferred)) {
              if (seenPromises.has(deferred))
                continue;
              seenPromises.add(
                encoder.deferred[Number(deferredId)] = raceSignal(
                  deferred,
                  encoder.signal
                ).then(
                  (resolved) => {
                    const id2 = flatten.call(encoder, resolved);
                    if (Array.isArray(id2)) {
                      controller.enqueue(
                        textEncoder.encode(
                          `${TYPE_PROMISE}${deferredId}:[["${TYPE_PREVIOUS_RESOLVED}",${id2[0]}]]
`
                        )
                      );
                      encoder.index++;
                      lastSentIndex++;
                    } else if (id2 < 0) {
                      controller.enqueue(
                        textEncoder.encode(`${TYPE_PROMISE}${deferredId}:${id2}
`)
                      );
                    } else {
                      const values = encoder.stringified.slice(lastSentIndex + 1).join(",");
                      controller.enqueue(
                        textEncoder.encode(
                          `${TYPE_PROMISE}${deferredId}:[${values}]
`
                        )
                      );
                      lastSentIndex = encoder.stringified.length - 1;
                    }
                  },
                  (reason) => {
                    if (!reason || typeof reason !== "object" || !(reason instanceof Error)) {
                      reason = new Error("An unknown error occurred");
                    }
                    const id2 = flatten.call(encoder, reason);
                    if (Array.isArray(id2)) {
                      controller.enqueue(
                        textEncoder.encode(
                          `${TYPE_ERROR}${deferredId}:[["${TYPE_PREVIOUS_RESOLVED}",${id2[0]}]]
`
                        )
                      );
                      encoder.index++;
                      lastSentIndex++;
                    } else if (id2 < 0) {
                      controller.enqueue(
                        textEncoder.encode(`${TYPE_ERROR}${deferredId}:${id2}
`)
                      );
                    } else {
                      const values = encoder.stringified.slice(lastSentIndex + 1).join(",");
                      controller.enqueue(
                        textEncoder.encode(
                          `${TYPE_ERROR}${deferredId}:[${values}]
`
                        )
                      );
                      lastSentIndex = encoder.stringified.length - 1;
                    }
                  }
                ).finally(() => {
                  delete encoder.deferred[Number(deferredId)];
                })
              );
            }
            await Promise.race(Object.values(encoder.deferred));
          }
          await Promise.all(Object.values(encoder.deferred));
          controller.close();
        }
      });
      return readable;
    }
    function raceSignal(promise, signal) {
      if (!signal)
        return promise;
      if (signal.aborted)
        return Promise.reject(signal.reason || new Error("Signal was aborted."));
      const abort = new Promise((resolve, reject) => {
        signal.addEventListener("abort", (event) => {
          reject(signal.reason || new Error("Signal was aborted."));
        });
        promise.then(resolve).catch(reject);
      });
      abort.catch(() => {
      });
      return Promise.race([abort, promise]);
    }

    async function createRequestInit(request) {
        let init = { signal: request.signal };
        if (request.method !== "GET") {
            init.method = request.method;
            let contentType = request.headers.get("Content-Type");
            // Check between word boundaries instead of startsWith() due to the last
            // paragraph of https://httpwg.org/specs/rfc9110.html#field.content-type
            if (contentType && /\bapplication\/json\b/.test(contentType)) {
                init.headers = { "Content-Type": contentType };
                init.body = JSON.stringify(await request.json());
            }
            else if (contentType && /\btext\/plain\b/.test(contentType)) {
                init.headers = { "Content-Type": contentType };
                init.body = await request.text();
            }
            else if (contentType &&
                /\bapplication\/x-www-form-urlencoded\b/.test(contentType)) {
                init.body = new URLSearchParams(await request.text());
            }
            else {
                init.body = await request.formData();
            }
        }
        return init;
    }

    const SingleFetchRedirectSymbol = Symbol("SingleFetchRedirect");
    // StreamTransfer recursively renders down chunks of the `serverHandoffStream`
    // into the client-side `streamController`
    function StreamTransfer({ context, identifier, reader, textDecoder, nonce, }) {
        // If the user didn't render the <Scripts> component then we don't have to
        // bother streaming anything in
        if (!context.renderMeta || !context.renderMeta.didRenderScripts) {
            return null;
        }
        if (!context.renderMeta.streamCache) {
            context.renderMeta.streamCache = {};
        }
        let { streamCache } = context.renderMeta;
        let promise = streamCache[identifier];
        if (!promise) {
            promise = streamCache[identifier] = reader
                .read()
                .then((result) => {
                streamCache[identifier].result = {
                    done: result.done,
                    value: textDecoder.decode(result.value, { stream: true }),
                };
            })
                .catch((e) => {
                streamCache[identifier].error = e;
            });
        }
        if (promise.error) {
            throw promise.error;
        }
        if (promise.result === undefined) {
            throw promise;
        }
        let { done, value } = promise.result;
        let scriptTag = value ? (React__namespace.createElement("script", { nonce: nonce, dangerouslySetInnerHTML: {
                __html: `window.__reactRouterContext.streamController.enqueue(${escapeHtml$1(JSON.stringify(value))});`,
            } })) : null;
        if (done) {
            return (React__namespace.createElement(React__namespace.Fragment, null,
                scriptTag,
                React__namespace.createElement("script", { nonce: nonce, dangerouslySetInnerHTML: {
                        __html: `window.__reactRouterContext.streamController.close();`,
                    } })));
        }
        else {
            return (React__namespace.createElement(React__namespace.Fragment, null,
                scriptTag,
                React__namespace.createElement(React__namespace.Suspense, null,
                    React__namespace.createElement(StreamTransfer, { context: context, identifier: identifier + 1, reader: reader, textDecoder: textDecoder, nonce: nonce }))));
        }
    }
    function handleMiddlewareError(error, routeId) {
        return { [routeId]: { type: "error", result: error } };
    }
    function getSingleFetchDataStrategy(manifest, routeModules, ssr, basename, getRouter) {
        return async (args) => {
            let { request, matches, fetcherKey } = args;
            // Actions are simple and behave the same for navigations and fetchers
            if (request.method !== "GET") {
                return runMiddlewarePipeline(args, false, () => singleFetchActionStrategy(request, matches, basename), handleMiddlewareError);
            }
            // TODO: Enable middleware for this flow
            if (!ssr) {
                // If this is SPA mode, there won't be any loaders below root and we'll
                // disable single fetch.  We have to keep the `dataStrategy` defined for
                // SPA mode because we may load a SPA fallback page but then navigate into
                // a pre-rendered path and need to fetch the pre-rendered `.data` file.
                //
                // If this is `ssr:false` with a `prerender` config, we need to keep single
                // fetch enabled because we can prerender the `.data` files at build time
                // and load them from a static file server/CDN at runtime.
                //
                // However, with the SPA Fallback logic, we can have SPA routes operating
                // alongside pre-rendered routes.  If any pre-rendered routes have a
                // `loader` then the default behavior would be to make the single fetch
                // `.data` request on navigation to get the updated root/parent route
                // `loader` data.
                //
                // We need to detect these scenarios because if it's a non-pre-rendered
                // route being handled by SPA mode, then the `.data` file won't have been
                // pre-generated and it'll cause a 404.  Thankfully, we can do this
                // without knowing the prerender'd paths and can just do loader detection
                // from the manifest:
                //
                // - We only allow loaders on pre-rendered routes at build time
                // - We opt out of revalidation automatically for routes with a `loader`
                //   and no `clientLoader` because the data is static
                // - So if no routes with a server `loader` need to revalidate we can just
                //   call the normal resolve functions and short circuit any single fetch
                //   behavior
                // - If we find this a loader that needs to be called, we know the route must
                //   have been pre-rendered at build time since the loader would have
                //   errored otherwise
                // - So it's safe to make the call knowing there will be a `.data` file on
                //   the other end
                let foundRevalidatingServerLoader = matches.some((m) => m.shouldLoad &&
                    manifest.routes[m.route.id]?.hasLoader &&
                    !manifest.routes[m.route.id]?.hasClientLoader);
                if (!foundRevalidatingServerLoader) {
                    return runMiddlewarePipeline(args, false, () => nonSsrStrategy(manifest, request, matches, basename), handleMiddlewareError);
                }
            }
            // Fetcher loads are singular calls to one loader
            if (fetcherKey) {
                return runMiddlewarePipeline(args, false, () => singleFetchLoaderFetcherStrategy(request, matches, basename), handleMiddlewareError);
            }
            // Navigational loads are more complex...
            return runMiddlewarePipeline(args, false, () => singleFetchLoaderNavigationStrategy(manifest, routeModules, ssr, getRouter(), request, matches, basename), handleMiddlewareError);
        };
    }
    // Actions are simple since they're singular calls to the server for both
    // navigations and fetchers)
    async function singleFetchActionStrategy(request, matches, basename) {
        let actionMatch = matches.find((m) => m.shouldLoad);
        invariant$1(actionMatch, "No action match found");
        let actionStatus = undefined;
        let result = await actionMatch.resolve(async (handler) => {
            let result = await handler(async () => {
                let url = singleFetchUrl(request.url, basename);
                let init = await createRequestInit(request);
                let { data, status } = await fetchAndDecode(url, init);
                actionStatus = status;
                return unwrapSingleFetchResult(data, actionMatch.route.id);
            });
            return result;
        });
        if (isResponse(result.result) || isRouteErrorResponse(result.result)) {
            return { [actionMatch.route.id]: result };
        }
        // For non-responses, proxy along the statusCode via data()
        // (most notably for skipping action error revalidation)
        return {
            [actionMatch.route.id]: {
                type: result.type,
                result: data(result.result, actionStatus),
            },
        };
    }
    // We want to opt-out of Single Fetch when we aren't in SSR mode
    async function nonSsrStrategy(manifest, request, matches, basename) {
        let matchesToLoad = matches.filter((m) => m.shouldLoad);
        let url = stripIndexParam$1(singleFetchUrl(request.url, basename));
        let init = await createRequestInit(request);
        let results = {};
        await Promise.all(matchesToLoad.map((m) => m.resolve(async (handler) => {
            try {
                // Need to pass through a `singleFetch` override handler so
                // clientLoader's can still call server loaders through `.data`
                // requests
                let result = manifest.routes[m.route.id]?.hasClientLoader
                    ? await fetchSingleLoader(handler, url, init, m.route.id)
                    : await handler();
                results[m.route.id] = { type: "data", result };
            }
            catch (e) {
                results[m.route.id] = { type: "error", result: e };
            }
        })));
        return results;
    }
    // Loaders are trickier since we only want to hit the server once, so we
    // create a singular promise for all server-loader routes to latch onto.
    async function singleFetchLoaderNavigationStrategy(manifest, routeModules, ssr, router, request, matches, basename) {
        // Track which routes need a server load - in case we need to tack on a
        // `_routes` param
        let routesParams = new Set();
        // We only add `_routes` when one or more routes opts out of a load via
        // `shouldRevalidate` or `clientLoader`
        let foundOptOutRoute = false;
        // Deferreds for each route so we can be sure they've all loaded via
        // `match.resolve()`, and a singular promise that can tell us all routes
        // have been resolved
        let routeDfds = matches.map(() => createDeferred());
        let routesLoadedPromise = Promise.all(routeDfds.map((d) => d.promise));
        // Deferred that we'll use for the call to the server that each match can
        // await and parse out it's specific result
        let singleFetchDfd = createDeferred();
        // Base URL and RequestInit for calls to the server
        let url = stripIndexParam$1(singleFetchUrl(request.url, basename));
        let init = await createRequestInit(request);
        // We'll build up this results object as we loop through matches
        let results = {};
        let resolvePromise = Promise.all(matches.map(async (m, i) => m.resolve(async (handler) => {
            routeDfds[i].resolve();
            let manifestRoute = manifest.routes[m.route.id];
            // Note: If this logic changes for routes that should not participate
            // in Single Fetch, make sure you update getLowestLoadingIndex above
            // as well
            if (!m.shouldLoad) {
                // If we're not yet initialized and this is the initial load, respect
                // `shouldLoad` because we're only dealing with `clientLoader.hydrate`
                // routes which will fall into the `clientLoader` section below.
                if (!router.state.initialized) {
                    return;
                }
                // Otherwise, we opt out if we currently have data and a
                // `shouldRevalidate` function.  This implies that the user opted out
                // via `shouldRevalidate`
                if (m.route.id in router.state.loaderData &&
                    manifestRoute &&
                    m.route.shouldRevalidate) {
                    if (manifestRoute.hasLoader) {
                        // If we have a server loader, make sure we don't include it in the
                        // single fetch .data request
                        foundOptOutRoute = true;
                    }
                    return;
                }
            }
            // When a route has a client loader, it opts out of the singular call and
            // calls it's server loader via `serverLoader()` using a `?_routes` param
            if (manifestRoute && manifestRoute.hasClientLoader) {
                if (manifestRoute.hasLoader) {
                    foundOptOutRoute = true;
                }
                try {
                    let result = await fetchSingleLoader(handler, url, init, m.route.id);
                    results[m.route.id] = { type: "data", result };
                }
                catch (e) {
                    results[m.route.id] = { type: "error", result: e };
                }
                return;
            }
            // Load this route on the server if it has a loader
            if (manifestRoute && manifestRoute.hasLoader) {
                routesParams.add(m.route.id);
            }
            // Lump this match in with the others on a singular promise
            try {
                let result = await handler(async () => {
                    let data = await singleFetchDfd.promise;
                    return unwrapSingleFetchResults(data, m.route.id);
                });
                results[m.route.id] = {
                    type: "data",
                    result,
                };
            }
            catch (e) {
                results[m.route.id] = {
                    type: "error",
                    result: e,
                };
            }
        })));
        // Wait for all routes to resolve above before we make the HTTP call
        await routesLoadedPromise;
        // We can skip the server call:
        // - On initial hydration - only clientLoaders can pass through via `clientLoader.hydrate`
        // - If there are no routes to fetch from the server
        //
        // One exception - if we are performing an HDR revalidation we have to call
        // the server in case a new loader has shown up that the manifest doesn't yet
        // know about
        if ((!router.state.initialized || routesParams.size === 0) &&
            !window.__reactRouterHdrActive) {
            singleFetchDfd.resolve({});
        }
        else {
            try {
                // When one or more routes have opted out, we add a _routes param to
                // limit the loaders to those that have a server loader and did not
                // opt out
                if (ssr && foundOptOutRoute && routesParams.size > 0) {
                    url.searchParams.set("_routes", matches
                        .filter((m) => routesParams.has(m.route.id))
                        .map((m) => m.route.id)
                        .join(","));
                }
                let data = await fetchAndDecode(url, init);
                singleFetchDfd.resolve(data.data);
            }
            catch (e) {
                singleFetchDfd.reject(e);
            }
        }
        await resolvePromise;
        return results;
    }
    // Fetcher loader calls are much simpler than navigational loader calls
    async function singleFetchLoaderFetcherStrategy(request, matches, basename) {
        let fetcherMatch = matches.find((m) => m.shouldLoad);
        invariant$1(fetcherMatch, "No fetcher match found");
        let result = await fetcherMatch.resolve(async (handler) => {
            let url = stripIndexParam$1(singleFetchUrl(request.url, basename));
            let init = await createRequestInit(request);
            return fetchSingleLoader(handler, url, init, fetcherMatch.route.id);
        });
        return { [fetcherMatch.route.id]: result };
    }
    function fetchSingleLoader(handler, url, init, routeId) {
        return handler(async () => {
            let singleLoaderUrl = new URL(url);
            singleLoaderUrl.searchParams.set("_routes", routeId);
            let { data } = await fetchAndDecode(singleLoaderUrl, init);
            return unwrapSingleFetchResults(data, routeId);
        });
    }
    function stripIndexParam$1(url) {
        let indexValues = url.searchParams.getAll("index");
        url.searchParams.delete("index");
        let indexValuesToKeep = [];
        for (let indexValue of indexValues) {
            if (indexValue) {
                indexValuesToKeep.push(indexValue);
            }
        }
        for (let toKeep of indexValuesToKeep) {
            url.searchParams.append("index", toKeep);
        }
        return url;
    }
    function singleFetchUrl(reqUrl, basename) {
        let url = typeof reqUrl === "string"
            ? new URL(reqUrl, 
            // This can be called during the SSR flow via PrefetchPageLinksImpl so
            // don't assume window is available
            typeof window === "undefined"
                ? "server://singlefetch/"
                : window.location.origin)
            : reqUrl;
        if (url.pathname === "/") {
            url.pathname = "_root.data";
        }
        else if (basename && stripBasename(url.pathname, basename) === "/") {
            url.pathname = `${basename.replace(/\/$/, "")}/_root.data`;
        }
        else {
            url.pathname = `${url.pathname.replace(/\/$/, "")}.data`;
        }
        return url;
    }
    async function fetchAndDecode(url, init) {
        let res = await fetch(url, init);
        // If this 404'd without hitting the running server (most likely in a
        // pre-rendered app using a CDN), then bubble a standard 404 ErrorResponse
        if (res.status === 404 && !res.headers.has("X-Remix-Response")) {
            throw new ErrorResponseImpl(404, "Not Found", true);
        }
        // some status codes are not permitted to have bodies, so we want to just
        // treat those as "no data" instead of throwing an exception.
        // 304 is not included here because the browser should fill those responses
        // with the cached body content.
        const NO_BODY_STATUS_CODES = new Set([100, 101, 204, 205]);
        if (NO_BODY_STATUS_CODES.has(res.status)) {
            if (!init.method || init.method === "GET") {
                // SingleFetchResults can just have no routeId keys which will result
                // in no data for all routes
                return { status: res.status, data: {} };
            }
            else {
                // SingleFetchResult is for a singular route and can specify no data
                return { status: res.status, data: { data: undefined } };
            }
        }
        invariant$1(res.body, "No response body to decode");
        try {
            let decoded = await decodeViaTurboStream(res.body, window);
            return { status: res.status, data: decoded.value };
        }
        catch (e) {
            // Can't clone after consuming the body via turbo-stream so we can't
            // include the body here.  In an ideal world we'd look for a turbo-stream
            // content type here, or even X-Remix-Response but then folks can't
            // statically deploy their prerendered .data files to a CDN unless they can
            // tell that CDN to add special headers to those certain files - which is a
            // bit restrictive.
            throw new Error("Unable to decode turbo-stream response");
        }
    }
    // Note: If you change this function please change the corresponding
    // encodeViaTurboStream function in server-runtime
    function decodeViaTurboStream(body, global) {
        return decode(body, {
            plugins: [
                (type, ...rest) => {
                    // Decode Errors back into Error instances using the right type and with
                    // the right (potentially undefined) stacktrace
                    if (type === "SanitizedError") {
                        let [name, message, stack] = rest;
                        let Constructor = Error;
                        // @ts-expect-error
                        if (name && name in global && typeof global[name] === "function") {
                            // @ts-expect-error
                            Constructor = global[name];
                        }
                        let error = new Constructor(message);
                        error.stack = stack;
                        return { value: error };
                    }
                    if (type === "ErrorResponse") {
                        let [data, status, statusText] = rest;
                        return {
                            value: new ErrorResponseImpl(status, statusText, data),
                        };
                    }
                    if (type === "SingleFetchRedirect") {
                        return { value: { [SingleFetchRedirectSymbol]: rest[0] } };
                    }
                    if (type === "SingleFetchClassInstance") {
                        return { value: rest[0] };
                    }
                    if (type === "SingleFetchFallback") {
                        return { value: undefined };
                    }
                },
            ],
        });
    }
    function unwrapSingleFetchResults(results, routeId) {
        let redirect = results[SingleFetchRedirectSymbol];
        if (redirect) {
            return unwrapSingleFetchResult(redirect, routeId);
        }
        return results[routeId] !== undefined
            ? unwrapSingleFetchResult(results[routeId], routeId)
            : null;
    }
    function unwrapSingleFetchResult(result, routeId) {
        if ("error" in result) {
            throw result.error;
        }
        else if ("redirect" in result) {
            let headers = {};
            if (result.revalidate) {
                headers["X-Remix-Revalidate"] = "yes";
            }
            if (result.reload) {
                headers["X-Remix-Reload-Document"] = "yes";
            }
            if (result.replace) {
                headers["X-Remix-Replace"] = "yes";
            }
            throw redirect(result.redirect, { status: result.status, headers });
        }
        else if ("data" in result) {
            return result.data;
        }
        else {
            throw new Error(`No response found for routeId "${routeId}"`);
        }
    }
    function createDeferred() {
        let resolve;
        let reject;
        let promise = new Promise((res, rej) => {
            resolve = async (val) => {
                res(val);
                try {
                    await promise;
                }
                catch (e) { }
            };
            reject = async (error) => {
                rej(error);
                try {
                    await promise;
                }
                catch (e) { }
            };
        });
        return {
            promise,
            //@ts-ignore
            resolve,
            //@ts-ignore
            reject,
        };
    }

    class RemixErrorBoundary extends React__namespace.Component {
        constructor(props) {
            super(props);
            this.state = { error: props.error || null, location: props.location };
        }
        static getDerivedStateFromError(error) {
            return { error };
        }
        static getDerivedStateFromProps(props, state) {
            // When we get into an error state, the user will likely click "back" to the
            // previous page that didn't have an error. Because this wraps the entire
            // application (even the HTML!) that will have no effect--the error page
            // continues to display. This gives us a mechanism to recover from the error
            // when the location changes.
            //
            // Whether we're in an error state or not, we update the location in state
            // so that when we are in an error state, it gets reset when a new location
            // comes in and the user recovers from the error.
            if (state.location !== props.location) {
                return { error: props.error || null, location: props.location };
            }
            // If we're not changing locations, preserve the location but still surface
            // any new errors that may come through. We retain the existing error, we do
            // this because the error provided from the app state may be cleared without
            // the location changing.
            return { error: props.error || state.error, location: state.location };
        }
        render() {
            if (this.state.error) {
                return (React__namespace.createElement(RemixRootDefaultErrorBoundary, { error: this.state.error, isOutsideRemixApp: true }));
            }
            else {
                return this.props.children;
            }
        }
    }
    /**
     * When app's don't provide a root level ErrorBoundary, we default to this.
     */
    function RemixRootDefaultErrorBoundary({ error, isOutsideRemixApp, }) {
        console.error(error);
        let heyDeveloper = (React__namespace.createElement("script", { dangerouslySetInnerHTML: {
                __html: `
        console.log(
          "💿 Hey developer 👋. You can provide a way better UX than this when your app throws errors. Check out https://remix.run/guides/errors for more information."
        );
      `,
            } }));
        if (isRouteErrorResponse(error)) {
            return (React__namespace.createElement(BoundaryShell, { title: "Unhandled Thrown Response!" },
                React__namespace.createElement("h1", { style: { fontSize: "24px" } },
                    error.status,
                    " ",
                    error.statusText),
                heyDeveloper));
        }
        let errorInstance;
        if (error instanceof Error) {
            errorInstance = error;
        }
        else {
            let errorString = error == null
                ? "Unknown Error"
                : typeof error === "object" && "toString" in error
                    ? error.toString()
                    : JSON.stringify(error);
            errorInstance = new Error(errorString);
        }
        return (React__namespace.createElement(BoundaryShell, { title: "Application Error!", isOutsideRemixApp: isOutsideRemixApp },
            React__namespace.createElement("h1", { style: { fontSize: "24px" } }, "Application Error"),
            React__namespace.createElement("pre", { style: {
                    padding: "2rem",
                    background: "hsla(10, 50%, 50%, 0.1)",
                    color: "red",
                    overflow: "auto",
                } }, errorInstance.stack),
            heyDeveloper));
    }
    function BoundaryShell({ title, renderScripts, isOutsideRemixApp, children, }) {
        let { routeModules } = useFrameworkContext();
        // Generally speaking, when the root route has a Layout we want to use that
        // as the app shell instead of the default `BoundaryShell` wrapper markup below.
        // This is true for `loader`/`action` errors, most render errors, and
        // `HydrateFallback` scenarios.
        // However, render errors thrown from the `Layout` present a bit of an issue
        // because if the `Layout` itself throws during the `ErrorBoundary` pass and
        // we bubble outside the `RouterProvider` to the wrapping `RemixErrorBoundary`,
        // by returning only `children` here we'll be trying to append a `<div>` to
        // the `document` and the DOM will throw, putting React into an error/hydration
        // loop.
        // Instead, if we're ever rendering from the outermost `RemixErrorBoundary`
        // during hydration that wraps `RouterProvider`, then we can't trust the
        // `Layout` and should fallback to the default app shell so we're always
        // returning an `<html>` document.
        if (routeModules.root?.Layout && !isOutsideRemixApp) {
            return children;
        }
        return (React__namespace.createElement("html", { lang: "en" },
            React__namespace.createElement("head", null,
                React__namespace.createElement("meta", { charSet: "utf-8" }),
                React__namespace.createElement("meta", { name: "viewport", content: "width=device-width,initial-scale=1,viewport-fit=cover" }),
                React__namespace.createElement("title", null, title)),
            React__namespace.createElement("body", null,
                React__namespace.createElement("main", { style: { fontFamily: "system-ui, sans-serif", padding: "2rem" } },
                    children,
                    renderScripts ? React__namespace.createElement(Scripts, null) : null))));
    }

    // If the user sets `clientLoader.hydrate=true` somewhere but does not
    // provide a `HydrateFallback` at any level of the tree, then we need to at
    // least include `<Scripts>` in the SSR so we can hydrate the app and call the
    // `clientLoader` functions
    function RemixRootDefaultHydrateFallback() {
        return (React__namespace.createElement(BoundaryShell, { title: "Loading...", renderScripts: true },
            React__namespace.createElement("script", { dangerouslySetInnerHTML: {
                    __html: `
              console.log(
                "💿 Hey developer 👋. You can provide a way better UX than this " +
                "when your app is loading JS modules and/or running \`clientLoader\` " +
                "functions. Check out https://remix.run/route/hydrate-fallback " +
                "for more information."
              );
            `,
                } })));
    }

    // Create a map of routes by parentId to use recursively instead of
    // repeatedly filtering the manifest.
    function groupRoutesByParentId$1(manifest) {
        let routes = {};
        Object.values(manifest).forEach((route) => {
            if (route) {
                let parentId = route.parentId || "";
                if (!routes[parentId]) {
                    routes[parentId] = [];
                }
                routes[parentId].push(route);
            }
        });
        return routes;
    }
    function getRouteComponents(route, routeModule, isSpaMode) {
        let Component = getRouteModuleComponent(routeModule);
        // HydrateFallback can only exist on the root route in SPA Mode
        let HydrateFallback = routeModule.HydrateFallback && (!isSpaMode || route.id === "root")
            ? routeModule.HydrateFallback
            : route.id === "root"
                ? RemixRootDefaultHydrateFallback
                : undefined;
        let ErrorBoundary = routeModule.ErrorBoundary
            ? routeModule.ErrorBoundary
            : route.id === "root"
                ? () => React__namespace.createElement(RemixRootDefaultErrorBoundary, { error: useRouteError() })
                : undefined;
        if (route.id === "root" && routeModule.Layout) {
            return {
                ...(Component
                    ? {
                        element: (React__namespace.createElement(routeModule.Layout, null,
                            React__namespace.createElement(Component, null))),
                    }
                    : { Component }),
                ...(ErrorBoundary
                    ? {
                        errorElement: (React__namespace.createElement(routeModule.Layout, null,
                            React__namespace.createElement(ErrorBoundary, null))),
                    }
                    : { ErrorBoundary }),
                ...(HydrateFallback
                    ? {
                        hydrateFallbackElement: (React__namespace.createElement(routeModule.Layout, null,
                            React__namespace.createElement(HydrateFallback, null))),
                    }
                    : { HydrateFallback }),
            };
        }
        return { Component, ErrorBoundary, HydrateFallback };
    }
    function createServerRoutes(manifest, routeModules, future, isSpaMode, parentId = "", routesByParentId = groupRoutesByParentId$1(manifest), spaModeLazyPromise = Promise.resolve({ Component: () => null })) {
        return (routesByParentId[parentId] || []).map((route) => {
            let routeModule = routeModules[route.id];
            invariant$1(routeModule, "No `routeModule` available to create server routes");
            let dataRoute = {
                ...getRouteComponents(route, routeModule, isSpaMode),
                caseSensitive: route.caseSensitive,
                id: route.id,
                index: route.index,
                path: route.path,
                handle: routeModule.handle,
                // For SPA Mode, all routes are lazy except root.  However we tell the
                // router root is also lazy here too since we don't need a full
                // implementation - we just need a `lazy` prop to tell the RR rendering
                // where to stop which is always at the root route in SPA mode
                lazy: isSpaMode ? () => spaModeLazyPromise : undefined,
                // For partial hydration rendering, we need to indicate when the route
                // has a loader/clientLoader, but it won't ever be called during the static
                // render, so just give it a no-op function so we can render down to the
                // proper fallback
                loader: route.hasLoader || route.hasClientLoader ? () => null : undefined,
                // We don't need middleware/action/shouldRevalidate on these routes since
                // they're for a static render
            };
            let children = createServerRoutes(manifest, routeModules, future, isSpaMode, route.id, routesByParentId, spaModeLazyPromise);
            if (children.length > 0)
                dataRoute.children = children;
            return dataRoute;
        });
    }
    function createClientRoutesWithHMRRevalidationOptOut(needsRevalidation, manifest, routeModulesCache, initialState, ssr, isSpaMode) {
        return createClientRoutes(manifest, routeModulesCache, initialState, ssr, isSpaMode, "", groupRoutesByParentId$1(manifest), needsRevalidation);
    }
    function preventInvalidServerHandlerCall(type, route) {
        if ((type === "loader" && !route.hasLoader) ||
            (type === "action" && !route.hasAction)) {
            let fn = type === "action" ? "serverAction()" : "serverLoader()";
            let msg = `You are trying to call ${fn} on a route that does not have a server ` +
                `${type} (routeId: "${route.id}")`;
            console.error(msg);
            throw new ErrorResponseImpl(400, "Bad Request", new Error(msg), true);
        }
    }
    function noActionDefinedError(type, routeId) {
        let article = type === "clientAction" ? "a" : "an";
        let msg = `Route "${routeId}" does not have ${article} ${type}, but you are trying to ` +
            `submit to it. To fix this, please add ${article} \`${type}\` function to the route`;
        console.error(msg);
        throw new ErrorResponseImpl(405, "Method Not Allowed", new Error(msg), true);
    }
    function createClientRoutes(manifest, routeModulesCache, initialState, ssr, isSpaMode, parentId = "", routesByParentId = groupRoutesByParentId$1(manifest), needsRevalidation) {
        return (routesByParentId[parentId] || []).map((route) => {
            let routeModule = routeModulesCache[route.id];
            function fetchServerHandler(singleFetch) {
                invariant$1(typeof singleFetch === "function", "No single fetch function available for route handler");
                return singleFetch();
            }
            function fetchServerLoader(singleFetch) {
                if (!route.hasLoader)
                    return Promise.resolve(null);
                return fetchServerHandler(singleFetch);
            }
            function fetchServerAction(singleFetch) {
                if (!route.hasAction) {
                    throw noActionDefinedError("action", route.id);
                }
                return fetchServerHandler(singleFetch);
            }
            function prefetchModule(modulePath) {
                import(
                /* @vite-ignore */
                /* webpackIgnore: true */
                modulePath);
            }
            function prefetchRouteModuleChunks(route) {
                // We fetch the client action module first since the loader function we
                // create internally already handles the client loader. This function is
                // most useful in cases where only the client action is splittable, but is
                // also useful for prefetching the client loader module if a client action
                // is triggered from another route.
                if (route.clientActionModule) {
                    prefetchModule(route.clientActionModule);
                }
                // Also prefetch the client loader module if it exists
                // since it's called after the client action
                if (route.clientLoaderModule) {
                    prefetchModule(route.clientLoaderModule);
                }
            }
            async function prefetchStylesAndCallHandler(handler) {
                // Only prefetch links if we exist in the routeModulesCache (critical modules
                // and navigating back to pages previously loaded via route.lazy).  Initial
                // execution of route.lazy (when the module is not in the cache) will handle
                // prefetching style links via loadRouteModuleWithBlockingLinks.
                let cachedModule = routeModulesCache[route.id];
                let linkPrefetchPromise = cachedModule
                    ? prefetchStyleLinks(route, cachedModule)
                    : Promise.resolve();
                try {
                    return handler();
                }
                finally {
                    await linkPrefetchPromise;
                }
            }
            let dataRoute = {
                id: route.id,
                index: route.index,
                path: route.path,
            };
            if (routeModule) {
                // Use critical path modules directly
                Object.assign(dataRoute, {
                    ...dataRoute,
                    ...getRouteComponents(route, routeModule, isSpaMode),
                    unstable_middleware: routeModule.unstable_clientMiddleware,
                    handle: routeModule.handle,
                    shouldRevalidate: getShouldRevalidateFunction(routeModule, route, ssr, needsRevalidation),
                });
                let hasInitialData = initialState &&
                    initialState.loaderData &&
                    route.id in initialState.loaderData;
                let initialData = hasInitialData
                    ? initialState?.loaderData?.[route.id]
                    : undefined;
                let hasInitialError = initialState && initialState.errors && route.id in initialState.errors;
                let initialError = hasInitialError
                    ? initialState?.errors?.[route.id]
                    : undefined;
                let isHydrationRequest = needsRevalidation == null &&
                    (routeModule.clientLoader?.hydrate === true || !route.hasLoader);
                dataRoute.loader = async ({ request, params, context }, singleFetch) => {
                    try {
                        let result = await prefetchStylesAndCallHandler(async () => {
                            invariant$1(routeModule, "No `routeModule` available for critical-route loader");
                            if (!routeModule.clientLoader) {
                                // Call the server when no client loader exists
                                return fetchServerLoader(singleFetch);
                            }
                            return routeModule.clientLoader({
                                request,
                                params,
                                context,
                                async serverLoader() {
                                    preventInvalidServerHandlerCall("loader", route);
                                    // On the first call, resolve with the server result
                                    if (isHydrationRequest) {
                                        if (hasInitialData) {
                                            return initialData;
                                        }
                                        if (hasInitialError) {
                                            throw initialError;
                                        }
                                    }
                                    // Call the server loader for client-side navigations
                                    return fetchServerLoader(singleFetch);
                                },
                            });
                        });
                        return result;
                    }
                    finally {
                        // Whether or not the user calls `serverLoader`, we only let this
                        // stick around as true for one loader call
                        isHydrationRequest = false;
                    }
                };
                // Let React Router know whether to run this on hydration
                dataRoute.loader.hydrate = shouldHydrateRouteLoader(route, routeModule, isSpaMode);
                dataRoute.action = ({ request, params, context }, singleFetch) => {
                    return prefetchStylesAndCallHandler(async () => {
                        invariant$1(routeModule, "No `routeModule` available for critical-route action");
                        if (!routeModule.clientAction) {
                            if (isSpaMode) {
                                throw noActionDefinedError("clientAction", route.id);
                            }
                            return fetchServerAction(singleFetch);
                        }
                        return routeModule.clientAction({
                            request,
                            params,
                            context,
                            async serverAction() {
                                preventInvalidServerHandlerCall("action", route);
                                return fetchServerAction(singleFetch);
                            },
                        });
                    });
                };
            }
            else {
                // If the lazy route does not have a client loader/action we want to call
                // the server loader/action in parallel with the module load so we add
                // loader/action as static props on the route
                if (!route.hasClientLoader) {
                    dataRoute.loader = (_, singleFetch) => prefetchStylesAndCallHandler(() => {
                        return fetchServerLoader(singleFetch);
                    });
                }
                if (!route.hasClientAction) {
                    dataRoute.action = (_, singleFetch) => prefetchStylesAndCallHandler(() => {
                        if (isSpaMode) {
                            throw noActionDefinedError("clientAction", route.id);
                        }
                        return fetchServerAction(singleFetch);
                    });
                }
                let lazyRoutePromise;
                async function getLazyRoute() {
                    if (lazyRoutePromise) {
                        return await lazyRoutePromise;
                    }
                    lazyRoutePromise = (async () => {
                        if (route.clientLoaderModule || route.clientActionModule) {
                            // If a client loader/action chunk is present, we push the loading of
                            // the main route chunk to the next tick to ensure the downloading of
                            // loader/action chunks takes precedence. This can be seen via their
                            // order in the network tab. Also note that since this is happening
                            // within `route.lazy`, this imperceptible delay only happens on the
                            // first load of this route.
                            await new Promise((resolve) => setTimeout(resolve, 0));
                        }
                        let routeModulePromise = loadRouteModuleWithBlockingLinks(route, routeModulesCache);
                        prefetchRouteModuleChunks(route);
                        return await routeModulePromise;
                    })();
                    return await lazyRoutePromise;
                }
                dataRoute.lazy = {
                    loader: route.hasClientLoader
                        ? async () => {
                            let { clientLoader } = route.clientLoaderModule
                                ? await import(
                                /* @vite-ignore */
                                /* webpackIgnore: true */
                                route.clientLoaderModule)
                                : await getLazyRoute();
                            invariant$1(clientLoader, "No `clientLoader` export found");
                            return (args, singleFetch) => clientLoader({
                                ...args,
                                async serverLoader() {
                                    preventInvalidServerHandlerCall("loader", route);
                                    return fetchServerLoader(singleFetch);
                                },
                            });
                        }
                        : undefined,
                    action: route.hasClientAction
                        ? async () => {
                            let clientActionPromise = route.clientActionModule
                                ? import(
                                /* @vite-ignore */
                                /* webpackIgnore: true */
                                route.clientActionModule)
                                : getLazyRoute();
                            prefetchRouteModuleChunks(route);
                            let { clientAction } = await clientActionPromise;
                            invariant$1(clientAction, "No `clientAction` export found");
                            return (args, singleFetch) => clientAction({
                                ...args,
                                async serverAction() {
                                    preventInvalidServerHandlerCall("action", route);
                                    return fetchServerAction(singleFetch);
                                },
                            });
                        }
                        : undefined,
                    unstable_middleware: route.hasClientMiddleware
                        ? async () => {
                            let { unstable_clientMiddleware } = route.clientMiddlewareModule
                                ? await import(
                                /* @vite-ignore */
                                /* webpackIgnore: true */
                                route.clientMiddlewareModule)
                                : await getLazyRoute();
                            invariant$1(unstable_clientMiddleware, "No `unstable_clientMiddleware` export found");
                            return unstable_clientMiddleware;
                        }
                        : undefined,
                    shouldRevalidate: async () => {
                        let lazyRoute = await getLazyRoute();
                        return getShouldRevalidateFunction(lazyRoute, route, ssr, needsRevalidation);
                    },
                    handle: async () => (await getLazyRoute()).handle,
                    // No need to wrap these in layout since the root route is never
                    // loaded via route.lazy()
                    Component: async () => (await getLazyRoute()).Component,
                    ErrorBoundary: route.hasErrorBoundary
                        ? async () => (await getLazyRoute()).ErrorBoundary
                        : undefined,
                };
            }
            let children = createClientRoutes(manifest, routeModulesCache, initialState, ssr, isSpaMode, route.id, routesByParentId, needsRevalidation);
            if (children.length > 0)
                dataRoute.children = children;
            return dataRoute;
        });
    }
    function getShouldRevalidateFunction(route, manifestRoute, ssr, needsRevalidation) {
        // During HDR we force revalidation for updated routes
        if (needsRevalidation) {
            return wrapShouldRevalidateForHdr(manifestRoute.id, route.shouldRevalidate, needsRevalidation);
        }
        // When prerendering is enabled with `ssr:false`, any `loader` data is
        // statically generated at build time so if we have a `loader` but not a
        // `clientLoader`, we disable revalidation by default since we can't be sure
        // if a `.data` file was pre-rendered.  If users are somehow re-generating
        // updated versions of these on the backend they can still opt-into
        // revalidation which will make the `.data` request
        if (!ssr && manifestRoute.hasLoader && !manifestRoute.hasClientLoader) {
            if (route.shouldRevalidate) {
                let fn = route.shouldRevalidate;
                return (opts) => fn({ ...opts, defaultShouldRevalidate: false });
            }
            else {
                return () => false;
            }
        }
        // Single fetch revalidates by default, so override the RR default value which
        // matches the multi-fetch behavior with `true`
        if (ssr && route.shouldRevalidate) {
            let fn = route.shouldRevalidate;
            return (opts) => fn({ ...opts, defaultShouldRevalidate: true });
        }
        return route.shouldRevalidate;
    }
    // When an HMR / HDR update happens we opt out of all user-defined
    // revalidation logic and force a revalidation on the first call
    function wrapShouldRevalidateForHdr(routeId, routeShouldRevalidate, needsRevalidation) {
        let handledRevalidation = false;
        return (arg) => {
            if (!handledRevalidation) {
                handledRevalidation = true;
                return needsRevalidation.has(routeId);
            }
            return routeShouldRevalidate
                ? routeShouldRevalidate(arg)
                : arg.defaultShouldRevalidate;
        };
    }
    async function loadRouteModuleWithBlockingLinks(route, routeModules) {
        // Ensure the route module and its static CSS links are loaded in parallel as
        // soon as possible before blocking on the route module
        let routeModulePromise = loadRouteModule(route, routeModules);
        let prefetchRouteCssPromise = prefetchRouteCss(route);
        let routeModule = await routeModulePromise;
        await Promise.all([
            prefetchRouteCssPromise,
            prefetchStyleLinks(route, routeModule),
        ]);
        // Include all `browserSafeRouteExports` fields, except `HydrateFallback`
        // since those aren't used on lazily loaded routes
        return {
            Component: getRouteModuleComponent(routeModule),
            ErrorBoundary: routeModule.ErrorBoundary,
            unstable_clientMiddleware: routeModule.unstable_clientMiddleware,
            clientAction: routeModule.clientAction,
            clientLoader: routeModule.clientLoader,
            handle: routeModule.handle,
            links: routeModule.links,
            meta: routeModule.meta,
            shouldRevalidate: routeModule.shouldRevalidate,
        };
    }
    // Our compiler generates the default export as `{}` when no default is provided,
    // which can lead us to trying to use that as a Component in RR and calling
    // createElement on it.  Patching here as a quick fix and hoping it's no longer
    // an issue in Vite.
    function getRouteModuleComponent(routeModule) {
        if (routeModule.default == null)
            return undefined;
        let isEmptyObject = typeof routeModule.default === "object" &&
            Object.keys(routeModule.default).length === 0;
        if (!isEmptyObject) {
            return routeModule.default;
        }
    }
    function shouldHydrateRouteLoader(route, routeModule, isSpaMode) {
        return ((isSpaMode && route.id !== "root") ||
            (routeModule.clientLoader != null &&
                (routeModule.clientLoader.hydrate === true || route.hasLoader !== true)));
    }

    // Currently rendered links that may need prefetching
    const nextPaths = new Set();
    // FIFO queue of previously discovered routes to prevent re-calling on
    // subsequent navigations to the same path
    const discoveredPathsMaxSize = 1000;
    const discoveredPaths = new Set();
    // 7.5k to come in under the ~8k limit for most browsers
    // https://stackoverflow.com/a/417184
    const URL_LIMIT = 7680;
    function isFogOfWarEnabled(ssr) {
        return ssr === true;
    }
    function getPartialManifest({ sri, ...manifest }, router) {
        // Start with our matches for this pathname
        let routeIds = new Set(router.state.matches.map((m) => m.route.id));
        let segments = router.state.location.pathname.split("/").filter(Boolean);
        let paths = ["/"];
        // We've already matched to the last segment
        segments.pop();
        // Traverse each path for our parents and match in case they have pathless/index
        // children we need to include in the initial manifest
        while (segments.length > 0) {
            paths.push(`/${segments.join("/")}`);
            segments.pop();
        }
        paths.forEach((path) => {
            let matches = matchRoutes(router.routes, path, router.basename);
            if (matches) {
                matches.forEach((m) => routeIds.add(m.route.id));
            }
        });
        let initialRoutes = [...routeIds].reduce((acc, id) => Object.assign(acc, { [id]: manifest.routes[id] }), {});
        return {
            ...manifest,
            routes: initialRoutes,
            sri: sri ? true : undefined,
        };
    }
    function getPatchRoutesOnNavigationFunction(manifest, routeModules, ssr, isSpaMode, basename) {
        if (!isFogOfWarEnabled(ssr)) {
            return undefined;
        }
        return async ({ path, patch, signal, fetcherKey }) => {
            if (discoveredPaths.has(path)) {
                return;
            }
            await fetchAndApplyManifestPatches([path], fetcherKey ? window.location.href : path, manifest, routeModules, ssr, isSpaMode, basename, patch, signal);
        };
    }
    function useFogOFWarDiscovery(router, manifest, routeModules, ssr, isSpaMode) {
        React__namespace.useEffect(() => {
            // Don't prefetch if not enabled or if the user has `saveData` enabled
            if (!isFogOfWarEnabled(ssr) || navigator.connection?.saveData === true) {
                return;
            }
            // Register a link href for patching
            function registerElement(el) {
                let path = el.tagName === "FORM"
                    ? el.getAttribute("action")
                    : el.getAttribute("href");
                if (!path) {
                    return;
                }
                // optimization: use the already-parsed pathname from links
                let pathname = el.tagName === "A"
                    ? el.pathname
                    : new URL(path, window.location.origin).pathname;
                if (!discoveredPaths.has(pathname)) {
                    nextPaths.add(pathname);
                }
            }
            // Register and fetch patches for all initially-rendered links/forms
            async function fetchPatches() {
                // re-check/update registered links
                document
                    .querySelectorAll("a[data-discover], form[data-discover]")
                    .forEach(registerElement);
                let lazyPaths = Array.from(nextPaths.keys()).filter((path) => {
                    if (discoveredPaths.has(path)) {
                        nextPaths.delete(path);
                        return false;
                    }
                    return true;
                });
                if (lazyPaths.length === 0) {
                    return;
                }
                try {
                    await fetchAndApplyManifestPatches(lazyPaths, null, manifest, routeModules, ssr, isSpaMode, router.basename, router.patchRoutes);
                }
                catch (e) {
                    console.error("Failed to fetch manifest patches", e);
                }
            }
            let debouncedFetchPatches = debounce(fetchPatches, 100);
            // scan and fetch initial links
            fetchPatches();
            // Setup a MutationObserver to fetch all subsequently rendered links/form
            // It just schedules a full scan since that's faster than checking subtrees
            let observer = new MutationObserver(() => debouncedFetchPatches());
            observer.observe(document.documentElement, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ["data-discover", "href", "action"],
            });
            return () => observer.disconnect();
        }, [ssr, isSpaMode, manifest, routeModules, router]);
    }
    const MANIFEST_VERSION_STORAGE_KEY = "react-router-manifest-version";
    async function fetchAndApplyManifestPatches(paths, errorReloadPath, manifest, routeModules, ssr, isSpaMode, basename, patchRoutes, signal) {
        let manifestPath = `${basename != null ? basename : "/"}/__manifest`.replace(/\/+/g, "/");
        let url = new URL(manifestPath, window.location.origin);
        paths.sort().forEach((path) => url.searchParams.append("p", path));
        url.searchParams.set("version", manifest.version);
        // If the URL is nearing the ~8k limit on GET requests, skip this optimization
        // step and just let discovery happen on link click.  We also wipe out the
        // nextPaths Set here so we can start filling it with fresh links
        if (url.toString().length > URL_LIMIT) {
            nextPaths.clear();
            return;
        }
        let serverPatches;
        try {
            let res = await fetch(url, { signal });
            if (!res.ok) {
                throw new Error(`${res.status} ${res.statusText}`);
            }
            else if (res.status === 204 &&
                res.headers.has("X-Remix-Reload-Document")) {
                if (!errorReloadPath) {
                    // No-op during eager route discovery so we will trigger a hard reload
                    // of the destination during the next navigation instead of reloading
                    // while the user is sitting on the current page.  Slightly more
                    // disruptive on fetcher calls because we reload the current page, but
                    // it's better than the `React.useContext` error that occurs without
                    // this detection.
                    console.warn("Detected a manifest version mismatch during eager route discovery. " +
                        "The next navigation/fetch to an undiscovered route will result in " +
                        "a new document navigation to sync up with the latest manifest.");
                    return;
                }
                // This will hard reload the destination path on navigations, or the
                // current path on fetcher calls
                if (sessionStorage.getItem(MANIFEST_VERSION_STORAGE_KEY) ===
                    manifest.version) {
                    // We've already tried fixing for this version, don' try again to
                    // avoid loops - just let this navigation/fetch 404
                    console.error("Unable to discover routes due to manifest version mismatch.");
                    return;
                }
                sessionStorage.setItem(MANIFEST_VERSION_STORAGE_KEY, manifest.version);
                window.location.href = errorReloadPath;
                throw new Error("Detected manifest version mismatch, reloading...");
            }
            else if (res.status >= 400) {
                throw new Error(await res.text());
            }
            // Reset loop-detection on a successful response
            sessionStorage.removeItem(MANIFEST_VERSION_STORAGE_KEY);
            serverPatches = (await res.json());
        }
        catch (e) {
            if (signal?.aborted)
                return;
            throw e;
        }
        // Patch routes we don't know about yet into the manifest
        let knownRoutes = new Set(Object.keys(manifest.routes));
        let patches = Object.values(serverPatches).reduce((acc, route) => {
            if (route && !knownRoutes.has(route.id)) {
                acc[route.id] = route;
            }
            return acc;
        }, {});
        Object.assign(manifest.routes, patches);
        // Track discovered paths so we don't have to fetch them again
        paths.forEach((p) => addToFifoQueue(p, discoveredPaths));
        // Identify all parentIds for which we have new children to add and patch
        // in their new children
        let parentIds = new Set();
        Object.values(patches).forEach((patch) => {
            if (patch && (!patch.parentId || !patches[patch.parentId])) {
                parentIds.add(patch.parentId);
            }
        });
        parentIds.forEach((parentId) => patchRoutes(parentId || null, createClientRoutes(patches, routeModules, null, ssr, isSpaMode, parentId)));
    }
    function addToFifoQueue(path, queue) {
        if (queue.size >= discoveredPathsMaxSize) {
            let first = queue.values().next().value;
            queue.delete(first);
        }
        queue.add(path);
    }
    // Thanks Josh!
    // https://www.joshwcomeau.com/snippets/javascript/debounce/
    function debounce(callback, wait) {
        let timeoutId;
        return (...args) => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => callback(...args), wait);
        };
    }

    function useDataRouterContext$1() {
        let context = React__namespace.useContext(DataRouterContext);
        invariant$1(context, "You must render this element inside a <DataRouterContext.Provider> element");
        return context;
    }
    function useDataRouterStateContext() {
        let context = React__namespace.useContext(DataRouterStateContext);
        invariant$1(context, "You must render this element inside a <DataRouterStateContext.Provider> element");
        return context;
    }
    ////////////////////////////////////////////////////////////////////////////////
    // FrameworkContext
    const FrameworkContext = React__namespace.createContext(undefined);
    FrameworkContext.displayName = "FrameworkContext";
    function useFrameworkContext() {
        let context = React__namespace.useContext(FrameworkContext);
        invariant$1(context, "You must render this element inside a <HydratedRouter> element");
        return context;
    }
    function usePrefetchBehavior(prefetch, theirElementProps) {
        let frameworkContext = React__namespace.useContext(FrameworkContext);
        let [maybePrefetch, setMaybePrefetch] = React__namespace.useState(false);
        let [shouldPrefetch, setShouldPrefetch] = React__namespace.useState(false);
        let { onFocus, onBlur, onMouseEnter, onMouseLeave, onTouchStart } = theirElementProps;
        let ref = React__namespace.useRef(null);
        React__namespace.useEffect(() => {
            if (prefetch === "render") {
                setShouldPrefetch(true);
            }
            if (prefetch === "viewport") {
                let callback = (entries) => {
                    entries.forEach((entry) => {
                        setShouldPrefetch(entry.isIntersecting);
                    });
                };
                let observer = new IntersectionObserver(callback, { threshold: 0.5 });
                if (ref.current)
                    observer.observe(ref.current);
                return () => {
                    observer.disconnect();
                };
            }
        }, [prefetch]);
        React__namespace.useEffect(() => {
            if (maybePrefetch) {
                let id = setTimeout(() => {
                    setShouldPrefetch(true);
                }, 100);
                return () => {
                    clearTimeout(id);
                };
            }
        }, [maybePrefetch]);
        let setIntent = () => {
            setMaybePrefetch(true);
        };
        let cancelIntent = () => {
            setMaybePrefetch(false);
            setShouldPrefetch(false);
        };
        // No prefetching if not using SSR
        if (!frameworkContext) {
            return [false, ref, {}];
        }
        if (prefetch !== "intent") {
            return [shouldPrefetch, ref, {}];
        }
        // When using prefetch="intent" we need to attach focus/hover listeners
        return [
            shouldPrefetch,
            ref,
            {
                onFocus: composeEventHandlers(onFocus, setIntent),
                onBlur: composeEventHandlers(onBlur, cancelIntent),
                onMouseEnter: composeEventHandlers(onMouseEnter, setIntent),
                onMouseLeave: composeEventHandlers(onMouseLeave, cancelIntent),
                onTouchStart: composeEventHandlers(onTouchStart, setIntent),
            },
        ];
    }
    function composeEventHandlers(theirHandler, ourHandler) {
        return (event) => {
            theirHandler && theirHandler(event);
            if (!event.defaultPrevented) {
                ourHandler(event);
            }
        };
    }
    // Return the matches actively being displayed:
    // - In SPA Mode we only SSR/hydrate the root match, and include all matches
    //   after hydration. This lets the router handle initial match loads via lazy().
    // - When an error boundary is rendered, we slice off matches up to the
    //   boundary for <Links>/<Meta>
    function getActiveMatches(matches, errors, isSpaMode) {
        if (isSpaMode && !isHydrated) {
            return [matches[0]];
        }
        if (errors) {
            let errorIdx = matches.findIndex((m) => errors[m.route.id] !== undefined);
            return matches.slice(0, errorIdx + 1);
        }
        return matches;
    }
    /**
      Renders all of the `<link>` tags created by route module {@link LinksFunction} export. You should render it inside the `<head>` of your document.

      ```tsx
      import { Links } from "react-router";

      export default function Root() {
        return (
          <html>
            <head>
              <Links />
            </head>
            <body></body>
          </html>
        );
      }
      ```

      @category Components
     */
    function Links() {
        let { isSpaMode, manifest, routeModules, criticalCss } = useFrameworkContext();
        let { errors, matches: routerMatches } = useDataRouterStateContext();
        let matches = getActiveMatches(routerMatches, errors, isSpaMode);
        let keyedLinks = React__namespace.useMemo(() => getKeyedLinksForMatches(matches, routeModules, manifest), [matches, routeModules, manifest]);
        return (React__namespace.createElement(React__namespace.Fragment, null,
            typeof criticalCss === "string" ? (React__namespace.createElement("style", { dangerouslySetInnerHTML: { __html: criticalCss } })) : null,
            typeof criticalCss === "object" ? (React__namespace.createElement("link", { rel: "stylesheet", href: criticalCss.href })) : null,
            keyedLinks.map(({ key, link }) => isPageLinkDescriptor(link) ? (React__namespace.createElement(PrefetchPageLinks, { key: key, ...link })) : (React__namespace.createElement("link", { key: key, ...link })))));
    }
    /**
      Renders `<link rel=prefetch|modulepreload>` tags for modules and data of another page to enable an instant navigation to that page. {@link LinkProps.prefetch | `<Link prefetch>`} uses this internally, but you can render it to prefetch a page for any other reason.

      ```tsx
      import { PrefetchPageLinks } from "react-router"

      <PrefetchPageLinks page="/absolute/path" />
      ```

      For example, you may render one of this as the user types into a search field to prefetch search results before they click through to their selection.

      @category Components
     */
    function PrefetchPageLinks({ page, ...dataLinkProps }) {
        let { router } = useDataRouterContext$1();
        let matches = React__namespace.useMemo(() => matchRoutes(router.routes, page, router.basename), [router.routes, page, router.basename]);
        if (!matches) {
            return null;
        }
        return (React__namespace.createElement(PrefetchPageLinksImpl, { page: page, matches: matches, ...dataLinkProps }));
    }
    function useKeyedPrefetchLinks(matches) {
        let { manifest, routeModules } = useFrameworkContext();
        let [keyedPrefetchLinks, setKeyedPrefetchLinks] = React__namespace.useState([]);
        React__namespace.useEffect(() => {
            let interrupted = false;
            void getKeyedPrefetchLinks(matches, manifest, routeModules).then((links) => {
                if (!interrupted) {
                    setKeyedPrefetchLinks(links);
                }
            });
            return () => {
                interrupted = true;
            };
        }, [matches, manifest, routeModules]);
        return keyedPrefetchLinks;
    }
    function PrefetchPageLinksImpl({ page, matches: nextMatches, ...linkProps }) {
        let location = useLocation();
        let { manifest, routeModules } = useFrameworkContext();
        let { basename } = useDataRouterContext$1();
        let { loaderData, matches } = useDataRouterStateContext();
        let newMatchesForData = React__namespace.useMemo(() => getNewMatchesForLinks(page, nextMatches, matches, manifest, location, "data"), [page, nextMatches, matches, manifest, location]);
        let newMatchesForAssets = React__namespace.useMemo(() => getNewMatchesForLinks(page, nextMatches, matches, manifest, location, "assets"), [page, nextMatches, matches, manifest, location]);
        let dataHrefs = React__namespace.useMemo(() => {
            if (page === location.pathname + location.search + location.hash) {
                // Because we opt-into revalidation, don't compute this for the current page
                // since it would always trigger a prefetch of the existing loaders
                return [];
            }
            // Single-fetch is harder :)
            // This parallels the logic in the single fetch data strategy
            let routesParams = new Set();
            let foundOptOutRoute = false;
            nextMatches.forEach((m) => {
                let manifestRoute = manifest.routes[m.route.id];
                if (!manifestRoute || !manifestRoute.hasLoader) {
                    return;
                }
                if (!newMatchesForData.some((m2) => m2.route.id === m.route.id) &&
                    m.route.id in loaderData &&
                    routeModules[m.route.id]?.shouldRevalidate) {
                    foundOptOutRoute = true;
                }
                else if (manifestRoute.hasClientLoader) {
                    foundOptOutRoute = true;
                }
                else {
                    routesParams.add(m.route.id);
                }
            });
            if (routesParams.size === 0) {
                return [];
            }
            let url = singleFetchUrl(page, basename);
            // When one or more routes have opted out, we add a _routes param to
            // limit the loaders to those that have a server loader and did not
            // opt out
            if (foundOptOutRoute && routesParams.size > 0) {
                url.searchParams.set("_routes", nextMatches
                    .filter((m) => routesParams.has(m.route.id))
                    .map((m) => m.route.id)
                    .join(","));
            }
            return [url.pathname + url.search];
        }, [
            basename,
            loaderData,
            location,
            manifest,
            newMatchesForData,
            nextMatches,
            page,
            routeModules,
        ]);
        let moduleHrefs = React__namespace.useMemo(() => getModuleLinkHrefs(newMatchesForAssets, manifest), [newMatchesForAssets, manifest]);
        // needs to be a hook with async behavior because we need the modules, not
        // just the manifest like the other links in here.
        let keyedPrefetchLinks = useKeyedPrefetchLinks(newMatchesForAssets);
        return (React__namespace.createElement(React__namespace.Fragment, null,
            dataHrefs.map((href) => (React__namespace.createElement("link", { key: href, rel: "prefetch", as: "fetch", href: href, ...linkProps }))),
            moduleHrefs.map((href) => (React__namespace.createElement("link", { key: href, rel: "modulepreload", href: href, ...linkProps }))),
            keyedPrefetchLinks.map(({ key, link }) => (
            // these don't spread `linkProps` because they are full link descriptors
            // already with their own props
            React__namespace.createElement("link", { key: key, ...link })))));
    }
    /**
      Renders all the `<meta>` tags created by route module {@link MetaFunction} exports. You should render it inside the `<head>` of your HTML.

      ```tsx
      import { Meta } from "react-router";

      export default function Root() {
        return (
          <html>
            <head>
              <Meta />
            </head>
          </html>
        );
      }
      ```

      @category Components
     */
    function Meta() {
        let { isSpaMode, routeModules } = useFrameworkContext();
        let { errors, matches: routerMatches, loaderData, } = useDataRouterStateContext();
        let location = useLocation();
        let _matches = getActiveMatches(routerMatches, errors, isSpaMode);
        let error = null;
        if (errors) {
            error = errors[_matches[_matches.length - 1].route.id];
        }
        let meta = [];
        let leafMeta = null;
        let matches = [];
        for (let i = 0; i < _matches.length; i++) {
            let _match = _matches[i];
            let routeId = _match.route.id;
            let data = loaderData[routeId];
            let params = _match.params;
            let routeModule = routeModules[routeId];
            let routeMeta = [];
            let match = {
                id: routeId,
                data,
                meta: [],
                params: _match.params,
                pathname: _match.pathname,
                handle: _match.route.handle,
                error,
            };
            matches[i] = match;
            if (routeModule?.meta) {
                routeMeta =
                    typeof routeModule.meta === "function"
                        ? routeModule.meta({
                            data,
                            params,
                            location,
                            matches,
                            error,
                        })
                        : Array.isArray(routeModule.meta)
                            ? [...routeModule.meta]
                            : routeModule.meta;
            }
            else if (leafMeta) {
                // We only assign the route's meta to the nearest leaf if there is no meta
                // export in the route. The meta function may return a falsy value which
                // is effectively the same as an empty array.
                routeMeta = [...leafMeta];
            }
            routeMeta = routeMeta || [];
            if (!Array.isArray(routeMeta)) {
                throw new Error("The route at " +
                    _match.route.path +
                    " returns an invalid value. All route meta functions must " +
                    "return an array of meta objects." +
                    "\n\nTo reference the meta function API, see https://remix.run/route/meta");
            }
            match.meta = routeMeta;
            matches[i] = match;
            meta = [...routeMeta];
            leafMeta = meta;
        }
        return (React__namespace.createElement(React__namespace.Fragment, null, meta.flat().map((metaProps) => {
            if (!metaProps) {
                return null;
            }
            if ("tagName" in metaProps) {
                let { tagName, ...rest } = metaProps;
                if (!isValidMetaTag(tagName)) {
                    console.warn(`A meta object uses an invalid tagName: ${tagName}. Expected either 'link' or 'meta'`);
                    return null;
                }
                let Comp = tagName;
                return React__namespace.createElement(Comp, { key: JSON.stringify(rest), ...rest });
            }
            if ("title" in metaProps) {
                return React__namespace.createElement("title", { key: "title" }, String(metaProps.title));
            }
            if ("charset" in metaProps) {
                metaProps.charSet ??= metaProps.charset;
                delete metaProps.charset;
            }
            if ("charSet" in metaProps && metaProps.charSet != null) {
                return typeof metaProps.charSet === "string" ? (React__namespace.createElement("meta", { key: "charSet", charSet: metaProps.charSet })) : null;
            }
            if ("script:ld+json" in metaProps) {
                try {
                    let json = JSON.stringify(metaProps["script:ld+json"]);
                    return (React__namespace.createElement("script", { key: `script:ld+json:${json}`, type: "application/ld+json", dangerouslySetInnerHTML: { __html: json } }));
                }
                catch (err) {
                    return null;
                }
            }
            return React__namespace.createElement("meta", { key: JSON.stringify(metaProps), ...metaProps });
        })));
    }
    function isValidMetaTag(tagName) {
        return typeof tagName === "string" && /^(meta|link)$/.test(tagName);
    }
    /**
     * Tracks whether hydration is finished, so scripts can be skipped
     * during client-side updates.
     */
    let isHydrated = false;
    /**
      Renders the client runtime of your app. It should be rendered inside the `<body>` of the document.

      ```tsx
      import { Scripts } from "react-router";

      export default function Root() {
        return (
          <html>
            <head />
            <body>
              <Scripts />
            </body>
          </html>
        );
      }
      ```

      If server rendering, you can omit `<Scripts/>` and the app will work as a traditional web app without JavaScript, relying solely on HTML and browser behaviors.

      @category Components
     */
    function Scripts(props) {
        let { manifest, serverHandoffString, isSpaMode, ssr, renderMeta } = useFrameworkContext();
        let { router, static: isStatic, staticContext } = useDataRouterContext$1();
        let { matches: routerMatches } = useDataRouterStateContext();
        let enableFogOfWar = isFogOfWarEnabled(ssr);
        // Let <ServerRouter> know that we hydrated and we should render the single
        // fetch streaming scripts
        if (renderMeta) {
            renderMeta.didRenderScripts = true;
        }
        let matches = getActiveMatches(routerMatches, null, isSpaMode);
        React__namespace.useEffect(() => {
            isHydrated = true;
        }, []);
        let initialScripts = React__namespace.useMemo(() => {
            let streamScript = "window.__reactRouterContext.stream = new ReadableStream({" +
                "start(controller){" +
                "window.__reactRouterContext.streamController = controller;" +
                "}" +
                "}).pipeThrough(new TextEncoderStream());";
            let contextScript = staticContext
                ? `window.__reactRouterContext = ${serverHandoffString};${streamScript}`
                : " ";
            let routeModulesScript = !isStatic
                ? " "
                : `${manifest.hmr?.runtime
                ? `import ${JSON.stringify(manifest.hmr.runtime)};`
                : ""}${!enableFogOfWar ? `import ${JSON.stringify(manifest.url)}` : ""};
${matches
                .map((match, routeIndex) => {
                let routeVarName = `route${routeIndex}`;
                let manifestEntry = manifest.routes[match.route.id];
                invariant$1(manifestEntry, `Route ${match.route.id} not found in manifest`);
                let { clientActionModule, clientLoaderModule, clientMiddlewareModule, hydrateFallbackModule, module, } = manifestEntry;
                let chunks = [
                    ...(clientActionModule
                        ? [
                            {
                                module: clientActionModule,
                                varName: `${routeVarName}_clientAction`,
                            },
                        ]
                        : []),
                    ...(clientLoaderModule
                        ? [
                            {
                                module: clientLoaderModule,
                                varName: `${routeVarName}_clientLoader`,
                            },
                        ]
                        : []),
                    ...(clientMiddlewareModule
                        ? [
                            {
                                module: clientMiddlewareModule,
                                varName: `${routeVarName}_clientMiddleware`,
                            },
                        ]
                        : []),
                    ...(hydrateFallbackModule
                        ? [
                            {
                                module: hydrateFallbackModule,
                                varName: `${routeVarName}_HydrateFallback`,
                            },
                        ]
                        : []),
                    { module, varName: `${routeVarName}_main` },
                ];
                if (chunks.length === 1) {
                    return `import * as ${routeVarName} from ${JSON.stringify(module)};`;
                }
                let chunkImportsSnippet = chunks
                    .map((chunk) => `import * as ${chunk.varName} from "${chunk.module}";`)
                    .join("\n");
                let mergedChunksSnippet = `const ${routeVarName} = {${chunks
                    .map((chunk) => `...${chunk.varName}`)
                    .join(",")}};`;
                return [chunkImportsSnippet, mergedChunksSnippet].join("\n");
            })
                .join("\n")}
  ${enableFogOfWar
                ? // Inline a minimal manifest with the SSR matches
                    `window.__reactRouterManifest = ${JSON.stringify(getPartialManifest(manifest, router), null, 2)};`
                : ""}
  window.__reactRouterRouteModules = {${matches
                .map((match, index) => `${JSON.stringify(match.route.id)}:route${index}`)
                .join(",")}};

import(${JSON.stringify(manifest.entry.module)});`;
            return (React__namespace.createElement(React__namespace.Fragment, null,
                React__namespace.createElement("script", { ...props, suppressHydrationWarning: true, dangerouslySetInnerHTML: createHtml(contextScript), type: undefined }),
                React__namespace.createElement("script", { ...props, suppressHydrationWarning: true, dangerouslySetInnerHTML: createHtml(routeModulesScript), type: "module", async: true })));
            // disabled deps array because we are purposefully only rendering this once
            // for hydration, after that we want to just continue rendering the initial
            // scripts as they were when the page first loaded
            // eslint-disable-next-line
        }, []);
        let preloads = isHydrated
            ? []
            : dedupe(manifest.entry.imports.concat(getModuleLinkHrefs(matches, manifest, {
                includeHydrateFallback: true,
            })));
        let sri = typeof manifest.sri === "object" ? manifest.sri : {};
        return isHydrated ? null : (React__namespace.createElement(React__namespace.Fragment, null,
            typeof manifest.sri === "object" ? (React__namespace.createElement("script", { "rr-importmap": "", type: "importmap", suppressHydrationWarning: true, dangerouslySetInnerHTML: {
                    __html: JSON.stringify({
                        integrity: sri,
                    }),
                } })) : null,
            !enableFogOfWar ? (React__namespace.createElement("link", { rel: "modulepreload", href: manifest.url, crossOrigin: props.crossOrigin, integrity: sri[manifest.url], suppressHydrationWarning: true })) : null,
            React__namespace.createElement("link", { rel: "modulepreload", href: manifest.entry.module, crossOrigin: props.crossOrigin, integrity: sri[manifest.entry.module], suppressHydrationWarning: true }),
            preloads.map((path) => (React__namespace.createElement("link", { key: path, rel: "modulepreload", href: path, crossOrigin: props.crossOrigin, integrity: sri[path], suppressHydrationWarning: true }))),
            initialScripts));
    }
    function dedupe(array) {
        return [...new Set(array)];
    }
    function mergeRefs(...refs) {
        return (value) => {
            refs.forEach((ref) => {
                if (typeof ref === "function") {
                    ref(value);
                }
                else if (ref != null) {
                    ref.current = value;
                }
            });
        };
    }

    ////////////////////////////////////////////////////////////////////////////////
    //#region Global Stuff
    ////////////////////////////////////////////////////////////////////////////////
    const isBrowser = typeof window !== "undefined" &&
        typeof window.document !== "undefined" &&
        typeof window.document.createElement !== "undefined";
    try {
        if (isBrowser) {
            window.__reactRouterVersion = REACT_ROUTER_VERSION;
        }
    }
    catch (e) {
        // no-op
    }
    /**
     * Create a new data router that manages the application path via `history.pushState`
     * and `history.replaceState`.
     *
     * @category Data Routers
     */
    function createBrowserRouter(
    /**
     * Application routes
     */
    routes, 
    /**
     * Router options
     */
    opts) {
        return createRouter({
            basename: opts?.basename,
            unstable_getContext: opts?.unstable_getContext,
            future: opts?.future,
            history: createBrowserHistory({ window: opts?.window }),
            hydrationData: opts?.hydrationData || parseHydrationData(),
            routes,
            mapRouteProperties,
            dataStrategy: opts?.dataStrategy,
            patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
            window: opts?.window,
        }).initialize();
    }
    /**
     * Create a new data router that manages the application path via the URL hash
     *
     * @category Data Routers
     */
    function createHashRouter(routes, opts) {
        return createRouter({
            basename: opts?.basename,
            unstable_getContext: opts?.unstable_getContext,
            future: opts?.future,
            history: createHashHistory({ window: opts?.window }),
            hydrationData: opts?.hydrationData || parseHydrationData(),
            routes,
            mapRouteProperties,
            dataStrategy: opts?.dataStrategy,
            patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
            window: opts?.window,
        }).initialize();
    }
    function parseHydrationData() {
        let state = window?.__staticRouterHydrationData;
        if (state && state.errors) {
            state = {
                ...state,
                errors: deserializeErrors$1(state.errors),
            };
        }
        return state;
    }
    function deserializeErrors$1(errors) {
        if (!errors)
            return null;
        let entries = Object.entries(errors);
        let serialized = {};
        for (let [key, val] of entries) {
            // Hey you!  If you change this, please change the corresponding logic in
            // serializeErrors in react-router-dom/server.tsx :)
            if (val && val.__type === "RouteErrorResponse") {
                serialized[key] = new ErrorResponseImpl(val.status, val.statusText, val.data, val.internal === true);
            }
            else if (val && val.__type === "Error") {
                // Attempt to reconstruct the right type of Error (i.e., ReferenceError)
                if (val.__subType) {
                    let ErrorConstructor = window[val.__subType];
                    if (typeof ErrorConstructor === "function") {
                        try {
                            // @ts-expect-error
                            let error = new ErrorConstructor(val.message);
                            // Wipe away the client-side stack trace.  Nothing to fill it in with
                            // because we don't serialize SSR stack traces for security reasons
                            error.stack = "";
                            serialized[key] = error;
                        }
                        catch (e) {
                            // no-op - fall through and create a normal Error
                        }
                    }
                }
                if (serialized[key] == null) {
                    let error = new Error(val.message);
                    // Wipe away the client-side stack trace.  Nothing to fill it in with
                    // because we don't serialize SSR stack traces for security reasons
                    error.stack = "";
                    serialized[key] = error;
                }
            }
            else {
                serialized[key] = val;
            }
        }
        return serialized;
    }
    /**
     * A `<Router>` for use in web browsers. Provides the cleanest URLs.
     *
     * @category Component Routers
     */
    function BrowserRouter({ basename, children, window, }) {
        let historyRef = React__namespace.useRef();
        if (historyRef.current == null) {
            historyRef.current = createBrowserHistory({ window, v5Compat: true });
        }
        let history = historyRef.current;
        let [state, setStateImpl] = React__namespace.useState({
            action: history.action,
            location: history.location,
        });
        let setState = React__namespace.useCallback((newState) => {
            React__namespace.startTransition(() => setStateImpl(newState));
        }, [setStateImpl]);
        React__namespace.useLayoutEffect(() => history.listen(setState), [history, setState]);
        return (React__namespace.createElement(Router, { basename: basename, children: children, location: state.location, navigationType: state.action, navigator: history }));
    }
    /**
     * A `<Router>` for use in web browsers. Stores the location in the hash
     * portion of the URL so it is not sent to the server.
     *
     * @category Component Routers
     */
    function HashRouter({ basename, children, window }) {
        let historyRef = React__namespace.useRef();
        if (historyRef.current == null) {
            historyRef.current = createHashHistory({ window, v5Compat: true });
        }
        let history = historyRef.current;
        let [state, setStateImpl] = React__namespace.useState({
            action: history.action,
            location: history.location,
        });
        let setState = React__namespace.useCallback((newState) => {
            React__namespace.startTransition(() => setStateImpl(newState));
        }, [setStateImpl]);
        React__namespace.useLayoutEffect(() => history.listen(setState), [history, setState]);
        return (React__namespace.createElement(Router, { basename: basename, children: children, location: state.location, navigationType: state.action, navigator: history }));
    }
    /**
     * A `<Router>` that accepts a pre-instantiated history object. It's important
     * to note that using your own history object is highly discouraged and may add
     * two versions of the history library to your bundles unless you use the same
     * version of the history library that React Router uses internally.
     *
     * @name unstable_HistoryRouter
     * @category Component Routers
     */
    function HistoryRouter({ basename, children, history, }) {
        let [state, setStateImpl] = React__namespace.useState({
            action: history.action,
            location: history.location,
        });
        let setState = React__namespace.useCallback((newState) => {
            React__namespace.startTransition(() => setStateImpl(newState));
        }, [setStateImpl]);
        React__namespace.useLayoutEffect(() => history.listen(setState), [history, setState]);
        return (React__namespace.createElement(Router, { basename: basename, children: children, location: state.location, navigationType: state.action, navigator: history }));
    }
    HistoryRouter.displayName = "unstable_HistoryRouter";
    const ABSOLUTE_URL_REGEX$1 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
    /**
      A progressively enhanced `<a href>` wrapper to enable navigation with client-side routing.

      ```tsx
      import { Link } from "react-router";

      <Link to="/dashboard">Dashboard</Link>;

      <Link
        to={{
          pathname: "/some/path",
          search: "?query=string",
          hash: "#hash",
        }}
      />
      ```

      @category Components
     */
    const Link = React__namespace.forwardRef(function LinkWithRef({ onClick, discover = "render", prefetch = "none", relative, reloadDocument, replace, state, target, to, preventScrollReset, viewTransition, ...rest }, forwardedRef) {
        let { basename } = React__namespace.useContext(NavigationContext);
        let isAbsolute = typeof to === "string" && ABSOLUTE_URL_REGEX$1.test(to);
        // Rendered into <a href> for absolute URLs
        let absoluteHref;
        let isExternal = false;
        if (typeof to === "string" && isAbsolute) {
            // Render the absolute href server- and client-side
            absoluteHref = to;
            // Only check for external origins client-side
            if (isBrowser) {
                try {
                    let currentUrl = new URL(window.location.href);
                    let targetUrl = to.startsWith("//")
                        ? new URL(currentUrl.protocol + to)
                        : new URL(to);
                    let path = stripBasename(targetUrl.pathname, basename);
                    if (targetUrl.origin === currentUrl.origin && path != null) {
                        // Strip the protocol/origin/basename for same-origin absolute URLs
                        to = path + targetUrl.search + targetUrl.hash;
                    }
                    else {
                        isExternal = true;
                    }
                }
                catch (e) {
                    // We can't do external URL detection without a valid URL
                    warning(false, `<Link to="${to}"> contains an invalid URL which will probably break ` +
                        `when clicked - please update to a valid URL path.`);
                }
            }
        }
        // Rendered into <a href> for relative URLs
        let href = useHref(to, { relative });
        let [shouldPrefetch, prefetchRef, prefetchHandlers] = usePrefetchBehavior(prefetch, rest);
        let internalOnClick = useLinkClickHandler(to, {
            replace,
            state,
            target,
            preventScrollReset,
            relative,
            viewTransition,
        });
        function handleClick(event) {
            if (onClick)
                onClick(event);
            if (!event.defaultPrevented) {
                internalOnClick(event);
            }
        }
        let link = (
        // eslint-disable-next-line jsx-a11y/anchor-has-content
        React__namespace.createElement("a", { ...rest, ...prefetchHandlers, href: absoluteHref || href, onClick: isExternal || reloadDocument ? onClick : handleClick, ref: mergeRefs(forwardedRef, prefetchRef), target: target, "data-discover": !isAbsolute && discover === "render" ? "true" : undefined }));
        return shouldPrefetch && !isAbsolute ? (React__namespace.createElement(React__namespace.Fragment, null,
            link,
            React__namespace.createElement(PrefetchPageLinks, { page: href }))) : (link);
    });
    Link.displayName = "Link";
    /**
      Wraps {@link Link | `<Link>`} with additional props for styling active and pending states.

      - Automatically applies classes to the link based on its active and pending states, see {@link NavLinkProps.className}.
      - Automatically applies `aria-current="page"` to the link when the link is active. See [`aria-current`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) on MDN.

      ```tsx
      import { NavLink } from "react-router"
      <NavLink to="/message" />
      ```

      States are available through the className, style, and children render props. See {@link NavLinkRenderProps}.

      ```tsx
      <NavLink
        to="/messages"
        className={({ isActive, isPending }) =>
          isPending ? "pending" : isActive ? "active" : ""
        }
      >
        Messages
      </NavLink>
      ```

      @category Components
     */
    const NavLink = React__namespace.forwardRef(function NavLinkWithRef({ "aria-current": ariaCurrentProp = "page", caseSensitive = false, className: classNameProp = "", end = false, style: styleProp, to, viewTransition, children, ...rest }, ref) {
        let path = useResolvedPath(to, { relative: rest.relative });
        let location = useLocation();
        let routerState = React__namespace.useContext(DataRouterStateContext);
        let { navigator, basename } = React__namespace.useContext(NavigationContext);
        let isTransitioning = routerState != null &&
            // Conditional usage is OK here because the usage of a data router is static
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useViewTransitionState(path) &&
            viewTransition === true;
        let toPathname = navigator.encodeLocation
            ? navigator.encodeLocation(path).pathname
            : path.pathname;
        let locationPathname = location.pathname;
        let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location
            ? routerState.navigation.location.pathname
            : null;
        if (!caseSensitive) {
            locationPathname = locationPathname.toLowerCase();
            nextLocationPathname = nextLocationPathname
                ? nextLocationPathname.toLowerCase()
                : null;
            toPathname = toPathname.toLowerCase();
        }
        if (nextLocationPathname && basename) {
            nextLocationPathname =
                stripBasename(nextLocationPathname, basename) || nextLocationPathname;
        }
        // If the `to` has a trailing slash, look at that exact spot.  Otherwise,
        // we're looking for a slash _after_ what's in `to`.  For example:
        //
        // <NavLink to="/users"> and <NavLink to="/users/">
        // both want to look for a / at index 6 to match URL `/users/matt`
        const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/")
            ? toPathname.length - 1
            : toPathname.length;
        let isActive = locationPathname === toPathname ||
            (!end &&
                locationPathname.startsWith(toPathname) &&
                locationPathname.charAt(endSlashPosition) === "/");
        let isPending = nextLocationPathname != null &&
            (nextLocationPathname === toPathname ||
                (!end &&
                    nextLocationPathname.startsWith(toPathname) &&
                    nextLocationPathname.charAt(toPathname.length) === "/"));
        let renderProps = {
            isActive,
            isPending,
            isTransitioning,
        };
        let ariaCurrent = isActive ? ariaCurrentProp : undefined;
        let className;
        if (typeof classNameProp === "function") {
            className = classNameProp(renderProps);
        }
        else {
            // If the className prop is not a function, we use a default `active`
            // class for <NavLink />s that are active. In v5 `active` was the default
            // value for `activeClassName`, but we are removing that API and can still
            // use the old default behavior for a cleaner upgrade path and keep the
            // simple styling rules working as they currently do.
            className = [
                classNameProp,
                isActive ? "active" : null,
                isPending ? "pending" : null,
                isTransitioning ? "transitioning" : null,
            ]
                .filter(Boolean)
                .join(" ");
        }
        let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
        return (React__namespace.createElement(Link, { ...rest, "aria-current": ariaCurrent, className: className, ref: ref, style: style, to: to, viewTransition: viewTransition }, typeof children === "function" ? children(renderProps) : children));
    });
    NavLink.displayName = "NavLink";
    /**

    A progressively enhanced HTML [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) that submits data to actions via `fetch`, activating pending states in `useNavigation` which enables advanced user interfaces beyond a basic HTML form. After a form's action completes, all data on the page is automatically revalidated to keep the UI in sync with the data.

    Because it uses the HTML form API, server rendered pages are interactive at a basic level before JavaScript loads. Instead of React Router managing the submission, the browser manages the submission as well as the pending states (like the spinning favicon). After JavaScript loads, React Router takes over enabling web application user experiences.

    Form is most useful for submissions that should also change the URL or otherwise add an entry to the browser history stack. For forms that shouldn't manipulate the browser history stack, use [`<fetcher.Form>`][fetcher_form].

    ```tsx
    import { Form } from "react-router";

    function NewEvent() {
      return (
        <Form action="/events" method="post">
          <input name="title" type="text" />
          <input name="description" type="text" />
        </Form>
      )
    }
    ```

    @category Components
    */
    const Form = React__namespace.forwardRef(({ discover = "render", fetcherKey, navigate, reloadDocument, replace, state, method = defaultMethod, action, onSubmit, relative, preventScrollReset, viewTransition, ...props }, forwardedRef) => {
        let submit = useSubmit();
        let formAction = useFormAction(action, { relative });
        let formMethod = method.toLowerCase() === "get" ? "get" : "post";
        let isAbsolute = typeof action === "string" && ABSOLUTE_URL_REGEX$1.test(action);
        let submitHandler = (event) => {
            onSubmit && onSubmit(event);
            if (event.defaultPrevented)
                return;
            event.preventDefault();
            let submitter = event.nativeEvent
                .submitter;
            let submitMethod = submitter?.getAttribute("formmethod") ||
                method;
            submit(submitter || event.currentTarget, {
                fetcherKey,
                method: submitMethod,
                navigate,
                replace,
                state,
                relative,
                preventScrollReset,
                viewTransition,
            });
        };
        return (React__namespace.createElement("form", { ref: forwardedRef, method: formMethod, action: formAction, onSubmit: reloadDocument ? onSubmit : submitHandler, ...props, "data-discover": !isAbsolute && discover === "render" ? "true" : undefined }));
    });
    Form.displayName = "Form";
    /**
      Emulates the browser's scroll restoration on location changes. Apps should only render one of these, right before the {@link Scripts} component.

      ```tsx
      import { ScrollRestoration } from "react-router";

      export default function Root() {
        return (
          <html>
            <body>
              <ScrollRestoration />
              <Scripts />
            </body>
          </html>
        );
      }
      ```

      This component renders an inline `<script>` to prevent scroll flashing. The `nonce` prop will be passed down to the script tag to allow CSP nonce usage.

      ```tsx
      <ScrollRestoration nonce={cspNonce} />
      ```

      @category Components
     */
    function ScrollRestoration({ getKey, storageKey, ...props }) {
        let remixContext = React__namespace.useContext(FrameworkContext);
        let { basename } = React__namespace.useContext(NavigationContext);
        let location = useLocation();
        let matches = useMatches();
        useScrollRestoration({ getKey, storageKey });
        // In order to support `getKey`, we need to compute a "key" here so we can
        // hydrate that up so that SSR scroll restoration isn't waiting on React to
        // hydrate. *However*, our key on the server is not the same as our key on
        // the client!  So if the user's getKey implementation returns the SSR
        // location key, then let's ignore it and let our inline <script> below pick
        // up the client side history state key
        let ssrKey = React__namespace.useMemo(() => {
            if (!remixContext || !getKey)
                return null;
            let userKey = getScrollRestorationKey(location, matches, basename, getKey);
            return userKey !== location.key ? userKey : null;
        }, 
        // Nah, we only need this the first time for the SSR render
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []);
        // In SPA Mode, there's nothing to restore on initial render since we didn't
        // render anything on the server
        if (!remixContext || remixContext.isSpaMode) {
            return null;
        }
        let restoreScroll = ((storageKey, restoreKey) => {
            if (!window.history.state || !window.history.state.key) {
                let key = Math.random().toString(32).slice(2);
                window.history.replaceState({ key }, "");
            }
            try {
                let positions = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
                let storedY = positions[restoreKey || window.history.state.key];
                if (typeof storedY === "number") {
                    window.scrollTo(0, storedY);
                }
            }
            catch (error) {
                console.error(error);
                sessionStorage.removeItem(storageKey);
            }
        }).toString();
        return (React__namespace.createElement("script", { ...props, suppressHydrationWarning: true, dangerouslySetInnerHTML: {
                __html: `(${restoreScroll})(${JSON.stringify(storageKey || SCROLL_RESTORATION_STORAGE_KEY)}, ${JSON.stringify(ssrKey)})`,
            } }));
    }
    ScrollRestoration.displayName = "ScrollRestoration";
    //#endregion
    ////////////////////////////////////////////////////////////////////////////////
    //#region Hooks
    ////////////////////////////////////////////////////////////////////////////////
    var DataRouterHook;
    (function (DataRouterHook) {
        DataRouterHook["UseScrollRestoration"] = "useScrollRestoration";
        DataRouterHook["UseSubmit"] = "useSubmit";
        DataRouterHook["UseSubmitFetcher"] = "useSubmitFetcher";
        DataRouterHook["UseFetcher"] = "useFetcher";
        DataRouterHook["useViewTransitionState"] = "useViewTransitionState";
    })(DataRouterHook || (DataRouterHook = {}));
    var DataRouterStateHook;
    (function (DataRouterStateHook) {
        DataRouterStateHook["UseFetcher"] = "useFetcher";
        DataRouterStateHook["UseFetchers"] = "useFetchers";
        DataRouterStateHook["UseScrollRestoration"] = "useScrollRestoration";
    })(DataRouterStateHook || (DataRouterStateHook = {}));
    // Internal hooks
    function getDataRouterConsoleError(hookName) {
        return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
    }
    function useDataRouterContext(hookName) {
        let ctx = React__namespace.useContext(DataRouterContext);
        invariant$2(ctx, getDataRouterConsoleError(hookName));
        return ctx;
    }
    function useDataRouterState(hookName) {
        let state = React__namespace.useContext(DataRouterStateContext);
        invariant$2(state, getDataRouterConsoleError(hookName));
        return state;
    }
    // External hooks
    /**
     * Handles the click behavior for router `<Link>` components. This is useful if
     * you need to create custom `<Link>` components with the same click behavior we
     * use in our exported `<Link>`.
     *
     * @category Hooks
     */
    function useLinkClickHandler(to, { target, replace: replaceProp, state, preventScrollReset, relative, viewTransition, } = {}) {
        let navigate = useNavigate();
        let location = useLocation();
        let path = useResolvedPath(to, { relative });
        return React__namespace.useCallback((event) => {
            if (shouldProcessLinkClick(event, target)) {
                event.preventDefault();
                // If the URL hasn't changed, a regular <a> will do a replace instead of
                // a push, so do the same here unless the replace prop is explicitly set
                let replace = replaceProp !== undefined
                    ? replaceProp
                    : createPath(location) === createPath(path);
                navigate(to, {
                    replace,
                    state,
                    preventScrollReset,
                    relative,
                    viewTransition,
                });
            }
        }, [
            location,
            navigate,
            path,
            replaceProp,
            state,
            target,
            to,
            preventScrollReset,
            relative,
            viewTransition,
        ]);
    }
    /**
      Returns a tuple of the current URL's {@link URLSearchParams} and a function to update them. Setting the search params causes a navigation.

      ```tsx
      import { useSearchParams } from "react-router";

      export function SomeComponent() {
        const [searchParams, setSearchParams] = useSearchParams();
        // ...
      }
      ```

     @category Hooks
     */
    function useSearchParams(defaultInit) {
        warning(typeof URLSearchParams !== "undefined", `You cannot use the \`useSearchParams\` hook in a browser that does not ` +
            `support the URLSearchParams API. If you need to support Internet ` +
            `Explorer 11, we recommend you load a polyfill such as ` +
            `https://github.com/ungap/url-search-params.`);
        let defaultSearchParamsRef = React__namespace.useRef(createSearchParams(defaultInit));
        let hasSetSearchParamsRef = React__namespace.useRef(false);
        let location = useLocation();
        let searchParams = React__namespace.useMemo(() => 
        // Only merge in the defaults if we haven't yet called setSearchParams.
        // Once we call that we want those to take precedence, otherwise you can't
        // remove a param with setSearchParams({}) if it has an initial value
        getSearchParamsForLocation(location.search, hasSetSearchParamsRef.current ? null : defaultSearchParamsRef.current), [location.search]);
        let navigate = useNavigate();
        let setSearchParams = React__namespace.useCallback((nextInit, navigateOptions) => {
            const newSearchParams = createSearchParams(typeof nextInit === "function" ? nextInit(searchParams) : nextInit);
            hasSetSearchParamsRef.current = true;
            navigate("?" + newSearchParams, navigateOptions);
        }, [navigate, searchParams]);
        return [searchParams, setSearchParams];
    }
    let fetcherId = 0;
    let getUniqueFetcherId = () => `__${String(++fetcherId)}__`;
    /**
      The imperative version of {@link Form | `<Form>`} that lets you submit a form from code instead of a user interaction.

      ```tsx
      import { useSubmit } from "react-router";

      function SomeComponent() {
        const submit = useSubmit();
        return (
          <Form
            onChange={(event) => {
              submit(event.currentTarget);
            }}
          />
        );
      }
      ```

      @category Hooks
     */
    function useSubmit() {
        let { router } = useDataRouterContext(DataRouterHook.UseSubmit);
        let { basename } = React__namespace.useContext(NavigationContext);
        let currentRouteId = useRouteId();
        return React__namespace.useCallback(async (target, options = {}) => {
            let { action, method, encType, formData, body } = getFormSubmissionInfo(target, basename);
            if (options.navigate === false) {
                let key = options.fetcherKey || getUniqueFetcherId();
                await router.fetch(key, currentRouteId, options.action || action, {
                    preventScrollReset: options.preventScrollReset,
                    formData,
                    body,
                    formMethod: options.method || method,
                    formEncType: options.encType || encType,
                    flushSync: options.flushSync,
                });
            }
            else {
                await router.navigate(options.action || action, {
                    preventScrollReset: options.preventScrollReset,
                    formData,
                    body,
                    formMethod: options.method || method,
                    formEncType: options.encType || encType,
                    replace: options.replace,
                    state: options.state,
                    fromRouteId: currentRouteId,
                    flushSync: options.flushSync,
                    viewTransition: options.viewTransition,
                });
            }
        }, [router, basename, currentRouteId]);
    }
    // v7: Eventually we should deprecate this entirely in favor of using the
    // router method directly?
    /**
      Resolves the URL to the closest route in the component hierarchy instead of the current URL of the app.

      This is used internally by {@link Form} resolve the action to the closest route, but can be used generically as well.

      ```tsx
      import { useFormAction } from "react-router";

      function SomeComponent() {
        // closest route URL
        let action = useFormAction();

        // closest route URL + "destroy"
        let destroyAction = useFormAction("destroy");
      }
      ```

      @category Hooks
     */
    function useFormAction(
    /**
     * The action to append to the closest route URL.
     */
    action, { relative } = {}) {
        let { basename } = React__namespace.useContext(NavigationContext);
        let routeContext = React__namespace.useContext(RouteContext);
        invariant$2(routeContext, "useFormAction must be used inside a RouteContext");
        let [match] = routeContext.matches.slice(-1);
        // Shallow clone path so we can modify it below, otherwise we modify the
        // object referenced by useMemo inside useResolvedPath
        let path = { ...useResolvedPath(action ? action : ".", { relative }) };
        // If no action was specified, browsers will persist current search params
        // when determining the path, so match that behavior
        // https://github.com/remix-run/remix/issues/927
        let location = useLocation();
        if (action == null) {
            // Safe to write to this directly here since if action was undefined, we
            // would have called useResolvedPath(".") which will never include a search
            path.search = location.search;
            // When grabbing search params from the URL, remove any included ?index param
            // since it might not apply to our contextual route.  We add it back based
            // on match.route.index below
            let params = new URLSearchParams(path.search);
            let indexValues = params.getAll("index");
            let hasNakedIndexParam = indexValues.some((v) => v === "");
            if (hasNakedIndexParam) {
                params.delete("index");
                indexValues.filter((v) => v).forEach((v) => params.append("index", v));
                let qs = params.toString();
                path.search = qs ? `?${qs}` : "";
            }
        }
        if ((!action || action === ".") && match.route.index) {
            path.search = path.search
                ? path.search.replace(/^\?/, "?index&")
                : "?index";
        }
        // If we're operating within a basename, prepend it to the pathname prior
        // to creating the form action.  If this is a root navigation, then just use
        // the raw basename which allows the basename to have full control over the
        // presence of a trailing slash on root actions
        if (basename !== "/") {
            path.pathname =
                path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
        }
        return createPath(path);
    }
    // TODO: (v7) Change the useFetcher generic default from `any` to `unknown`
    /**
      Useful for creating complex, dynamic user interfaces that require multiple, concurrent data interactions without causing a navigation.

      Fetchers track their own, independent state and can be used to load data, submit forms, and generally interact with loaders and actions.

      ```tsx
      import { useFetcher } from "react-router"

      function SomeComponent() {
        let fetcher = useFetcher()

        // states are available on the fetcher
        fetcher.state // "idle" | "loading" | "submitting"
        fetcher.data // the data returned from the action or loader

        // render a form
        <fetcher.Form method="post" />

        // load data
        fetcher.load("/some/route")

        // submit data
        fetcher.submit(someFormRef, { method: "post" })
        fetcher.submit(someData, {
          method: "post",
          encType: "application/json"
        })
      }
      ```

      @category Hooks
     */
    function useFetcher({ key, } = {}) {
        let { router } = useDataRouterContext(DataRouterHook.UseFetcher);
        let state = useDataRouterState(DataRouterStateHook.UseFetcher);
        let fetcherData = React__namespace.useContext(FetchersContext);
        let route = React__namespace.useContext(RouteContext);
        let routeId = route.matches[route.matches.length - 1]?.route.id;
        invariant$2(fetcherData, `useFetcher must be used inside a FetchersContext`);
        invariant$2(route, `useFetcher must be used inside a RouteContext`);
        invariant$2(routeId != null, `useFetcher can only be used on routes that contain a unique "id"`);
        // Fetcher key handling
        let defaultKey = React__namespace.useId();
        let [fetcherKey, setFetcherKey] = React__namespace.useState(key || defaultKey);
        if (key && key !== fetcherKey) {
            setFetcherKey(key);
        }
        // Registration/cleanup
        React__namespace.useEffect(() => {
            router.getFetcher(fetcherKey);
            return () => router.deleteFetcher(fetcherKey);
        }, [router, fetcherKey]);
        // Fetcher additions
        let load = React__namespace.useCallback(async (href, opts) => {
            invariant$2(routeId, "No routeId available for fetcher.load()");
            await router.fetch(fetcherKey, routeId, href, opts);
        }, [fetcherKey, routeId, router]);
        let submitImpl = useSubmit();
        let submit = React__namespace.useCallback(async (target, opts) => {
            await submitImpl(target, {
                ...opts,
                navigate: false,
                fetcherKey,
            });
        }, [fetcherKey, submitImpl]);
        let FetcherForm = React__namespace.useMemo(() => {
            let FetcherForm = React__namespace.forwardRef((props, ref) => {
                return (React__namespace.createElement(Form, { ...props, navigate: false, fetcherKey: fetcherKey, ref: ref }));
            });
            FetcherForm.displayName = "fetcher.Form";
            return FetcherForm;
        }, [fetcherKey]);
        // Exposed FetcherWithComponents
        let fetcher = state.fetchers.get(fetcherKey) || IDLE_FETCHER;
        let data = fetcherData.get(fetcherKey);
        let fetcherWithComponents = React__namespace.useMemo(() => ({
            Form: FetcherForm,
            submit,
            load,
            ...fetcher,
            data,
        }), [FetcherForm, submit, load, fetcher, data]);
        return fetcherWithComponents;
    }
    /**
      Returns an array of all in-flight fetchers. This is useful for components throughout the app that didn't create the fetchers but want to use their submissions to participate in optimistic UI.

      ```tsx
      import { useFetchers } from "react-router";

      function SomeComponent() {
        const fetchers = useFetchers();
        fetchers[0].formData; // FormData
        fetchers[0].state; // etc.
        // ...
      }
      ```

      @category Hooks
     */
    function useFetchers() {
        let state = useDataRouterState(DataRouterStateHook.UseFetchers);
        return Array.from(state.fetchers.entries()).map(([key, fetcher]) => ({
            ...fetcher,
            key,
        }));
    }
    const SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
    let savedScrollPositions = {};
    function getScrollRestorationKey(location, matches, basename, getKey) {
        let key = null;
        if (getKey) {
            if (basename !== "/") {
                key = getKey({
                    ...location,
                    pathname: stripBasename(location.pathname, basename) || location.pathname,
                }, matches);
            }
            else {
                key = getKey(location, matches);
            }
        }
        if (key == null) {
            key = location.key;
        }
        return key;
    }
    /**
     * When rendered inside a RouterProvider, will restore scroll positions on navigations
     */
    function useScrollRestoration({ getKey, storageKey, } = {}) {
        let { router } = useDataRouterContext(DataRouterHook.UseScrollRestoration);
        let { restoreScrollPosition, preventScrollReset } = useDataRouterState(DataRouterStateHook.UseScrollRestoration);
        let { basename } = React__namespace.useContext(NavigationContext);
        let location = useLocation();
        let matches = useMatches();
        let navigation = useNavigation();
        // Trigger manual scroll restoration while we're active
        React__namespace.useEffect(() => {
            window.history.scrollRestoration = "manual";
            return () => {
                window.history.scrollRestoration = "auto";
            };
        }, []);
        // Save positions on pagehide
        usePageHide(React__namespace.useCallback(() => {
            if (navigation.state === "idle") {
                let key = getScrollRestorationKey(location, matches, basename, getKey);
                savedScrollPositions[key] = window.scrollY;
            }
            try {
                sessionStorage.setItem(storageKey || SCROLL_RESTORATION_STORAGE_KEY, JSON.stringify(savedScrollPositions));
            }
            catch (error) {
                warning(false, `Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (${error}).`);
            }
            window.history.scrollRestoration = "auto";
        }, [navigation.state, getKey, basename, location, matches, storageKey]));
        // Read in any saved scroll locations
        if (typeof document !== "undefined") {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            React__namespace.useLayoutEffect(() => {
                try {
                    let sessionPositions = sessionStorage.getItem(storageKey || SCROLL_RESTORATION_STORAGE_KEY);
                    if (sessionPositions) {
                        savedScrollPositions = JSON.parse(sessionPositions);
                    }
                }
                catch (e) {
                    // no-op, use default empty object
                }
            }, [storageKey]);
            // Enable scroll restoration in the router
            // eslint-disable-next-line react-hooks/rules-of-hooks
            React__namespace.useLayoutEffect(() => {
                let disableScrollRestoration = router?.enableScrollRestoration(savedScrollPositions, () => window.scrollY, getKey
                    ? (location, matches) => getScrollRestorationKey(location, matches, basename, getKey)
                    : undefined);
                return () => disableScrollRestoration && disableScrollRestoration();
            }, [router, basename, getKey]);
            // Restore scrolling when state.restoreScrollPosition changes
            // eslint-disable-next-line react-hooks/rules-of-hooks
            React__namespace.useLayoutEffect(() => {
                // Explicit false means don't do anything (used for submissions)
                if (restoreScrollPosition === false) {
                    return;
                }
                // been here before, scroll to it
                if (typeof restoreScrollPosition === "number") {
                    window.scrollTo(0, restoreScrollPosition);
                    return;
                }
                // try to scroll to the hash
                if (location.hash) {
                    let el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
                    if (el) {
                        el.scrollIntoView();
                        return;
                    }
                }
                // Don't reset if this navigation opted out
                if (preventScrollReset === true) {
                    return;
                }
                // otherwise go to the top on new locations
                window.scrollTo(0, 0);
            }, [location, restoreScrollPosition, preventScrollReset]);
        }
    }
    /**
     * Setup a callback to be fired on the window's `beforeunload` event.
     *
     * @category Hooks
     */
    function useBeforeUnload(callback, options) {
        let { capture } = options || {};
        React__namespace.useEffect(() => {
            let opts = capture != null ? { capture } : undefined;
            window.addEventListener("beforeunload", callback, opts);
            return () => {
                window.removeEventListener("beforeunload", callback, opts);
            };
        }, [callback, capture]);
    }
    /**
     * Setup a callback to be fired on the window's `pagehide` event. This is
     * useful for saving some data to `window.localStorage` just before the page
     * refreshes.  This event is better supported than beforeunload across browsers.
     *
     * Note: The `callback` argument should be a function created with
     * `React.useCallback()`.
     */
    function usePageHide(callback, options) {
        let { capture } = {};
        React__namespace.useEffect(() => {
            let opts = capture != null ? { capture } : undefined;
            window.addEventListener("pagehide", callback, opts);
            return () => {
                window.removeEventListener("pagehide", callback, opts);
            };
        }, [callback, capture]);
    }
    /**
      Wrapper around useBlocker to show a window.confirm prompt to users instead of building a custom UI with {@link useBlocker}.

      The `unstable_` flag will not be removed because this technique has a lot of rough edges and behaves very differently (and incorrectly sometimes) across browsers if users click addition back/forward navigations while the confirmation is open.  Use at your own risk.

      ```tsx
      function ImportantForm() {
        let [value, setValue] = React.useState("");

        // Block navigating elsewhere when data has been entered into the input
        unstable_usePrompt({
          message: "Are you sure?",
          when: ({ currentLocation, nextLocation }) =>
            value !== "" &&
            currentLocation.pathname !== nextLocation.pathname,
        });

        return (
          <Form method="post">
            <label>
              Enter some important data:
              <input
                name="data"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            <button type="submit">Save</button>
          </Form>
        );
      }
      ```

      @category Hooks
      @name unstable_usePrompt
     */
    function usePrompt({ when, message, }) {
        let blocker = useBlocker(when);
        React__namespace.useEffect(() => {
            if (blocker.state === "blocked") {
                let proceed = window.confirm(message);
                if (proceed) {
                    // This timeout is needed to avoid a weird "race" on POP navigations
                    // between the `window.history` revert navigation and the result of
                    // `window.confirm`
                    setTimeout(blocker.proceed, 0);
                }
                else {
                    blocker.reset();
                }
            }
        }, [blocker, message]);
        React__namespace.useEffect(() => {
            if (blocker.state === "blocked" && !when) {
                blocker.reset();
            }
        }, [blocker, when]);
    }
    /**
      This hook returns `true` when there is an active [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) to the specified location. This can be used to apply finer-grained styles to elements to further customize the view transition. This requires that view transitions have been enabled for the given navigation via {@link LinkProps.viewTransition} (or the `Form`, `submit`, or `navigate` call)

      @category Hooks
      @name useViewTransitionState
     */
    function useViewTransitionState(to, opts = {}) {
        let vtContext = React__namespace.useContext(ViewTransitionContext);
        invariant$2(vtContext != null, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  " +
            "Did you accidentally import `RouterProvider` from `react-router`?");
        let { basename } = useDataRouterContext(DataRouterHook.useViewTransitionState);
        let path = useResolvedPath(to, { relative: opts.relative });
        if (!vtContext.isTransitioning) {
            return false;
        }
        let currentPath = stripBasename(vtContext.currentLocation.pathname, basename) ||
            vtContext.currentLocation.pathname;
        let nextPath = stripBasename(vtContext.nextLocation.pathname, basename) ||
            vtContext.nextLocation.pathname;
        // Transition is active if we're going to or coming from the indicated
        // destination.  This ensures that other PUSH navigations that reverse
        // an indicated transition apply.  I.e., on the list view you have:
        //
        //   <NavLink to="/details/1" viewTransition>
        //
        // If you click the breadcrumb back to the list view:
        //
        //   <NavLink to="/list" viewTransition>
        //
        // We should apply the transition because it's indicated as active going
        // from /list -> /details/1 and therefore should be active on the reverse
        // (even though this isn't strictly a POP reverse)
        return (matchPath(path.pathname, nextPath) != null ||
            matchPath(path.pathname, currentPath) != null);
    }
    //#endregion

    /**
     * A `<Router>` that may not navigate to any other location. This is useful
     * on the server where there is no stateful UI.
     *
     * @category Component Routers
     */
    function StaticRouter({ basename, children, location: locationProp = "/", }) {
        if (typeof locationProp === "string") {
            locationProp = parsePath(locationProp);
        }
        let action = exports.NavigationType.Pop;
        let location = {
            pathname: locationProp.pathname || "/",
            search: locationProp.search || "",
            hash: locationProp.hash || "",
            state: locationProp.state != null ? locationProp.state : null,
            key: locationProp.key || "default",
        };
        let staticNavigator = getStatelessNavigator();
        return (React__namespace.createElement(Router, { basename: basename, children: children, location: location, navigationType: action, navigator: staticNavigator, static: true }));
    }
    /**
     * A Data Router that may not navigate to any other location. This is useful
     * on the server where there is no stateful UI.
     *
     * @category Component Routers
     */
    function StaticRouterProvider({ context, router, hydrate = true, nonce, }) {
        invariant$2(router && context, "You must provide `router` and `context` to <StaticRouterProvider>");
        let dataRouterContext = {
            router,
            navigator: getStatelessNavigator(),
            static: true,
            staticContext: context,
            basename: context.basename || "/",
        };
        let fetchersContext = new Map();
        let hydrateScript = "";
        if (hydrate !== false) {
            let data = {
                loaderData: context.loaderData,
                actionData: context.actionData,
                errors: serializeErrors$1(context.errors),
            };
            // Use JSON.parse here instead of embedding a raw JS object here to speed
            // up parsing on the client.  Dual-stringify is needed to ensure all quotes
            // are properly escaped in the resulting string.  See:
            //   https://v8.dev/blog/cost-of-javascript-2019#json
            let json = htmlEscape(JSON.stringify(JSON.stringify(data)));
            hydrateScript = `window.__staticRouterHydrationData = JSON.parse(${json});`;
        }
        let { state } = dataRouterContext.router;
        return (React__namespace.createElement(React__namespace.Fragment, null,
            React__namespace.createElement(DataRouterContext.Provider, { value: dataRouterContext },
                React__namespace.createElement(DataRouterStateContext.Provider, { value: state },
                    React__namespace.createElement(FetchersContext.Provider, { value: fetchersContext },
                        React__namespace.createElement(ViewTransitionContext.Provider, { value: { isTransitioning: false } },
                            React__namespace.createElement(Router, { basename: dataRouterContext.basename, location: state.location, navigationType: state.historyAction, navigator: dataRouterContext.navigator, static: dataRouterContext.static },
                                React__namespace.createElement(DataRoutes, { routes: router.routes, future: router.future, state: state })))))),
            hydrateScript ? (React__namespace.createElement("script", { suppressHydrationWarning: true, nonce: nonce, dangerouslySetInnerHTML: { __html: hydrateScript } })) : null));
    }
    function DataRoutes({ routes, future, state, }) {
        return useRoutesImpl(routes, undefined, state, future);
    }
    function serializeErrors$1(errors) {
        if (!errors)
            return null;
        let entries = Object.entries(errors);
        let serialized = {};
        for (let [key, val] of entries) {
            // Hey you!  If you change this, please change the corresponding logic in
            // deserializeErrors in react-router-dom/index.tsx :)
            if (isRouteErrorResponse(val)) {
                serialized[key] = { ...val, __type: "RouteErrorResponse" };
            }
            else if (val instanceof Error) {
                // Do not serialize stack traces from SSR for security reasons
                serialized[key] = {
                    message: val.message,
                    __type: "Error",
                    // If this is a subclass (i.e., ReferenceError), send up the type so we
                    // can re-create the same type during hydration.
                    ...(val.name !== "Error"
                        ? {
                            __subType: val.name,
                        }
                        : {}),
                };
            }
            else {
                serialized[key] = val;
            }
        }
        return serialized;
    }
    function getStatelessNavigator() {
        return {
            createHref,
            encodeLocation,
            push(to) {
                throw new Error(`You cannot use navigator.push() on the server because it is a stateless ` +
                    `environment. This error was probably triggered when you did a ` +
                    `\`navigate(${JSON.stringify(to)})\` somewhere in your app.`);
            },
            replace(to) {
                throw new Error(`You cannot use navigator.replace() on the server because it is a stateless ` +
                    `environment. This error was probably triggered when you did a ` +
                    `\`navigate(${JSON.stringify(to)}, { replace: true })\` somewhere ` +
                    `in your app.`);
            },
            go(delta) {
                throw new Error(`You cannot use navigator.go() on the server because it is a stateless ` +
                    `environment. This error was probably triggered when you did a ` +
                    `\`navigate(${delta})\` somewhere in your app.`);
            },
            back() {
                throw new Error(`You cannot use navigator.back() on the server because it is a stateless ` +
                    `environment.`);
            },
            forward() {
                throw new Error(`You cannot use navigator.forward() on the server because it is a stateless ` +
                    `environment.`);
            },
        };
    }
    /**
     * @category Utils
     */
    function createStaticHandler(routes, opts) {
        return createStaticHandler$1(routes, {
            ...opts,
            mapRouteProperties,
        });
    }
    /**
     * @category Data Routers
     */
    function createStaticRouter(routes, context, opts = {}) {
        let manifest = {};
        let dataRoutes = convertRoutesToDataRoutes(routes, mapRouteProperties, undefined, manifest);
        // Because our context matches may be from a framework-agnostic set of
        // routes passed to createStaticHandler(), we update them here with our
        // newly created/enhanced data routes
        let matches = context.matches.map((match) => {
            let route = manifest[match.route.id] || match.route;
            return {
                ...match,
                route,
            };
        });
        let msg = (method) => `You cannot use router.${method}() on the server because it is a stateless environment`;
        return {
            get basename() {
                return context.basename;
            },
            get future() {
                return {
                    unstable_middleware: false,
                    ...opts?.future,
                };
            },
            get state() {
                return {
                    historyAction: exports.NavigationType.Pop,
                    location: context.location,
                    matches,
                    loaderData: context.loaderData,
                    actionData: context.actionData,
                    errors: context.errors,
                    initialized: true,
                    navigation: IDLE_NAVIGATION,
                    restoreScrollPosition: null,
                    preventScrollReset: false,
                    revalidation: "idle",
                    fetchers: new Map(),
                    blockers: new Map(),
                };
            },
            get routes() {
                return dataRoutes;
            },
            get window() {
                return undefined;
            },
            initialize() {
                throw msg("initialize");
            },
            subscribe() {
                throw msg("subscribe");
            },
            enableScrollRestoration() {
                throw msg("enableScrollRestoration");
            },
            navigate() {
                throw msg("navigate");
            },
            fetch() {
                throw msg("fetch");
            },
            revalidate() {
                throw msg("revalidate");
            },
            createHref,
            encodeLocation,
            getFetcher() {
                return IDLE_FETCHER;
            },
            deleteFetcher() {
                throw msg("deleteFetcher");
            },
            dispose() {
                throw msg("dispose");
            },
            getBlocker() {
                return IDLE_BLOCKER;
            },
            deleteBlocker() {
                throw msg("deleteBlocker");
            },
            patchRoutes() {
                throw msg("patchRoutes");
            },
            _internalFetchControllers: new Map(),
            _internalSetRoutes() {
                throw msg("_internalSetRoutes");
            },
        };
    }
    function createHref(to) {
        return typeof to === "string" ? to : createPath(to);
    }
    function encodeLocation(to) {
        let href = typeof to === "string" ? to : createPath(to);
        // Treating this as a full URL will strip any trailing spaces so we need to
        // pre-encode them since they might be part of a matching splat param from
        // an ancestor route
        href = href.replace(/ $/, "%20");
        let encoded = ABSOLUTE_URL_REGEX.test(href)
            ? new URL(href)
            : new URL(href, "http://localhost");
        return {
            pathname: encoded.pathname,
            search: encoded.search,
            hash: encoded.hash,
        };
    }
    const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
    // This utility is based on https://github.com/zertosh/htmlescape
    // License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE
    const ESCAPE_LOOKUP$1 = {
        "&": "\\u0026",
        ">": "\\u003e",
        "<": "\\u003c",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029",
    };
    const ESCAPE_REGEX$1 = /[&><\u2028\u2029]/g;
    function htmlEscape(str) {
        return str.replace(ESCAPE_REGEX$1, (match) => ESCAPE_LOOKUP$1[match]);
    }

    /**
     * The entry point for a Remix app when it is rendered on the server (in
     * `app/entry.server.js`). This component is used to generate the HTML in the
     * response from the server.
     *
     * @category Components
     */
    function ServerRouter({ context, url, nonce, }) {
        if (typeof url === "string") {
            url = new URL(url);
        }
        let { manifest, routeModules, criticalCss, serverHandoffString } = context;
        let routes = createServerRoutes(manifest.routes, routeModules, context.future, context.isSpaMode);
        // Create a shallow clone of `loaderData` we can mutate for partial hydration.
        // When a route exports a `clientLoader` and a `HydrateFallback`, we want to
        // render the fallback on the server so we clear our the `loaderData` during SSR.
        // Is it important not to change the `context` reference here since we use it
        // for context._deepestRenderedBoundaryId tracking
        context.staticHandlerContext.loaderData = {
            ...context.staticHandlerContext.loaderData,
        };
        for (let match of context.staticHandlerContext.matches) {
            let routeId = match.route.id;
            let route = routeModules[routeId];
            let manifestRoute = context.manifest.routes[routeId];
            // Clear out the loaderData to avoid rendering the route component when the
            // route opted into clientLoader hydration and either:
            // * gave us a HydrateFallback
            // * or doesn't have a server loader and we have no data to render
            if (route &&
                manifestRoute &&
                shouldHydrateRouteLoader(manifestRoute, route, context.isSpaMode) &&
                (route.HydrateFallback || !manifestRoute.hasLoader)) {
                delete context.staticHandlerContext.loaderData[routeId];
            }
        }
        let router = createStaticRouter(routes, context.staticHandlerContext);
        return (React__namespace.createElement(React__namespace.Fragment, null,
            React__namespace.createElement(FrameworkContext.Provider, { value: {
                    manifest,
                    routeModules,
                    criticalCss,
                    serverHandoffString,
                    future: context.future,
                    ssr: context.ssr,
                    isSpaMode: context.isSpaMode,
                    serializeError: context.serializeError,
                    renderMeta: context.renderMeta,
                } },
                React__namespace.createElement(RemixErrorBoundary, { location: router.state.location },
                    React__namespace.createElement(StaticRouterProvider, { router: router, context: context.staticHandlerContext, hydrate: false }))),
            context.serverHandoffStream ? (React__namespace.createElement(React__namespace.Suspense, null,
                React__namespace.createElement(StreamTransfer, { context: context, identifier: 0, reader: context.serverHandoffStream.getReader(), textDecoder: new TextDecoder(), nonce: nonce }))) : null));
    }

    /**
     * @category Utils
     */
    function createRoutesStub(routes, unstable_getContext) {
        return function RoutesTestStub({ initialEntries, initialIndex, hydrationData, future, }) {
            let routerRef = React__namespace.useRef();
            let remixContextRef = React__namespace.useRef();
            if (routerRef.current == null) {
                remixContextRef.current = {
                    future: {
                        unstable_subResourceIntegrity: future?.unstable_subResourceIntegrity === true,
                        unstable_middleware: future?.unstable_middleware === true,
                    },
                    manifest: {
                        routes: {},
                        entry: { imports: [], module: "" },
                        url: "",
                        version: "",
                    },
                    routeModules: {},
                    ssr: false,
                    isSpaMode: false,
                };
                // Update the routes to include context in the loader/action and populate
                // the manifest and routeModules during the walk
                let patched = processRoutes(
                // @ts-expect-error `StubRouteObject` is stricter about `loader`/`action`
                // types compared to `AgnosticRouteObject`
                convertRoutesToDataRoutes(routes, (r) => r), remixContextRef.current.manifest, remixContextRef.current.routeModules);
                routerRef.current = createMemoryRouter(patched, {
                    unstable_getContext,
                    initialEntries,
                    initialIndex,
                    hydrationData,
                });
            }
            return (React__namespace.createElement(FrameworkContext.Provider, { value: remixContextRef.current },
                React__namespace.createElement(RouterProvider, { router: routerRef.current })));
        };
    }
    function processRoutes(routes, manifest, routeModules, parentId) {
        return routes.map((route) => {
            if (!route.id) {
                throw new Error("Expected a route.id in @remix-run/testing processRoutes() function");
            }
            let newRoute = {
                id: route.id,
                path: route.path,
                index: route.index,
                Component: route.Component,
                HydrateFallback: route.HydrateFallback,
                ErrorBoundary: route.ErrorBoundary,
                action: route.action,
                loader: route.loader,
                handle: route.handle,
                shouldRevalidate: route.shouldRevalidate,
            };
            // Add the EntryRoute to the manifest
            let entryRoute = {
                id: route.id,
                path: route.path,
                index: route.index,
                parentId,
                hasAction: route.action != null,
                hasLoader: route.loader != null,
                // When testing routes, you should be stubbing loader/action/middleware,
                // not trying to re-implement the full loader/clientLoader/SSR/hydration
                // flow. That is better tested via E2E tests.
                hasClientAction: false,
                hasClientLoader: false,
                hasClientMiddleware: false,
                hasErrorBoundary: route.ErrorBoundary != null,
                // any need for these?
                module: "build/stub-path-to-module.js",
                clientActionModule: undefined,
                clientLoaderModule: undefined,
                clientMiddlewareModule: undefined,
                hydrateFallbackModule: undefined,
            };
            manifest.routes[newRoute.id] = entryRoute;
            // Add the route to routeModules
            routeModules[route.id] = {
                default: route.Component || Outlet,
                ErrorBoundary: route.ErrorBoundary || undefined,
                handle: route.handle,
                links: route.links,
                meta: route.meta,
                shouldRevalidate: route.shouldRevalidate,
            };
            if (route.children) {
                newRoute.children = processRoutes(route.children, manifest, routeModules, newRoute.id);
            }
            return newRoute;
        });
    }

    var dist = {};

    var hasRequiredDist;

    function requireDist () {
    	if (hasRequiredDist) return dist;
    	hasRequiredDist = 1;
    	Object.defineProperty(dist, "__esModule", { value: true });
    	dist.parse = parse;
    	dist.serialize = serialize;
    	/**
    	 * RegExp to match cookie-name in RFC 6265 sec 4.1.1
    	 * This refers out to the obsoleted definition of token in RFC 2616 sec 2.2
    	 * which has been replaced by the token definition in RFC 7230 appendix B.
    	 *
    	 * cookie-name       = token
    	 * token             = 1*tchar
    	 * tchar             = "!" / "#" / "$" / "%" / "&" / "'" /
    	 *                     "*" / "+" / "-" / "." / "^" / "_" /
    	 *                     "`" / "|" / "~" / DIGIT / ALPHA
    	 */
    	const cookieNameRegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
    	/**
    	 * RegExp to match cookie-value in RFC 6265 sec 4.1.1
    	 *
    	 * cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
    	 * cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
    	 *                     ; US-ASCII characters excluding CTLs,
    	 *                     ; whitespace DQUOTE, comma, semicolon,
    	 *                     ; and backslash
    	 */
    	const cookieValueRegExp = /^("?)[\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]*\1$/;
    	/**
    	 * RegExp to match domain-value in RFC 6265 sec 4.1.1
    	 *
    	 * domain-value      = <subdomain>
    	 *                     ; defined in [RFC1034], Section 3.5, as
    	 *                     ; enhanced by [RFC1123], Section 2.1
    	 * <subdomain>       = <label> | <subdomain> "." <label>
    	 * <label>           = <let-dig> [ [ <ldh-str> ] <let-dig> ]
    	 *                     Labels must be 63 characters or less.
    	 *                     'let-dig' not 'letter' in the first char, per RFC1123
    	 * <ldh-str>         = <let-dig-hyp> | <let-dig-hyp> <ldh-str>
    	 * <let-dig-hyp>     = <let-dig> | "-"
    	 * <let-dig>         = <letter> | <digit>
    	 * <letter>          = any one of the 52 alphabetic characters A through Z in
    	 *                     upper case and a through z in lower case
    	 * <digit>           = any one of the ten digits 0 through 9
    	 *
    	 * Keep support for leading dot: https://github.com/jshttp/cookie/issues/173
    	 *
    	 * > (Note that a leading %x2E ("."), if present, is ignored even though that
    	 * character is not permitted, but a trailing %x2E ("."), if present, will
    	 * cause the user agent to ignore the attribute.)
    	 */
    	const domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    	/**
    	 * RegExp to match path-value in RFC 6265 sec 4.1.1
    	 *
    	 * path-value        = <any CHAR except CTLs or ";">
    	 * CHAR              = %x01-7F
    	 *                     ; defined in RFC 5234 appendix B.1
    	 */
    	const pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    	const __toString = Object.prototype.toString;
    	const NullObject = /* @__PURE__ */ (() => {
    	    const C = function () { };
    	    C.prototype = Object.create(null);
    	    return C;
    	})();
    	/**
    	 * Parse a cookie header.
    	 *
    	 * Parse the given cookie header string into an object
    	 * The object has the various cookies as keys(names) => values
    	 */
    	function parse(str, options) {
    	    const obj = new NullObject();
    	    const len = str.length;
    	    // RFC 6265 sec 4.1.1, RFC 2616 2.2 defines a cookie name consists of one char minimum, plus '='.
    	    if (len < 2)
    	        return obj;
    	    const dec = options?.decode || decode;
    	    let index = 0;
    	    do {
    	        const eqIdx = str.indexOf("=", index);
    	        if (eqIdx === -1)
    	            break; // No more cookie pairs.
    	        const colonIdx = str.indexOf(";", index);
    	        const endIdx = colonIdx === -1 ? len : colonIdx;
    	        if (eqIdx > endIdx) {
    	            // backtrack on prior semicolon
    	            index = str.lastIndexOf(";", eqIdx - 1) + 1;
    	            continue;
    	        }
    	        const keyStartIdx = startIndex(str, index, eqIdx);
    	        const keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
    	        const key = str.slice(keyStartIdx, keyEndIdx);
    	        // only assign once
    	        if (obj[key] === undefined) {
    	            let valStartIdx = startIndex(str, eqIdx + 1, endIdx);
    	            let valEndIdx = endIndex(str, endIdx, valStartIdx);
    	            const value = dec(str.slice(valStartIdx, valEndIdx));
    	            obj[key] = value;
    	        }
    	        index = endIdx + 1;
    	    } while (index < len);
    	    return obj;
    	}
    	function startIndex(str, index, max) {
    	    do {
    	        const code = str.charCodeAt(index);
    	        if (code !== 0x20 /*   */ && code !== 0x09 /* \t */)
    	            return index;
    	    } while (++index < max);
    	    return max;
    	}
    	function endIndex(str, index, min) {
    	    while (index > min) {
    	        const code = str.charCodeAt(--index);
    	        if (code !== 0x20 /*   */ && code !== 0x09 /* \t */)
    	            return index + 1;
    	    }
    	    return min;
    	}
    	/**
    	 * Serialize data into a cookie header.
    	 *
    	 * Serialize a name value pair into a cookie string suitable for
    	 * http headers. An optional options object specifies cookie parameters.
    	 *
    	 * serialize('foo', 'bar', { httpOnly: true })
    	 *   => "foo=bar; httpOnly"
    	 */
    	function serialize(name, val, options) {
    	    const enc = options?.encode || encodeURIComponent;
    	    if (!cookieNameRegExp.test(name)) {
    	        throw new TypeError(`argument name is invalid: ${name}`);
    	    }
    	    const value = enc(val);
    	    if (!cookieValueRegExp.test(value)) {
    	        throw new TypeError(`argument val is invalid: ${val}`);
    	    }
    	    let str = name + "=" + value;
    	    if (!options)
    	        return str;
    	    if (options.maxAge !== undefined) {
    	        if (!Number.isInteger(options.maxAge)) {
    	            throw new TypeError(`option maxAge is invalid: ${options.maxAge}`);
    	        }
    	        str += "; Max-Age=" + options.maxAge;
    	    }
    	    if (options.domain) {
    	        if (!domainValueRegExp.test(options.domain)) {
    	            throw new TypeError(`option domain is invalid: ${options.domain}`);
    	        }
    	        str += "; Domain=" + options.domain;
    	    }
    	    if (options.path) {
    	        if (!pathValueRegExp.test(options.path)) {
    	            throw new TypeError(`option path is invalid: ${options.path}`);
    	        }
    	        str += "; Path=" + options.path;
    	    }
    	    if (options.expires) {
    	        if (!isDate(options.expires) ||
    	            !Number.isFinite(options.expires.valueOf())) {
    	            throw new TypeError(`option expires is invalid: ${options.expires}`);
    	        }
    	        str += "; Expires=" + options.expires.toUTCString();
    	    }
    	    if (options.httpOnly) {
    	        str += "; HttpOnly";
    	    }
    	    if (options.secure) {
    	        str += "; Secure";
    	    }
    	    if (options.partitioned) {
    	        str += "; Partitioned";
    	    }
    	    if (options.priority) {
    	        const priority = typeof options.priority === "string"
    	            ? options.priority.toLowerCase()
    	            : options.sameSite;
    	        switch (priority) {
    	            case "low":
    	                str += "; Priority=Low";
    	                break;
    	            case "medium":
    	                str += "; Priority=Medium";
    	                break;
    	            case "high":
    	                str += "; Priority=High";
    	                break;
    	            default:
    	                throw new TypeError(`option priority is invalid: ${options.priority}`);
    	        }
    	    }
    	    if (options.sameSite) {
    	        const sameSite = typeof options.sameSite === "string"
    	            ? options.sameSite.toLowerCase()
    	            : options.sameSite;
    	        switch (sameSite) {
    	            case true:
    	            case "strict":
    	                str += "; SameSite=Strict";
    	                break;
    	            case "lax":
    	                str += "; SameSite=Lax";
    	                break;
    	            case "none":
    	                str += "; SameSite=None";
    	                break;
    	            default:
    	                throw new TypeError(`option sameSite is invalid: ${options.sameSite}`);
    	        }
    	    }
    	    return str;
    	}
    	/**
    	 * URL-decode string value. Optimized to skip native call when no %.
    	 */
    	function decode(str) {
    	    if (str.indexOf("%") === -1)
    	        return str;
    	    try {
    	        return decodeURIComponent(str);
    	    }
    	    catch (e) {
    	        return str;
    	    }
    	}
    	/**
    	 * Determine if value is a Date.
    	 */
    	function isDate(val) {
    	    return __toString.call(val) === "[object Date]";
    	}
    	
    	return dist;
    }

    var distExports = requireDist();

    const encoder = new TextEncoder();
    const sign = async (value, secret) => {
        let data = encoder.encode(value);
        let key = await createKey(secret, ["sign"]);
        let signature = await crypto.subtle.sign("HMAC", key, data);
        let hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=+$/, "");
        return value + "." + hash;
    };
    const unsign = async (cookie, secret) => {
        let index = cookie.lastIndexOf(".");
        let value = cookie.slice(0, index);
        let hash = cookie.slice(index + 1);
        let data = encoder.encode(value);
        let key = await createKey(secret, ["verify"]);
        let signature = byteStringToUint8Array(atob(hash));
        let valid = await crypto.subtle.verify("HMAC", key, signature, data);
        return valid ? value : false;
    };
    const createKey = async (secret, usages) => crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
    function byteStringToUint8Array(byteString) {
        let array = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
            array[i] = byteString.charCodeAt(i);
        }
        return array;
    }

    /**
     * Creates a logical container for managing a browser cookie from the server.
     */
    const createCookie = (name, cookieOptions = {}) => {
        let { secrets = [], ...options } = {
            path: "/",
            sameSite: "lax",
            ...cookieOptions,
        };
        warnOnceAboutExpiresCookie(name, options.expires);
        return {
            get name() {
                return name;
            },
            get isSigned() {
                return secrets.length > 0;
            },
            get expires() {
                // Max-Age takes precedence over Expires
                return typeof options.maxAge !== "undefined"
                    ? new Date(Date.now() + options.maxAge * 1000)
                    : options.expires;
            },
            async parse(cookieHeader, parseOptions) {
                if (!cookieHeader)
                    return null;
                let cookies = distExports.parse(cookieHeader, { ...options, ...parseOptions });
                if (name in cookies) {
                    let value = cookies[name];
                    if (typeof value === "string" && value !== "") {
                        let decoded = await decodeCookieValue(value, secrets);
                        return decoded;
                    }
                    else {
                        return "";
                    }
                }
                else {
                    return null;
                }
            },
            async serialize(value, serializeOptions) {
                return distExports.serialize(name, value === "" ? "" : await encodeCookieValue(value, secrets), {
                    ...options,
                    ...serializeOptions,
                });
            },
        };
    };
    /**
     * Returns true if an object is a Remix cookie container.
     *
     * @see https://remix.run/utils/cookies#iscookie
     */
    const isCookie = (object) => {
        return (object != null &&
            typeof object.name === "string" &&
            typeof object.isSigned === "boolean" &&
            typeof object.parse === "function" &&
            typeof object.serialize === "function");
    };
    async function encodeCookieValue(value, secrets) {
        let encoded = encodeData(value);
        if (secrets.length > 0) {
            encoded = await sign(encoded, secrets[0]);
        }
        return encoded;
    }
    async function decodeCookieValue(value, secrets) {
        if (secrets.length > 0) {
            for (let secret of secrets) {
                let unsignedValue = await unsign(value, secret);
                if (unsignedValue !== false) {
                    return decodeData(unsignedValue);
                }
            }
            return null;
        }
        return decodeData(value);
    }
    function encodeData(value) {
        return btoa(myUnescape(encodeURIComponent(JSON.stringify(value))));
    }
    function decodeData(value) {
        try {
            return JSON.parse(decodeURIComponent(myEscape(atob(value))));
        }
        catch (error) {
            return {};
        }
    }
    // See: https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/es.escape.js
    function myEscape(value) {
        let str = value.toString();
        let result = "";
        let index = 0;
        let chr, code;
        while (index < str.length) {
            chr = str.charAt(index++);
            if (/[\w*+\-./@]/.exec(chr)) {
                result += chr;
            }
            else {
                code = chr.charCodeAt(0);
                if (code < 256) {
                    result += "%" + hex(code, 2);
                }
                else {
                    result += "%u" + hex(code, 4).toUpperCase();
                }
            }
        }
        return result;
    }
    function hex(code, length) {
        let result = code.toString(16);
        while (result.length < length)
            result = "0" + result;
        return result;
    }
    // See: https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/es.unescape.js
    function myUnescape(value) {
        let str = value.toString();
        let result = "";
        let index = 0;
        let chr, part;
        while (index < str.length) {
            chr = str.charAt(index++);
            if (chr === "%") {
                if (str.charAt(index) === "u") {
                    part = str.slice(index + 1, index + 5);
                    if (/^[\da-f]{4}$/i.exec(part)) {
                        result += String.fromCharCode(parseInt(part, 16));
                        index += 5;
                        continue;
                    }
                }
                else {
                    part = str.slice(index, index + 2);
                    if (/^[\da-f]{2}$/i.exec(part)) {
                        result += String.fromCharCode(parseInt(part, 16));
                        index += 2;
                        continue;
                    }
                }
            }
            result += chr;
        }
        return result;
    }
    function warnOnceAboutExpiresCookie(name, expires) {
        warnOnce(!expires, `The "${name}" cookie has an "expires" property set. ` +
            `This will cause the expires value to not be updated when the session is committed. ` +
            `Instead, you should set the expires value when serializing the cookie. ` +
            `You can use \`commitSession(session, { expires })\` if using a session storage object, ` +
            `or \`cookie.serialize("value", { expires })\` if you're using the cookie directly.`);
    }

    function createEntryRouteModules(manifest) {
        return Object.keys(manifest).reduce((memo, routeId) => {
            let route = manifest[routeId];
            if (route) {
                memo[routeId] = route.module;
            }
            return memo;
        }, {});
    }

    /**
     * The mode to use when running the server.
     */
    exports.UNSAFE_ServerMode = void 0;
    (function (ServerMode) {
        ServerMode["Development"] = "development";
        ServerMode["Production"] = "production";
        ServerMode["Test"] = "test";
    })(exports.UNSAFE_ServerMode || (exports.UNSAFE_ServerMode = {}));
    function isServerMode(value) {
        return (value === exports.UNSAFE_ServerMode.Development ||
            value === exports.UNSAFE_ServerMode.Production ||
            value === exports.UNSAFE_ServerMode.Test);
    }

    /**
     * This thing probably warrants some explanation.
     *
     * The whole point here is to emulate componentDidCatch for server rendering and
     * data loading. It can get tricky. React can do this on component boundaries
     * but doesn't support it for server rendering or data loading. We know enough
     * with nested routes to be able to emulate the behavior (because we know them
     * statically before rendering.)
     *
     * Each route can export an `ErrorBoundary`.
     *
     * - When rendering throws an error, the nearest error boundary will render
     *   (normal react componentDidCatch). This will be the route's own boundary, but
     *   if none is provided, it will bubble up to the parents.
     * - When data loading throws an error, the nearest error boundary will render
     * - When performing an action, the nearest error boundary for the action's
     *   route tree will render (no redirect happens)
     *
     * During normal react rendering, we do nothing special, just normal
     * componentDidCatch.
     *
     * For server rendering, we mutate `renderBoundaryRouteId` to know the last
     * layout that has an error boundary that tried to render. This emulates which
     * layout would catch a thrown error. If the rendering fails, we catch the error
     * on the server, and go again a second time with the emulator holding on to the
     * information it needs to render the same error boundary as a dynamically
     * thrown render error.
     *
     * When data loading, server or client side, we use the emulator to likewise
     * hang on to the error and re-render at the appropriate layout (where a thrown
     * error would have been caught by cDC).
     *
     * When actions throw, it all works the same. There's an edge case to be aware
     * of though. Actions normally are required to redirect, but in the case of
     * errors, we render the action's route with the emulator holding on to the
     * error. If during this render a parent route/loader throws we ignore that new
     * error and render the action's original error as deeply as possible. In other
     * words, we simply ignore the new error and use the action's error in place
     * because it came first, and that just wouldn't be fair to let errors cut in
     * line.
     */
    function sanitizeError(error, serverMode) {
        if (error instanceof Error && serverMode !== exports.UNSAFE_ServerMode.Development) {
            let sanitized = new Error("Unexpected Server Error");
            sanitized.stack = undefined;
            return sanitized;
        }
        return error;
    }
    function sanitizeErrors(errors, serverMode) {
        return Object.entries(errors).reduce((acc, [routeId, error]) => {
            return Object.assign(acc, { [routeId]: sanitizeError(error, serverMode) });
        }, {});
    }
    function serializeError(error, serverMode) {
        let sanitized = sanitizeError(error, serverMode);
        return {
            message: sanitized.message,
            stack: sanitized.stack,
        };
    }
    function serializeErrors(errors, serverMode) {
        if (!errors)
            return null;
        let entries = Object.entries(errors);
        let serialized = {};
        for (let [key, val] of entries) {
            // Hey you!  If you change this, please change the corresponding logic in
            // deserializeErrors in remix-react/errors.ts :)
            if (isRouteErrorResponse(val)) {
                serialized[key] = { ...val, __type: "RouteErrorResponse" };
            }
            else if (val instanceof Error) {
                let sanitized = sanitizeError(val, serverMode);
                serialized[key] = {
                    message: sanitized.message,
                    stack: sanitized.stack,
                    __type: "Error",
                    // If this is a subclass (i.e., ReferenceError), send up the type so we
                    // can re-create the same type during hydration.  This will only apply
                    // in dev mode since all production errors are sanitized to normal
                    // Error instances
                    ...(sanitized.name !== "Error"
                        ? {
                            __subType: sanitized.name,
                        }
                        : {}),
                };
            }
            else {
                serialized[key] = val;
            }
        }
        return serialized;
    }

    function matchServerRoutes(routes, pathname, basename) {
        let matches = matchRoutes(routes, pathname, basename);
        if (!matches)
            return null;
        return matches.map((match) => ({
            params: match.params,
            pathname: match.pathname,
            route: match.route,
        }));
    }

    // Need to use RR's version here to permit the optional context even
    // though we know it'll always be provided in remix
    async function callRouteHandler(handler, args) {
        let result = await handler({
            request: stripRoutesParam(stripIndexParam(args.request)),
            params: args.params,
            context: args.context,
        });
        // If they returned a redirect via data(), re-throw it as a Response
        if (isDataWithResponseInit(result) &&
            result.init &&
            result.init.status &&
            isRedirectStatusCode(result.init.status)) {
            throw new Response(null, result.init);
        }
        return result;
    }
    // TODO: Document these search params better
    // and stop stripping these in V2. These break
    // support for running in a SW and also expose
    // valuable info to data funcs that is being asked
    // for such as "is this a data request?".
    function stripIndexParam(request) {
        let url = new URL(request.url);
        let indexValues = url.searchParams.getAll("index");
        url.searchParams.delete("index");
        let indexValuesToKeep = [];
        for (let indexValue of indexValues) {
            if (indexValue) {
                indexValuesToKeep.push(indexValue);
            }
        }
        for (let toKeep of indexValuesToKeep) {
            url.searchParams.append("index", toKeep);
        }
        let init = {
            method: request.method,
            body: request.body,
            headers: request.headers,
            signal: request.signal,
        };
        if (init.body) {
            init.duplex = "half";
        }
        return new Request(url.href, init);
    }
    function stripRoutesParam(request) {
        let url = new URL(request.url);
        url.searchParams.delete("_routes");
        let init = {
            method: request.method,
            body: request.body,
            headers: request.headers,
            signal: request.signal,
        };
        if (init.body) {
            init.duplex = "half";
        }
        return new Request(url.href, init);
    }

    function invariant(value, message) {
        if (value === false || value === null || typeof value === "undefined") {
            console.error("The following error is a bug in React Router; please open an issue! https://github.com/remix-run/react-router/issues/new/choose");
            throw new Error(message);
        }
    }

    function groupRoutesByParentId(manifest) {
        let routes = {};
        Object.values(manifest).forEach((route) => {
            if (route) {
                let parentId = route.parentId || "";
                if (!routes[parentId]) {
                    routes[parentId] = [];
                }
                routes[parentId].push(route);
            }
        });
        return routes;
    }
    // Create a map of routes by parentId to use recursively instead of
    // repeatedly filtering the manifest.
    function createRoutes(manifest, parentId = "", routesByParentId = groupRoutesByParentId(manifest)) {
        return (routesByParentId[parentId] || []).map((route) => ({
            ...route,
            children: createRoutes(manifest, route.id, routesByParentId),
        }));
    }
    // Convert the Remix ServerManifest into DataRouteObject's for use with
    // createStaticHandler
    function createStaticHandlerDataRoutes(manifest, future, parentId = "", routesByParentId = groupRoutesByParentId(manifest)) {
        return (routesByParentId[parentId] || []).map((route) => {
            let commonRoute = {
                // Always include root due to default boundaries
                hasErrorBoundary: route.id === "root" || route.module.ErrorBoundary != null,
                id: route.id,
                path: route.path,
                unstable_middleware: route.module.unstable_middleware,
                // Need to use RR's version in the param typed here to permit the optional
                // context even though we know it'll always be provided in remix
                loader: route.module.loader
                    ? async (args) => {
                        // If we're prerendering, use the data passed in from prerendering
                        // the .data route so we don't call loaders twice
                        if (args.request.headers.has("X-React-Router-Prerender-Data")) {
                            const preRenderedData = args.request.headers.get("X-React-Router-Prerender-Data");
                            let encoded = preRenderedData
                                ? decodeURI(preRenderedData)
                                : preRenderedData;
                            invariant(encoded, "Missing prerendered data for route");
                            let uint8array = new TextEncoder().encode(encoded);
                            let stream = new ReadableStream({
                                start(controller) {
                                    controller.enqueue(uint8array);
                                    controller.close();
                                },
                            });
                            let decoded = await decodeViaTurboStream(stream, global);
                            let data = decoded.value;
                            invariant(data && route.id in data, "Unable to decode prerendered data");
                            let result = data[route.id];
                            invariant("data" in result, "Unable to process prerendered data");
                            return result.data;
                        }
                        let val = await callRouteHandler(route.module.loader, args);
                        return val;
                    }
                    : undefined,
                action: route.module.action
                    ? (args) => callRouteHandler(route.module.action, args)
                    : undefined,
                handle: route.module.handle,
            };
            return route.index
                ? {
                    index: true,
                    ...commonRoute,
                }
                : {
                    caseSensitive: route.caseSensitive,
                    children: createStaticHandlerDataRoutes(manifest, future, route.id, routesByParentId),
                    ...commonRoute,
                };
        });
    }

    // This escapeHtml utility is based on https://github.com/zertosh/htmlescape
    // License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE
    // We've chosen to inline the utility here to reduce the number of npm dependencies we have,
    // slightly decrease the code size compared the original package and make it esm compatible.
    const ESCAPE_LOOKUP = {
        "&": "\\u0026",
        ">": "\\u003e",
        "<": "\\u003c",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029",
    };
    const ESCAPE_REGEX = /[&><\u2028\u2029]/g;
    function escapeHtml(html) {
        return html.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
    }

    // TODO: Remove Promises from serialization
    function createServerHandoffString(serverHandoff) {
        // Uses faster alternative of jsesc to escape data returned from the loaders.
        // This string is inserted directly into the HTML in the `<Scripts>` element.
        return escapeHtml(JSON.stringify(serverHandoff));
    }

    const globalDevServerHooksKey = "__reactRouterDevServerHooks";
    function setDevServerHooks(devServerHooks) {
        // @ts-expect-error
        globalThis[globalDevServerHooksKey] = devServerHooks;
    }
    function getDevServerHooks() {
        // @ts-expect-error
        return globalThis[globalDevServerHooksKey];
    }

    var setCookie = {exports: {}};

    var hasRequiredSetCookie;

    function requireSetCookie () {
    	if (hasRequiredSetCookie) return setCookie.exports;
    	hasRequiredSetCookie = 1;

    	var defaultParseOptions = {
    	  decodeValues: true,
    	  map: false,
    	  silent: false,
    	};

    	function isNonEmptyString(str) {
    	  return typeof str === "string" && !!str.trim();
    	}

    	function parseString(setCookieValue, options) {
    	  var parts = setCookieValue.split(";").filter(isNonEmptyString);

    	  var nameValuePairStr = parts.shift();
    	  var parsed = parseNameValuePair(nameValuePairStr);
    	  var name = parsed.name;
    	  var value = parsed.value;

    	  options = options
    	    ? Object.assign({}, defaultParseOptions, options)
    	    : defaultParseOptions;

    	  try {
    	    value = options.decodeValues ? decodeURIComponent(value) : value; // decode cookie value
    	  } catch (e) {
    	    console.error(
    	      "set-cookie-parser encountered an error while decoding a cookie with value '" +
    	        value +
    	        "'. Set options.decodeValues to false to disable this feature.",
    	      e
    	    );
    	  }

    	  var cookie = {
    	    name: name,
    	    value: value,
    	  };

    	  parts.forEach(function (part) {
    	    var sides = part.split("=");
    	    var key = sides.shift().trimLeft().toLowerCase();
    	    var value = sides.join("=");
    	    if (key === "expires") {
    	      cookie.expires = new Date(value);
    	    } else if (key === "max-age") {
    	      cookie.maxAge = parseInt(value, 10);
    	    } else if (key === "secure") {
    	      cookie.secure = true;
    	    } else if (key === "httponly") {
    	      cookie.httpOnly = true;
    	    } else if (key === "samesite") {
    	      cookie.sameSite = value;
    	    } else {
    	      cookie[key] = value;
    	    }
    	  });

    	  return cookie;
    	}

    	function parseNameValuePair(nameValuePairStr) {
    	  // Parses name-value-pair according to rfc6265bis draft

    	  var name = "";
    	  var value = "";
    	  var nameValueArr = nameValuePairStr.split("=");
    	  if (nameValueArr.length > 1) {
    	    name = nameValueArr.shift();
    	    value = nameValueArr.join("="); // everything after the first =, joined by a "=" if there was more than one part
    	  } else {
    	    value = nameValuePairStr;
    	  }

    	  return { name: name, value: value };
    	}

    	function parse(input, options) {
    	  options = options
    	    ? Object.assign({}, defaultParseOptions, options)
    	    : defaultParseOptions;

    	  if (!input) {
    	    if (!options.map) {
    	      return [];
    	    } else {
    	      return {};
    	    }
    	  }

    	  if (input.headers) {
    	    if (typeof input.headers.getSetCookie === "function") {
    	      // for fetch responses - they combine headers of the same type in the headers array,
    	      // but getSetCookie returns an uncombined array
    	      input = input.headers.getSetCookie();
    	    } else if (input.headers["set-cookie"]) {
    	      // fast-path for node.js (which automatically normalizes header names to lower-case
    	      input = input.headers["set-cookie"];
    	    } else {
    	      // slow-path for other environments - see #25
    	      var sch =
    	        input.headers[
    	          Object.keys(input.headers).find(function (key) {
    	            return key.toLowerCase() === "set-cookie";
    	          })
    	        ];
    	      // warn if called on a request-like object with a cookie header rather than a set-cookie header - see #34, 36
    	      if (!sch && input.headers.cookie && !options.silent) {
    	        console.warn(
    	          "Warning: set-cookie-parser appears to have been called on a request object. It is designed to parse Set-Cookie headers from responses, not Cookie headers from requests. Set the option {silent: true} to suppress this warning."
    	        );
    	      }
    	      input = sch;
    	    }
    	  }
    	  if (!Array.isArray(input)) {
    	    input = [input];
    	  }

    	  options = options
    	    ? Object.assign({}, defaultParseOptions, options)
    	    : defaultParseOptions;

    	  if (!options.map) {
    	    return input.filter(isNonEmptyString).map(function (str) {
    	      return parseString(str, options);
    	    });
    	  } else {
    	    var cookies = {};
    	    return input.filter(isNonEmptyString).reduce(function (cookies, str) {
    	      var cookie = parseString(str, options);
    	      cookies[cookie.name] = cookie;
    	      return cookies;
    	    }, cookies);
    	  }
    	}

    	/*
    	  Set-Cookie header field-values are sometimes comma joined in one string. This splits them without choking on commas
    	  that are within a single set-cookie field-value, such as in the Expires portion.

    	  This is uncommon, but explicitly allowed - see https://tools.ietf.org/html/rfc2616#section-4.2
    	  Node.js does this for every header *except* set-cookie - see https://github.com/nodejs/node/blob/d5e363b77ebaf1caf67cd7528224b651c86815c1/lib/_http_incoming.js#L128
    	  React Native's fetch does this for *every* header, including set-cookie.

    	  Based on: https://github.com/google/j2objc/commit/16820fdbc8f76ca0c33472810ce0cb03d20efe25
    	  Credits to: https://github.com/tomball for original and https://github.com/chrusart for JavaScript implementation
    	*/
    	function splitCookiesString(cookiesString) {
    	  if (Array.isArray(cookiesString)) {
    	    return cookiesString;
    	  }
    	  if (typeof cookiesString !== "string") {
    	    return [];
    	  }

    	  var cookiesStrings = [];
    	  var pos = 0;
    	  var start;
    	  var ch;
    	  var lastComma;
    	  var nextStart;
    	  var cookiesSeparatorFound;

    	  function skipWhitespace() {
    	    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
    	      pos += 1;
    	    }
    	    return pos < cookiesString.length;
    	  }

    	  function notSpecialChar() {
    	    ch = cookiesString.charAt(pos);

    	    return ch !== "=" && ch !== ";" && ch !== ",";
    	  }

    	  while (pos < cookiesString.length) {
    	    start = pos;
    	    cookiesSeparatorFound = false;

    	    while (skipWhitespace()) {
    	      ch = cookiesString.charAt(pos);
    	      if (ch === ",") {
    	        // ',' is a cookie separator if we have later first '=', not ';' or ','
    	        lastComma = pos;
    	        pos += 1;

    	        skipWhitespace();
    	        nextStart = pos;

    	        while (pos < cookiesString.length && notSpecialChar()) {
    	          pos += 1;
    	        }

    	        // currently special character
    	        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
    	          // we found cookies separator
    	          cookiesSeparatorFound = true;
    	          // pos is inside the next cookie, so back up and return it.
    	          pos = nextStart;
    	          cookiesStrings.push(cookiesString.substring(start, lastComma));
    	          start = pos;
    	        } else {
    	          // in param ',' or param separator ';',
    	          // we continue from that comma
    	          pos = lastComma + 1;
    	        }
    	      } else {
    	        pos += 1;
    	      }
    	    }

    	    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
    	      cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
    	    }
    	  }

    	  return cookiesStrings;
    	}

    	setCookie.exports = parse;
    	setCookie.exports.parse = parse;
    	setCookie.exports.parseString = parseString;
    	setCookie.exports.splitCookiesString = splitCookiesString;
    	return setCookie.exports;
    }

    var setCookieExports = /*@__PURE__*/ requireSetCookie();

    function getDocumentHeaders(build, context) {
        let boundaryIdx = context.errors
            ? context.matches.findIndex((m) => context.errors[m.route.id])
            : -1;
        let matches = boundaryIdx >= 0
            ? context.matches.slice(0, boundaryIdx + 1)
            : context.matches;
        let errorHeaders;
        if (boundaryIdx >= 0) {
            // Look for any errorHeaders from the boundary route down, which can be
            // identified by the presence of headers but no data
            let { actionHeaders, actionData, loaderHeaders, loaderData } = context;
            context.matches.slice(boundaryIdx).some((match) => {
                let id = match.route.id;
                if (actionHeaders[id] &&
                    (!actionData || !actionData.hasOwnProperty(id))) {
                    errorHeaders = actionHeaders[id];
                }
                else if (loaderHeaders[id] && !loaderData.hasOwnProperty(id)) {
                    errorHeaders = loaderHeaders[id];
                }
                return errorHeaders != null;
            });
        }
        return matches.reduce((parentHeaders, match, idx) => {
            let { id } = match.route;
            let route = build.routes[id];
            invariant(route, `Route with id "${id}" not found in build`);
            let routeModule = route.module;
            let loaderHeaders = context.loaderHeaders[id] || new Headers();
            let actionHeaders = context.actionHeaders[id] || new Headers();
            // Only expose errorHeaders to the leaf headers() function to
            // avoid duplication via parentHeaders
            let includeErrorHeaders = errorHeaders != null && idx === matches.length - 1;
            // Only prepend cookies from errorHeaders at the leaf renderable route
            // when it's not the same as loaderHeaders/actionHeaders to avoid
            // duplicate cookies
            let includeErrorCookies = includeErrorHeaders &&
                errorHeaders !== loaderHeaders &&
                errorHeaders !== actionHeaders;
            // Use the parent headers for any route without a `headers` export
            if (routeModule.headers == null) {
                let headers = new Headers(parentHeaders);
                if (includeErrorCookies) {
                    prependCookies(errorHeaders, headers);
                }
                prependCookies(actionHeaders, headers);
                prependCookies(loaderHeaders, headers);
                return headers;
            }
            let headers = new Headers(routeModule.headers
                ? typeof routeModule.headers === "function"
                    ? routeModule.headers({
                        loaderHeaders,
                        parentHeaders,
                        actionHeaders,
                        errorHeaders: includeErrorHeaders ? errorHeaders : undefined,
                    })
                    : routeModule.headers
                : undefined);
            // Automatically preserve Set-Cookie headers from bubbled responses,
            // loaders, errors, and parent routes
            if (includeErrorCookies) {
                prependCookies(errorHeaders, headers);
            }
            prependCookies(actionHeaders, headers);
            prependCookies(loaderHeaders, headers);
            prependCookies(parentHeaders, headers);
            return headers;
        }, new Headers());
    }
    function prependCookies(parentHeaders, childHeaders) {
        let parentSetCookieString = parentHeaders.get("Set-Cookie");
        if (parentSetCookieString) {
            let cookies = setCookieExports.splitCookiesString(parentSetCookieString);
            let childCookies = new Set(childHeaders.getSetCookie());
            cookies.forEach((cookie) => {
                if (!childCookies.has(cookie)) {
                    childHeaders.append("Set-Cookie", cookie);
                }
            });
        }
    }

    // Do not include a response body if the status code is one of these,
    // otherwise `undici` will throw an error when constructing the Response:
    //   https://github.com/nodejs/undici/blob/bd98a6303e45d5e0d44192a93731b1defdb415f3/lib/web/fetch/response.js#L522-L528
    //
    // Specs:
    //   https://datatracker.ietf.org/doc/html/rfc9110#name-informational-1xx
    //   https://datatracker.ietf.org/doc/html/rfc9110#name-204-no-content
    //   https://datatracker.ietf.org/doc/html/rfc9110#name-205-reset-content
    //   https://datatracker.ietf.org/doc/html/rfc9110#name-304-not-modified
    const NO_BODY_STATUS_CODES = new Set([100, 101, 204, 205, 304]);
    // We can't use a 3xx status or else the `fetch()` would follow the redirect.
    // We need to communicate the redirect back as data so we can act on it in the
    // client side router.  We use a 202 to avoid any automatic caching we might
    // get from a 200 since a "temporary" redirect should not be cached.  This lets
    // the user control cache behavior via Cache-Control
    const SINGLE_FETCH_REDIRECT_STATUS = 202;
    async function singleFetchAction(build, serverMode, staticHandler, request, handlerUrl, loadContext, handleError) {
        try {
            let handlerRequest = new Request(handlerUrl, {
                method: request.method,
                body: request.body,
                headers: request.headers,
                signal: request.signal,
                ...(request.body ? { duplex: "half" } : undefined),
            });
            function respond(context) {
                let headers = getDocumentHeaders(build, context);
                if (isRedirectStatusCode(context.statusCode) && headers.has("Location")) {
                    return generateSingleFetchResponse(request, build, serverMode, {
                        result: getSingleFetchRedirect(context.statusCode, headers, build.basename),
                        headers,
                        status: SINGLE_FETCH_REDIRECT_STATUS,
                    });
                }
                // Sanitize errors outside of development environments
                if (context.errors) {
                    Object.values(context.errors).forEach((err) => {
                        // @ts-expect-error This is "private" from users but intended for internal use
                        if (!isRouteErrorResponse(err) || err.error) {
                            handleError(err);
                        }
                    });
                    context.errors = sanitizeErrors(context.errors, serverMode);
                }
                let singleFetchResult;
                if (context.errors) {
                    singleFetchResult = { error: Object.values(context.errors)[0] };
                }
                else {
                    singleFetchResult = {
                        data: Object.values(context.actionData || {})[0],
                    };
                }
                return generateSingleFetchResponse(request, build, serverMode, {
                    result: singleFetchResult,
                    headers,
                    status: context.statusCode,
                });
            }
            let result = await staticHandler.query(handlerRequest, {
                requestContext: loadContext,
                skipLoaderErrorBubbling: true,
                skipRevalidation: true,
                unstable_respond: respond,
            });
            // while middleware is still unstable, we don't run the middleware pipeline
            // if no routes have middleware, so we still might need to convert context
            // to a response here
            if (!isResponse(result)) {
                result = respond(result);
            }
            // Unlike `handleDataRequest`, when singleFetch is enabled, query does
            // let non-Response return values through
            if (isRedirectResponse(result)) {
                return generateSingleFetchResponse(request, build, serverMode, {
                    result: getSingleFetchRedirect(result.status, result.headers, build.basename),
                    headers: result.headers,
                    status: SINGLE_FETCH_REDIRECT_STATUS,
                });
            }
            return result;
        }
        catch (error) {
            handleError(error);
            // These should only be internal remix errors, no need to deal with responseStubs
            return generateSingleFetchResponse(request, build, serverMode, {
                result: { error },
                headers: new Headers(),
                status: 500,
            });
        }
    }
    async function singleFetchLoaders(build, serverMode, staticHandler, request, handlerUrl, loadContext, handleError) {
        try {
            let handlerRequest = new Request(handlerUrl, {
                headers: request.headers,
                signal: request.signal,
            });
            let routesParam = new URL(request.url).searchParams.get("_routes");
            let loadRouteIds = routesParam ? new Set(routesParam.split(",")) : null;
            function respond(context) {
                let headers = getDocumentHeaders(build, context);
                if (isRedirectStatusCode(context.statusCode) && headers.has("Location")) {
                    return generateSingleFetchResponse(request, build, serverMode, {
                        result: {
                            [SingleFetchRedirectSymbol]: getSingleFetchRedirect(context.statusCode, headers, build.basename),
                        },
                        headers,
                        status: SINGLE_FETCH_REDIRECT_STATUS,
                    });
                }
                // Sanitize errors outside of development environments
                if (context.errors) {
                    Object.values(context.errors).forEach((err) => {
                        // @ts-expect-error This is "private" from users but intended for internal use
                        if (!isRouteErrorResponse(err) || err.error) {
                            handleError(err);
                        }
                    });
                    context.errors = sanitizeErrors(context.errors, serverMode);
                }
                // Aggregate results based on the matches we intended to load since we get
                // `null` values back in `context.loaderData` for routes we didn't load
                let results = {};
                let loadedMatches = new Set(context.matches
                    .filter((m) => loadRouteIds ? loadRouteIds.has(m.route.id) : m.route.loader != null)
                    .map((m) => m.route.id));
                if (context.errors) {
                    for (let [id, error] of Object.entries(context.errors)) {
                        results[id] = { error };
                    }
                }
                for (let [id, data] of Object.entries(context.loaderData)) {
                    if (!(id in results) && loadedMatches.has(id)) {
                        results[id] = { data };
                    }
                }
                return generateSingleFetchResponse(request, build, serverMode, {
                    result: results,
                    headers,
                    status: context.statusCode,
                });
            }
            let result = await staticHandler.query(handlerRequest, {
                requestContext: loadContext,
                filterMatchesToLoad: (m) => !loadRouteIds || loadRouteIds.has(m.route.id),
                skipLoaderErrorBubbling: true,
                unstable_respond: respond,
            });
            // while middleware is still unstable, we don't run the middleware pipeline
            // if no routes have middleware, so we still might need to convert context
            // to a response here
            if (!isResponse(result)) {
                result = respond(result);
            }
            if (isRedirectResponse(result)) {
                return generateSingleFetchResponse(request, build, serverMode, {
                    result: {
                        [SingleFetchRedirectSymbol]: getSingleFetchRedirect(result.status, result.headers, build.basename),
                    },
                    headers: result.headers,
                    status: SINGLE_FETCH_REDIRECT_STATUS,
                });
            }
            return result;
        }
        catch (error) {
            handleError(error);
            // These should only be internal remix errors, no need to deal with responseStubs
            return generateSingleFetchResponse(request, build, serverMode, {
                result: { root: { error } },
                headers: new Headers(),
                status: 500,
            });
        }
    }
    function generateSingleFetchResponse(request, build, serverMode, { result, headers, status, }) {
        // Mark all successful responses with a header so we can identify in-flight
        // network errors that are missing this header
        let resultHeaders = new Headers(headers);
        resultHeaders.set("X-Remix-Response", "yes");
        // Skip response body for unsupported status codes
        if (NO_BODY_STATUS_CODES.has(status)) {
            return new Response(null, { status, headers: resultHeaders });
        }
        // We use a less-descriptive `text/x-script` here instead of something like
        // `text/x-turbo` to enable compression when deployed via Cloudflare.  See:
        //  - https://github.com/remix-run/remix/issues/9884
        //  - https://developers.cloudflare.com/speed/optimization/content/brotli/content-compression/
        resultHeaders.set("Content-Type", "text/x-script");
        return new Response(encodeViaTurboStream(result, request.signal, build.entry.module.streamTimeout, serverMode), {
            status: status || 200,
            headers: resultHeaders,
        });
    }
    function getSingleFetchRedirect(status, headers, basename) {
        let redirect = headers.get("Location");
        if (basename) {
            redirect = stripBasename(redirect, basename) || redirect;
        }
        return {
            redirect,
            status,
            revalidate: 
            // Technically X-Remix-Revalidate isn't needed here - that was an implementation
            // detail of ?_data requests as our way to tell the front end to revalidate when
            // we didn't have a response body to include that information in.
            // With single fetch, we tell the front end via this revalidate boolean field.
            // However, we're respecting it for now because it may be something folks have
            // used in their own responses
            // TODO(v3): Consider removing or making this official public API
            headers.has("X-Remix-Revalidate") || headers.has("Set-Cookie"),
            reload: headers.has("X-Remix-Reload-Document"),
            replace: headers.has("X-Remix-Replace"),
        };
    }
    // Note: If you change this function please change the corresponding
    // decodeViaTurboStream function in server-runtime
    function encodeViaTurboStream(data, requestSignal, streamTimeout, serverMode) {
        let controller = new AbortController();
        // How long are we willing to wait for all of the promises in `data` to resolve
        // before timing out?  We default this to 50ms shorter than the default value
        // of 5000ms we had in `ABORT_DELAY` in Remix v2 that folks may still be using
        // in RR v7 so that once we reject we have time to flush the rejections down
        // through React's rendering stream before we call `abort()` on that.  If the
        // user provides their own it's up to them to decouple the aborting of the
        // stream from the aborting of React's `renderToPipeableStream`
        let timeoutId = setTimeout(() => controller.abort(new Error("Server Timeout")), typeof streamTimeout === "number" ? streamTimeout : 4950);
        requestSignal.addEventListener("abort", () => clearTimeout(timeoutId));
        return encode(data, {
            signal: controller.signal,
            plugins: [
                (value) => {
                    // Even though we sanitized errors on context.errors prior to responding,
                    // we still need to handle this for any deferred data that rejects with an
                    // Error - as those will not be sanitized yet
                    if (value instanceof Error) {
                        let { name, message, stack } = serverMode === exports.UNSAFE_ServerMode.Production
                            ? sanitizeError(value, serverMode)
                            : value;
                        return ["SanitizedError", name, message, stack];
                    }
                    if (value instanceof ErrorResponseImpl) {
                        let { data, status, statusText } = value;
                        return ["ErrorResponse", data, status, statusText];
                    }
                    if (value &&
                        typeof value === "object" &&
                        SingleFetchRedirectSymbol in value) {
                        return ["SingleFetchRedirect", value[SingleFetchRedirectSymbol]];
                    }
                },
            ],
            postPlugins: [
                (value) => {
                    if (!value)
                        return;
                    if (typeof value !== "object")
                        return;
                    return [
                        "SingleFetchClassInstance",
                        Object.fromEntries(Object.entries(value)),
                    ];
                },
                () => ["SingleFetchFallback"],
            ],
        });
    }

    function derive(build, mode) {
        let routes = createRoutes(build.routes);
        let dataRoutes = createStaticHandlerDataRoutes(build.routes, build.future);
        let serverMode = isServerMode(mode) ? mode : exports.UNSAFE_ServerMode.Production;
        let staticHandler = createStaticHandler$1(dataRoutes, {
            basename: build.basename,
        });
        let errorHandler = build.entry.module.handleError ||
            ((error, { request }) => {
                if (serverMode !== exports.UNSAFE_ServerMode.Test && !request.signal.aborted) {
                    console.error(
                    // @ts-expect-error This is "private" from users but intended for internal use
                    isRouteErrorResponse(error) && error.error ? error.error : error);
                }
            });
        return {
            routes,
            dataRoutes,
            serverMode,
            staticHandler,
            errorHandler,
        };
    }
    const createRequestHandler = (build, mode) => {
        let _build;
        let routes;
        let serverMode;
        let staticHandler;
        let errorHandler;
        return async function requestHandler(request, initialContext) {
            _build = typeof build === "function" ? await build() : build;
            let loadContext = _build.future.unstable_middleware
                ? new unstable_RouterContextProvider(initialContext)
                : initialContext || {};
            if (typeof build === "function") {
                let derived = derive(_build, mode);
                routes = derived.routes;
                serverMode = derived.serverMode;
                staticHandler = derived.staticHandler;
                errorHandler = derived.errorHandler;
            }
            else if (!routes || !serverMode || !staticHandler || !errorHandler) {
                let derived = derive(_build, mode);
                routes = derived.routes;
                serverMode = derived.serverMode;
                staticHandler = derived.staticHandler;
                errorHandler = derived.errorHandler;
            }
            let url = new URL(request.url);
            let normalizedBasename = _build.basename || "/";
            let normalizedPath = url.pathname;
            if (stripBasename(normalizedPath, normalizedBasename) === "/_root.data") {
                normalizedPath = normalizedBasename;
            }
            else if (normalizedPath.endsWith(".data")) {
                normalizedPath = normalizedPath.replace(/\.data$/, "");
            }
            if (stripBasename(normalizedPath, normalizedBasename) !== "/" &&
                normalizedPath.endsWith("/")) {
                normalizedPath = normalizedPath.slice(0, -1);
            }
            let params = {};
            let handleError = (error) => {
                if (mode === exports.UNSAFE_ServerMode.Development) {
                    getDevServerHooks()?.processRequestError?.(error);
                }
                errorHandler(error, {
                    context: loadContext,
                    params,
                    request,
                });
            };
            // When runtime SSR is disabled, make our dev server behave like the deployed
            // pre-rendered site would
            if (!_build.ssr) {
                if (_build.prerender.length === 0) {
                    // Add the header if we're in SPA mode
                    request.headers.set("X-React-Router-SPA-Mode", "yes");
                }
                else if (!_build.prerender.includes(normalizedPath) &&
                    !_build.prerender.includes(normalizedPath + "/")) {
                    if (url.pathname.endsWith(".data")) {
                        // 404 on non-pre-rendered `.data` requests
                        errorHandler(new ErrorResponseImpl(404, "Not Found", `Refusing to SSR the path \`${normalizedPath}\` because \`ssr:false\` is set and the path is not included in the \`prerender\` config, so in production the path will be a 404.`), {
                            context: loadContext,
                            params,
                            request,
                        });
                        return new Response("Not Found", {
                            status: 404,
                            statusText: "Not Found",
                        });
                    }
                    else {
                        // Serve a SPA fallback for non-pre-rendered document requests
                        request.headers.set("X-React-Router-SPA-Mode", "yes");
                    }
                }
            }
            // Manifest request for fog of war
            let manifestUrl = `${normalizedBasename}/__manifest`.replace(/\/+/g, "/");
            if (url.pathname === manifestUrl) {
                try {
                    let res = await handleManifestRequest(_build, routes, url);
                    return res;
                }
                catch (e) {
                    handleError(e);
                    return new Response("Unknown Server Error", { status: 500 });
                }
            }
            let matches = matchServerRoutes(routes, url.pathname, _build.basename);
            if (matches && matches.length > 0) {
                Object.assign(params, matches[0].params);
            }
            let response;
            if (url.pathname.endsWith(".data")) {
                let handlerUrl = new URL(request.url);
                handlerUrl.pathname = normalizedPath;
                let singleFetchMatches = matchServerRoutes(routes, handlerUrl.pathname, _build.basename);
                response = await handleSingleFetchRequest(serverMode, _build, staticHandler, request, handlerUrl, loadContext, handleError);
                if (_build.entry.module.handleDataRequest) {
                    response = await _build.entry.module.handleDataRequest(response, {
                        context: loadContext,
                        params: singleFetchMatches ? singleFetchMatches[0].params : {},
                        request,
                    });
                    if (isRedirectResponse(response)) {
                        let result = getSingleFetchRedirect(response.status, response.headers, _build.basename);
                        if (request.method === "GET") {
                            result = {
                                [SingleFetchRedirectSymbol]: result,
                            };
                        }
                        let headers = new Headers(response.headers);
                        headers.set("Content-Type", "text/x-script");
                        return new Response(encodeViaTurboStream(result, request.signal, _build.entry.module.streamTimeout, serverMode), {
                            status: SINGLE_FETCH_REDIRECT_STATUS,
                            headers,
                        });
                    }
                }
            }
            else if (!request.headers.has("X-React-Router-SPA-Mode") &&
                matches &&
                matches[matches.length - 1].route.module.default == null &&
                matches[matches.length - 1].route.module.ErrorBoundary == null) {
                response = await handleResourceRequest(serverMode, _build, staticHandler, matches.slice(-1)[0].route.id, request, loadContext, handleError);
            }
            else {
                let { pathname } = url;
                let criticalCss = undefined;
                if (_build.unstable_getCriticalCss) {
                    criticalCss = await _build.unstable_getCriticalCss({ pathname });
                }
                else if (mode === exports.UNSAFE_ServerMode.Development &&
                    getDevServerHooks()?.getCriticalCss) {
                    criticalCss = await getDevServerHooks()?.getCriticalCss?.(pathname);
                }
                response = await handleDocumentRequest(serverMode, _build, staticHandler, request, loadContext, handleError, criticalCss);
            }
            if (request.method === "HEAD") {
                return new Response(null, {
                    headers: response.headers,
                    status: response.status,
                    statusText: response.statusText,
                });
            }
            return response;
        };
    };
    async function handleManifestRequest(build, routes, url) {
        if (build.assets.version !== url.searchParams.get("version")) {
            return new Response(null, {
                status: 204,
                headers: {
                    "X-Remix-Reload-Document": "true",
                },
            });
        }
        let patches = {};
        if (url.searchParams.has("p")) {
            let paths = new Set();
            // In addition to responding with the patches for the requested paths, we
            // need to include patches for each partial path so that we pick up any
            // pathless/index routes below ancestor segments.  So if we
            // get a request for `/parent/child`, we need to look for a match on `/parent`
            // so that if a `parent._index` route exists we return it so it's available
            // for client side matching if the user routes back up to `/parent`.
            // This is the same thing we do on initial load in <Scripts> via
            // `getPartialManifest()`
            url.searchParams.getAll("p").forEach((path) => {
                if (!path.startsWith("/")) {
                    path = `/${path}`;
                }
                let segments = path.split("/").slice(1);
                segments.forEach((_, i) => {
                    let partialPath = segments.slice(0, i + 1).join("/");
                    paths.add(`/${partialPath}`);
                });
            });
            for (let path of paths) {
                let matches = matchServerRoutes(routes, path, build.basename);
                if (matches) {
                    for (let match of matches) {
                        let routeId = match.route.id;
                        let route = build.assets.routes[routeId];
                        if (route) {
                            patches[routeId] = route;
                        }
                    }
                }
            }
            return Response.json(patches, {
                headers: {
                    "Cache-Control": "public, max-age=31536000, immutable",
                },
            });
        }
        return new Response("Invalid Request", { status: 400 });
    }
    async function handleSingleFetchRequest(serverMode, build, staticHandler, request, handlerUrl, loadContext, handleError) {
        let response = request.method !== "GET"
            ? await singleFetchAction(build, serverMode, staticHandler, request, handlerUrl, loadContext, handleError)
            : await singleFetchLoaders(build, serverMode, staticHandler, request, handlerUrl, loadContext, handleError);
        return response;
    }
    async function handleDocumentRequest(serverMode, build, staticHandler, request, loadContext, handleError, criticalCss) {
        let isSpaMode = request.headers.has("X-React-Router-SPA-Mode");
        try {
            let response = await staticHandler.query(request, {
                requestContext: loadContext,
                unstable_respond: build.future.unstable_middleware
                    ? (ctx) => renderHtml(ctx, isSpaMode)
                    : undefined,
            });
            // while middleware is still unstable, we don't run the middleware pipeline
            // if no routes have middleware, so we still might need to convert context
            // to a response here
            return isResponse(response) ? response : renderHtml(response, isSpaMode);
        }
        catch (error) {
            handleError(error);
            return new Response(null, { status: 500 });
        }
        async function renderHtml(context, isSpaMode) {
            if (isResponse(context)) {
                return context;
            }
            let headers = getDocumentHeaders(build, context);
            // Skip response body for unsupported status codes
            if (NO_BODY_STATUS_CODES.has(context.statusCode)) {
                return new Response(null, { status: context.statusCode, headers });
            }
            // Sanitize errors outside of development environments
            if (context.errors) {
                Object.values(context.errors).forEach((err) => {
                    // @ts-expect-error This is "private" from users but intended for internal use
                    if (!isRouteErrorResponse(err) || err.error) {
                        handleError(err);
                    }
                });
                context.errors = sanitizeErrors(context.errors, serverMode);
            }
            // Server UI state to send to the client.
            // - When single fetch is enabled, this is streamed down via `serverHandoffStream`
            // - Otherwise it's stringified into `serverHandoffString`
            let state = {
                loaderData: context.loaderData,
                actionData: context.actionData,
                errors: serializeErrors(context.errors, serverMode),
            };
            let entryContext = {
                manifest: build.assets,
                routeModules: createEntryRouteModules(build.routes),
                staticHandlerContext: context,
                criticalCss,
                serverHandoffString: createServerHandoffString({
                    basename: build.basename,
                    criticalCss,
                    future: build.future,
                    ssr: build.ssr,
                    isSpaMode,
                }),
                serverHandoffStream: encodeViaTurboStream(state, request.signal, build.entry.module.streamTimeout, serverMode),
                renderMeta: {},
                future: build.future,
                ssr: build.ssr,
                isSpaMode,
                serializeError: (err) => serializeError(err, serverMode),
            };
            let handleDocumentRequestFunction = build.entry.module.default;
            try {
                return await handleDocumentRequestFunction(request, context.statusCode, headers, entryContext, loadContext);
            }
            catch (error) {
                handleError(error);
                let errorForSecondRender = error;
                // If they threw a response, unwrap it into an ErrorResponse like we would
                // have for a loader/action
                if (isResponse(error)) {
                    try {
                        let data = await unwrapResponse(error);
                        errorForSecondRender = new ErrorResponseImpl(error.status, error.statusText, data);
                    }
                    catch (e) {
                        // If we can't unwrap the response - just leave it as-is
                    }
                }
                // Get a new StaticHandlerContext that contains the error at the right boundary
                context = getStaticContextFromError(staticHandler.dataRoutes, context, errorForSecondRender);
                // Sanitize errors outside of development environments
                if (context.errors) {
                    context.errors = sanitizeErrors(context.errors, serverMode);
                }
                // Get a new entryContext for the second render pass
                // Server UI state to send to the client.
                // - When single fetch is enabled, this is streamed down via `serverHandoffStream`
                // - Otherwise it's stringified into `serverHandoffString`
                let state = {
                    loaderData: context.loaderData,
                    actionData: context.actionData,
                    errors: serializeErrors(context.errors, serverMode),
                };
                entryContext = {
                    ...entryContext,
                    staticHandlerContext: context,
                    serverHandoffString: createServerHandoffString({
                        basename: build.basename,
                        future: build.future,
                        ssr: build.ssr,
                        isSpaMode,
                    }),
                    serverHandoffStream: encodeViaTurboStream(state, request.signal, build.entry.module.streamTimeout, serverMode),
                    renderMeta: {},
                };
                try {
                    return await handleDocumentRequestFunction(request, context.statusCode, headers, entryContext, loadContext);
                }
                catch (error) {
                    handleError(error);
                    return returnLastResortErrorResponse(error, serverMode);
                }
            }
        }
    }
    async function handleResourceRequest(serverMode, build, staticHandler, routeId, request, loadContext, handleError) {
        try {
            // Note we keep the routeId here to align with the Remix handling of
            // resource routes which doesn't take ?index into account and just takes
            // the leaf match
            let response = await staticHandler.queryRoute(request, {
                routeId,
                requestContext: loadContext,
                unstable_respond: build.future.unstable_middleware
                    ? (ctx) => ctx
                    : undefined,
            });
            if (isResponse(response)) {
                return response;
            }
            if (typeof response === "string") {
                return new Response(response);
            }
            return Response.json(response);
        }
        catch (error) {
            if (isResponse(error)) {
                // Note: Not functionally required but ensures that our response headers
                // match identically to what Remix returns
                error.headers.set("X-Remix-Catch", "yes");
                return error;
            }
            if (isRouteErrorResponse(error)) {
                if (error) {
                    handleError(error);
                }
                return errorResponseToJson(error, serverMode);
            }
            if (error instanceof Error &&
                error.message === "Expected a response from queryRoute") {
                let newError = new Error("Expected a Response to be returned from resource route handler");
                handleError(newError);
                return returnLastResortErrorResponse(newError, serverMode);
            }
            handleError(error);
            return returnLastResortErrorResponse(error, serverMode);
        }
    }
    function errorResponseToJson(errorResponse, serverMode) {
        return Response.json(serializeError(
        // @ts-expect-error This is "private" from users but intended for internal use
        errorResponse.error || new Error("Unexpected Server Error"), serverMode), {
            status: errorResponse.status,
            statusText: errorResponse.statusText,
            headers: {
                "X-Remix-Error": "yes",
            },
        });
    }
    function returnLastResortErrorResponse(error, serverMode) {
        let message = "Unexpected Server Error";
        if (serverMode !== exports.UNSAFE_ServerMode.Production) {
            message += `\n\n${String(error)}`;
        }
        // Good grief folks, get your act together 😂!
        return new Response(message, {
            status: 500,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    }
    function unwrapResponse(response) {
        let contentType = response.headers.get("Content-Type");
        // Check between word boundaries instead of startsWith() due to the last
        // paragraph of https://httpwg.org/specs/rfc9110.html#field.content-type
        return contentType && /\bapplication\/json\b/.test(contentType)
            ? response.body == null
                ? null
                : response.json()
            : response.text();
    }

    function flash(name) {
        return `__flash_${name}__`;
    }
    /**
     * Creates a new Session object.
     *
     * Note: This function is typically not invoked directly by application code.
     * Instead, use a `SessionStorage` object's `getSession` method.
     *
     * @see https://remix.run/utils/sessions#createsession
     */
    const createSession = (initialData = {}, id = "") => {
        let map = new Map(Object.entries(initialData));
        return {
            get id() {
                return id;
            },
            get data() {
                return Object.fromEntries(map);
            },
            has(name) {
                return (map.has(name) ||
                    map.has(flash(name)));
            },
            get(name) {
                if (map.has(name))
                    return map.get(name);
                let flashName = flash(name);
                if (map.has(flashName)) {
                    let value = map.get(flashName);
                    map.delete(flashName);
                    return value;
                }
                return undefined;
            },
            set(name, value) {
                map.set(name, value);
            },
            flash(name, value) {
                map.set(flash(name), value);
            },
            unset(name) {
                map.delete(name);
            },
        };
    };
    /**
     * Returns true if an object is a Remix session.
     *
     * @see https://remix.run/utils/sessions#issession
     */
    const isSession = (object) => {
        return (object != null &&
            typeof object.id === "string" &&
            typeof object.data !== "undefined" &&
            typeof object.has === "function" &&
            typeof object.get === "function" &&
            typeof object.set === "function" &&
            typeof object.flash === "function" &&
            typeof object.unset === "function");
    };
    /**
     * Creates a SessionStorage object using a SessionIdStorageStrategy.
     *
     * Note: This is a low-level API that should only be used if none of the
     * existing session storage options meet your requirements.
     */
    function createSessionStorage({ cookie: cookieArg, createData, readData, updateData, deleteData, }) {
        let cookie = isCookie(cookieArg)
            ? cookieArg
            : createCookie(cookieArg?.name || "__session", cookieArg);
        warnOnceAboutSigningSessionCookie(cookie);
        return {
            async getSession(cookieHeader, options) {
                let id = cookieHeader && (await cookie.parse(cookieHeader, options));
                let data = id && (await readData(id));
                return createSession(data || {}, id || "");
            },
            async commitSession(session, options) {
                let { id, data } = session;
                let expires = options?.maxAge != null
                    ? new Date(Date.now() + options.maxAge * 1000)
                    : options?.expires != null
                        ? options.expires
                        : cookie.expires;
                if (id) {
                    await updateData(id, data, expires);
                }
                else {
                    id = await createData(data, expires);
                }
                return cookie.serialize(id, options);
            },
            async destroySession(session, options) {
                await deleteData(session.id);
                return cookie.serialize("", {
                    ...options,
                    maxAge: undefined,
                    expires: new Date(0),
                });
            },
        };
    }
    function warnOnceAboutSigningSessionCookie(cookie) {
        warnOnce(cookie.isSigned, `The "${cookie.name}" cookie is not signed, but session cookies should be ` +
            `signed to prevent tampering on the client before they are sent back to the ` +
            `server. See https://remix.run/utils/cookies#signing-cookies ` +
            `for more information.`);
    }

    /**
     * Creates and returns a SessionStorage object that stores all session data
     * directly in the session cookie itself.
     *
     * This has the advantage that no database or other backend services are
     * needed, and can help to simplify some load-balanced scenarios. However, it
     * also has the limitation that serialized session data may not exceed the
     * browser's maximum cookie size. Trade-offs!
     */
    function createCookieSessionStorage({ cookie: cookieArg } = {}) {
        let cookie = isCookie(cookieArg)
            ? cookieArg
            : createCookie(cookieArg?.name || "__session", cookieArg);
        warnOnceAboutSigningSessionCookie(cookie);
        return {
            async getSession(cookieHeader, options) {
                return createSession((cookieHeader && (await cookie.parse(cookieHeader, options))) || {});
            },
            async commitSession(session, options) {
                let serializedCookie = await cookie.serialize(session.data, options);
                if (serializedCookie.length > 4096) {
                    throw new Error("Cookie length will exceed browser maximum. Length: " +
                        serializedCookie.length);
                }
                return serializedCookie;
            },
            async destroySession(_session, options) {
                return cookie.serialize("", {
                    ...options,
                    maxAge: undefined,
                    expires: new Date(0),
                });
            },
        };
    }

    /**
     * Creates and returns a simple in-memory SessionStorage object, mostly useful
     * for testing and as a reference implementation.
     *
     * Note: This storage does not scale beyond a single process, so it is not
     * suitable for most production scenarios.
     */
    function createMemorySessionStorage({ cookie } = {}) {
        let map = new Map();
        return createSessionStorage({
            cookie,
            async createData(data, expires) {
                let id = Math.random().toString(36).substring(2, 10);
                map.set(id, { data, expires });
                return id;
            },
            async readData(id) {
                if (map.has(id)) {
                    let { data, expires } = map.get(id);
                    if (!expires || expires > new Date()) {
                        return data;
                    }
                    // Remove expired session data.
                    if (expires)
                        map.delete(id);
                }
                return null;
            },
            async updateData(id, data, expires) {
                map.set(id, { data, expires });
            },
            async deleteData(id) {
                map.delete(id);
            },
        });
    }

    /**
      Returns a resolved URL path for the specified route.

      ```tsx
      const h = href("/:lang?/about", { lang: "en" })
      // -> `/en/about`

      <Link to={href("/products/:id", { id: "abc123" })} />
      ```
     */
    function href(path, ...args) {
        let params = args[0];
        return path
            .split("/")
            .map((segment) => {
            const match = segment.match(/^:([\w-]+)(\?)?/);
            if (!match)
                return segment;
            const param = match[1];
            const value = params ? params[param] : undefined;
            const isRequired = match[2] === undefined;
            if (isRequired && value === undefined) {
                throw Error(`Path '${path}' requires param '${param}' but it was not provided`);
            }
            return value;
        })
            .filter((segment) => segment !== undefined)
            .join("/");
    }

    function deserializeErrors(errors) {
        if (!errors)
            return null;
        let entries = Object.entries(errors);
        let serialized = {};
        for (let [key, val] of entries) {
            // Hey you!  If you change this, please change the corresponding logic in
            // serializeErrors in react-router/lib/server-runtime/errors.ts :)
            if (val && val.__type === "RouteErrorResponse") {
                serialized[key] = new ErrorResponseImpl(val.status, val.statusText, val.data, val.internal === true);
            }
            else if (val && val.__type === "Error") {
                // Attempt to reconstruct the right type of Error (i.e., ReferenceError)
                if (val.__subType) {
                    let ErrorConstructor = window[val.__subType];
                    if (typeof ErrorConstructor === "function") {
                        try {
                            // @ts-expect-error
                            let error = new ErrorConstructor(val.message);
                            error.stack = val.stack;
                            serialized[key] = error;
                        }
                        catch (e) {
                            // no-op - fall through and create a normal Error
                        }
                    }
                }
                if (serialized[key] == null) {
                    let error = new Error(val.message);
                    error.stack = val.stack;
                    serialized[key] = error;
                }
            }
            else {
                serialized[key] = val;
            }
        }
        return serialized;
    }

    exports.Await = Await;
    exports.BrowserRouter = BrowserRouter;
    exports.Form = Form;
    exports.HashRouter = HashRouter;
    exports.IDLE_BLOCKER = IDLE_BLOCKER;
    exports.IDLE_FETCHER = IDLE_FETCHER;
    exports.IDLE_NAVIGATION = IDLE_NAVIGATION;
    exports.Link = Link;
    exports.Links = Links;
    exports.MemoryRouter = MemoryRouter;
    exports.Meta = Meta;
    exports.NavLink = NavLink;
    exports.Navigate = Navigate;
    exports.Outlet = Outlet;
    exports.PrefetchPageLinks = PrefetchPageLinks;
    exports.Route = Route;
    exports.Router = Router;
    exports.RouterProvider = RouterProvider;
    exports.Routes = Routes;
    exports.Scripts = Scripts;
    exports.ScrollRestoration = ScrollRestoration;
    exports.ServerRouter = ServerRouter;
    exports.StaticRouter = StaticRouter;
    exports.StaticRouterProvider = StaticRouterProvider;
    exports.UNSAFE_DataRouterContext = DataRouterContext;
    exports.UNSAFE_DataRouterStateContext = DataRouterStateContext;
    exports.UNSAFE_ErrorResponseImpl = ErrorResponseImpl;
    exports.UNSAFE_FetchersContext = FetchersContext;
    exports.UNSAFE_FrameworkContext = FrameworkContext;
    exports.UNSAFE_LocationContext = LocationContext;
    exports.UNSAFE_NavigationContext = NavigationContext;
    exports.UNSAFE_RemixErrorBoundary = RemixErrorBoundary;
    exports.UNSAFE_RouteContext = RouteContext;
    exports.UNSAFE_SingleFetchRedirectSymbol = SingleFetchRedirectSymbol;
    exports.UNSAFE_ViewTransitionContext = ViewTransitionContext;
    exports.UNSAFE_createBrowserHistory = createBrowserHistory;
    exports.UNSAFE_createClientRoutes = createClientRoutes;
    exports.UNSAFE_createClientRoutesWithHMRRevalidationOptOut = createClientRoutesWithHMRRevalidationOptOut;
    exports.UNSAFE_createRouter = createRouter;
    exports.UNSAFE_decodeViaTurboStream = decodeViaTurboStream;
    exports.UNSAFE_deserializeErrors = deserializeErrors;
    exports.UNSAFE_getPatchRoutesOnNavigationFunction = getPatchRoutesOnNavigationFunction;
    exports.UNSAFE_getSingleFetchDataStrategy = getSingleFetchDataStrategy;
    exports.UNSAFE_invariant = invariant$2;
    exports.UNSAFE_mapRouteProperties = mapRouteProperties;
    exports.UNSAFE_shouldHydrateRouteLoader = shouldHydrateRouteLoader;
    exports.UNSAFE_useFogOFWarDiscovery = useFogOFWarDiscovery;
    exports.UNSAFE_useScrollRestoration = useScrollRestoration;
    exports.createBrowserRouter = createBrowserRouter;
    exports.createCookie = createCookie;
    exports.createCookieSessionStorage = createCookieSessionStorage;
    exports.createHashRouter = createHashRouter;
    exports.createMemoryRouter = createMemoryRouter;
    exports.createMemorySessionStorage = createMemorySessionStorage;
    exports.createPath = createPath;
    exports.createRequestHandler = createRequestHandler;
    exports.createRoutesFromChildren = createRoutesFromChildren;
    exports.createRoutesFromElements = createRoutesFromElements;
    exports.createRoutesStub = createRoutesStub;
    exports.createSearchParams = createSearchParams;
    exports.createSession = createSession;
    exports.createSessionStorage = createSessionStorage;
    exports.createStaticHandler = createStaticHandler;
    exports.createStaticRouter = createStaticRouter;
    exports.data = data;
    exports.generatePath = generatePath;
    exports.href = href;
    exports.isCookie = isCookie;
    exports.isRouteErrorResponse = isRouteErrorResponse;
    exports.isSession = isSession;
    exports.matchPath = matchPath;
    exports.matchRoutes = matchRoutes;
    exports.parsePath = parsePath;
    exports.redirect = redirect;
    exports.redirectDocument = redirectDocument;
    exports.renderMatches = renderMatches;
    exports.replace = replace;
    exports.resolvePath = resolvePath;
    exports.unstable_HistoryRouter = HistoryRouter;
    exports.unstable_RouterContextProvider = unstable_RouterContextProvider;
    exports.unstable_createContext = unstable_createContext;
    exports.unstable_setDevServerHooks = setDevServerHooks;
    exports.unstable_usePrompt = usePrompt;
    exports.useActionData = useActionData;
    exports.useAsyncError = useAsyncError;
    exports.useAsyncValue = useAsyncValue;
    exports.useBeforeUnload = useBeforeUnload;
    exports.useBlocker = useBlocker;
    exports.useFetcher = useFetcher;
    exports.useFetchers = useFetchers;
    exports.useFormAction = useFormAction;
    exports.useHref = useHref;
    exports.useInRouterContext = useInRouterContext;
    exports.useLinkClickHandler = useLinkClickHandler;
    exports.useLoaderData = useLoaderData;
    exports.useLocation = useLocation;
    exports.useMatch = useMatch;
    exports.useMatches = useMatches;
    exports.useNavigate = useNavigate;
    exports.useNavigation = useNavigation;
    exports.useNavigationType = useNavigationType;
    exports.useOutlet = useOutlet;
    exports.useOutletContext = useOutletContext;
    exports.useParams = useParams;
    exports.useResolvedPath = useResolvedPath;
    exports.useRevalidator = useRevalidator;
    exports.useRouteError = useRouteError;
    exports.useRouteLoaderData = useRouteLoaderData;
    exports.useRoutes = useRoutes;
    exports.useSearchParams = useSearchParams;
    exports.useSubmit = useSubmit;
    exports.useViewTransitionState = useViewTransitionState;

}));
//# sourceMappingURL=index.js.map
