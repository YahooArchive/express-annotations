'use strict';

var extendExpress = require('express-extend');

exports.extend = extendExpress('@annotations', exports, extendApp);

function extendApp(app) {
    // Modifies the Express `app` by adding the `annotate()` and `findAll()`
    // methods.
    app.annotations = {};
    app.annotate    = annotate;
    app.findAll     = findAll;
}

function annotate(routePath, annotations) {
    /* jshint validthis:true */
    if (typeof routePath !== 'string') {
        throw new TypeError('Annotations require routePath to be a String');
    }

    var pathAnnotations = this.annotations[routePath] ||
            (this.annotations[routePath] = {});

    extend(pathAnnotations, annotations);
    return this;
}

function findAll(annotations) {
    /* jshint validthis:true */

    // Support a single array of annotations, or var-args.
    if (!(typeof annotations === 'function' || Array.isArray(annotations))) {
        annotations = [].slice.call(arguments);
    }

    var appAnnotations = this.annotations,
        routes         = this.routes;

    // Iterate all the app's routes, and return a reduced set based on the
    // specified `annotations`.
    return Object.keys(routes).reduce(function (map, method) {
        var matched = [];

        routes[method].forEach(function (route) {
            var pathAnnotations = typeof route.path === 'string' &&
                    appAnnotations[route.path];

            if (hasAnnotations(pathAnnotations, annotations)) {
                matched.push(route);
            }
        });

        if (matched.length) {
            map[method] = matched;
        }

        return map;
    }, {});
}

// -- Helper Functions ---------------------------------------------------------

function hasAnnotations(pathAnnotations, annotations) {
    if (!pathAnnotations) { return false; }

    // A function can be supplied instead of a collection of annotations, and in
    // that case it's called and it return value is coerced into a boolean and
    // returned.
    if (typeof annotations === 'function') {
        return !!annotations(pathAnnotations);
    }

    // Annotations are specified as either a string name, or object of
    // name-value pairs.
    return annotations.every(function (annotation) {
        // Only an annotation name was provided, no value, so if the path has an
        // annotation property with that name, count it!
        if (typeof annotation === 'string') {
            return pathAnnotations.hasOwnProperty(annotation);
        }

        // Annotation is an object of name-value pairs, so all values need to
        // match the path's annotations for it to be counted.
        return Object.keys(annotation).every(function (name) {
            return pathAnnotations[name] === annotation[name];
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
