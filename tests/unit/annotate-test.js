

/*jslint nomen:true, node:true*/
/*global describe, beforeEach, afterEach, it*/

'use strict';

var assert = require('chai').assert,
    libannotate = require('../../'),
    app,
    routes;

describe('test suite name', function () {

    beforeEach(function () {
        routes = {
            get: [
                {
                    path: '/posts/',
                    method: 'get',
                    callbacks: [Object],
                    keys: [],
                    regexp: /^\/posts\/\/?$/i
                }, {
                    path: '/posts/:postId',
                    method: 'get',
                    callbacks: [Object],
                    keys: [Object],
                    regexp: /^\/posts\/(?:([^\/]+?))\/?$/i
                }
            ]
        };
        app = {};
        app.routes = routes;
        libannotate.extend(app);
    });

    afterEach(function () {
        app = null;
    });

    describe('annotate', function () {
        it('should annotate first route with name "posts"', function () {
            assert.isFunction(app.annotate);
            app.annotate('/posts/', { foo: 'FOO' });

            // console.log(routes.get[0].annotations);
            assert.deepEqual(app.annotations['/posts/'],
                             { foo: 'FOO' },
                             'failed to annotate foo: "FOO" for path /posts/');
        });
    });

    describe('findAll', function () {
        it('should ** not find ** any routes with given annotations', function () {
            assert.isFunction(app.findAll);

            var r = app.findAll({name: 'foo'});
            console.log(app.routes);

            assert.isObject(r, 'app.findAll() should return an object');
            assert.isUndefined(r.get, 'No routes expected');
        });

        it('should find the first route with given annotations', function () {

            app.annotate('/posts/', { name: 'foo' });
            var r = app.findAll({name: 'foo'});

            assert.isObject(r, 'app.findAll() should return an object');
            assert.isArray(r.get, 'there should be `get` routes');
            assert.strictEqual(1, r.get.length, '1 found routes expected');
            assert.strictEqual('/posts/', r.get[0].path, 'wrong route.path');
        });

        it('should not find any route since annotations did not match', function () {

            app.annotate('/posts/', { name: 'foo' });

            var r = app.findAll({name: 'foo', 'class': 2000 });

            assert.isObject(r, 'app.findAll() should return an object');
            assert.isUndefined(r.get, 'No routes expected');
        });

    });
});
