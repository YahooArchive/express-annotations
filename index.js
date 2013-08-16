'use strict';

exports.extend = extendApp;

function extendApp(app) {
    if (app['@annotate']) { return app; }

    // Brand.
    Object.defineProperty(app, '@annotate', {value: true});

    app.annotate = annotate;
    app.findAll  = findAll;

    return app;
}

function annotate(routePath, annotations) {
    /* jshint validthis:true */
    var routes = this.routes;

    Object.keys(routes).forEach(function (method) {
        routes[method].forEach(function (route) {
            if (route.path === routePath) {
                if (!route.annotations) {
                    Object.defineProperty(route, 'annotations', {value: {}});
                }

                extend(route.annotations, annotations);
            }
        });
    });
}

function findAll(annotations) {
    /* jshint validthis:true */

    if (!Array.isArray(annotations)) {
        annotations = [].slice.call(arguments);
    }

    var routes = [];

    Object.keys(this.routes).forEach(function (method) {
        this.routes[method].forEach(function (route) {
            if (!route.annotations) { return; }

            var hasAnnotations = annotations.every(function (annotation) {
                if (typeof annotation === 'string') {
                    return route.annotations.hasOwnProperty(annotation);
                }

                return Object.keys(annotation).every(function (name) {
                    return route.annotations[name] === annotation[name];
                });
            });

            if (hasAnnotations) {
                routes.push(route);
            }
        });
    }, this);

    return routes;
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
