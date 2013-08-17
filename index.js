'use strict';

exports.extend = extendApp;

function extendApp(app) {
    if (app['@annotations']) { return app; }

    // Brand.
    Object.defineProperty(app, '@annotations', {value: true});

    // Modifies the Express `app` by adding the `annotate()` and `findAll()`
    // methods.
    app.annotate = annotate;
    app.findAll  = findAll;

    return app;
}

function annotate(routePath, annotations) {
    /* jshint validthis:true */
    var routes = this.routes;

    // For annotation purposes, routes are treated as conceptual resources at a
    // URL, independent of which HTTP verb they were registered under. This
    // means all of this app's routes which match the specified `routePath` will
    // get the specified `annotations` applied.
    Object.keys(routes).forEach(function (method) {
        routes[method].forEach(function (route) {
            if (route.path === routePath) {
                if (!route.annotations) {
                    // Defines this route's "hidden", non-enumerable
                    // `annotations` property to hold its annotations.
                    Object.defineProperty(route, 'annotations', {value: {}});
                }

                // Merge the specified `annotations` onto this route.
                extend(route.annotations, annotations);
            }
        });
    });

    return this;
}

function findAll(annotations) {
    /* jshint validthis:true */

    // Support a single array of annotations, or var-args.
    if (!Array.isArray(annotations)) {
        annotations = [].slice.call(arguments);
    }

    var allRoutes = this.routes;

    // Reduce the collection of this app's routes down to those which match
    // _all_ of the specified `annotations`, and return them as an array.
    return Object.keys(allRoutes).reduce(function (routes, method) {
        allRoutes[method].forEach(function (route) {
            if (hasAnnotations(route, annotations)) {
                routes.push(route);
            }
        });

        // Initial array passed into this reduce function.
        return routes;
    }, []);
}

// -- Helper Functions ---------------------------------------------------------

function hasAnnotations(route, annotations) {
    if (!route.annotations) { return false; }

    // Annotations are specified as either a string name, or object of
    // name-value pairs.
    return annotations.every(function (annotation) {
        // Only an annotation name was provided, no value, so if the route has
        // an annotation property with that name, count it!
        if (typeof annotation === 'string') {
            return route.annotations.hasOwnProperty(annotation);
        }

        // Annotation is an object of name-value pairs, so all values need to
        // match the route's annotations for it to be counted.
        return Object.keys(annotation).every(function (name) {
            return route.annotations[name] === annotation[name];
        });
    });
}

function extend(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function (source) {
        if (!source) { return; }

        for (var key in source) {
            obj[key] = source[key];
        }
    });

    return obj;
}
