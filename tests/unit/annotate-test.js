/*jslint nomen:true, node:true, expr:true*/
/*global describe, beforeEach, afterEach, it*/

'use strict';

var expect      = require('chai').expect,
    annotations = require('../../'),
    express     = require('express'),

    app;

describe('Express Annotations', function () {

    beforeEach(function () {
        // Create an Express app instance, and extend it
        app = express();
        annotations.extend(app);
    });

    afterEach(function () {
        app = null;
    });

    it('should extend the Express app with extra methods', function () {
        expect(app.annotate).to.be.a('function');
        expect(app.findAll).to.be.a('function');
        expect(app.annotations).to.be.an('object');
    });

    it('should return the app as is if the brand is already there', function () {
        var app = { '@annotations': true, 'mock': true };
        annotations.extend(app);

        expect(app.annotate).to.be.undefined;
        expect(app.findAll).to.be.undefined;
        expect(app.annotations).to.be.undefined;

        expect(app.mock).to.be.true;
    });

    describe('#annotate', function () {
        it('should return the app instance when called', function () {
            var appInstance = app.annotate('/', {
                label: 'Home'
            });

            expect(appInstance).to.deep.equal(app);
        });

        it('should only accept route paths as strings', function () {
            expect(function () {
                app.annotate(/^\/\/?$/i, {
                    label: 'Home'
                });
            }).to.throw(TypeError, 'Annotations require route path to be a String');
        });

        it('should annotate a path correctly with an annotations object', function () {
            app.annotate('/blog/:post', {
                label: 'Blog Post',
                section: 'blog'
            });

            expect(app.annotations['/blog/:post']).to.deep.equal({
                label: 'Blog Post',
                section: 'blog'
            });
        });


        it('should extend existing annotations on the route', function () {
            app.annotate('/users/:user', {
                label: 'User Profile'
            });

            app.annotate('/users/:user', {
                section: 'app'
            });

            expect(app.annotations['/users/:user']).to.deep.equal({
                label: 'User Profile',
                section: 'app'
            });
        });


        it('should create an empty annotations object on the route if none are passed in', function () {
            app.annotate('/');
            expect(app.annotations['/']).to.be.an('object');
            expect(app.annotations['/']).to.be.empty;
        });
    });

    describe('#findAll', function () {
        describe('With invalid routes', function () {
            it('should return an empty object if no routes were set up with annotations', function () {
                var routes = app.findAll({ section: 'app' });

                expect(routes).to.be.an('object');
                expect(routes).to.be.empty;
            });

            it('should return an empty object if we have no string-based routes', function () {
                var routes;

                // Creating a route path using a regular expression
                app.get(/^\/\/?$/i, function () { /* no-op for testing purposes */ });

                routes = app.findAll({ section: 'app' });

                expect(routes).to.be.an('object');
                expect(routes).to.be.empty;
            });
        });

        describe('With valid routes', function () {
            beforeEach(function () {
                var render = function () { /* no-op for testing purposes */ };

                app.get('/', render);
                app.annotate('/', {
                    label: 'Home',
                    section: 'app',
                    index: true
                });

                [2010, 2011, 2012, 2013].forEach(function (year) {
                    var path = '/classes/' + year;
                    app.get(path, render);
                    app.annotate(path, {
                        label: 'Class of ' + year,
                        section: 'app',
                        year: year
                    });
                });

                app.get('/blog', render);
                app.post('/blog', render);
                app.annotate('/blog', {
                    label: 'Blog',
                    section: 'blog',
                    index: true
                });

                app.get('/blog/:post', render);
                app.annotate('/blog/:post', {
                    label: 'Blog Post',
                    section: 'blog'
                });
            });

            it('should accept a string and return all routes with that given annotation property', function () {
                var routes = app.findAll('year');

                // The found routes are indexed by their HTTP method (GET, POST, PUT, etc.)
                // For this example, we only created routes accessible with GET
                expect(routes).to.contain.key('get');

                // Examine the found routes
                expect(routes.get).to.be.an('array');
                expect(routes.get).to.have.length(4);

                // Check paths of each route
                expect(routes.get.map(function (route) {
                    return route.path;
                })).to.include('/classes/2010', '/classes/2011', '/classes/2012', '/classes/2013');
            });

            it('should accept an object and return all routes with those annotation key/value pairs', function () {
                var routes = app.findAll({
                    section: 'blog'
                });

                // Again, only GET routes for this test
                expect(routes.get).to.be.an('array');
                expect(routes.get).to.have.length(2);

                // Check paths of each route
                expect(routes.get.map(function (route) {
                    return route.path;
                })).to.include('/blog', '/blog/:post');
            });

            it('should accept an array of annotations and return all matching routes', function () {
                var routes = app.findAll(['index', { section: 'app' }]),
                    route;

                expect(routes.get).to.be.an('array');
                expect(routes.get).to.have.length(1);

                route = routes.get[0];

                expect(route).to.have.property('path', '/');
            });

            it('should accept a variable number of arguments as annotation filters', function () {
                var routes = app.findAll('index', { section: 'blog' }),
                    route;

                expect(routes.get).to.be.an('array');
                expect(routes.get).to.have.length(1);

                route = routes.get[0];

                expect(route).to.have.property('path', '/blog');
            });

            it('should accept a function and return all matching routes', function () {
                var routes = app.findAll(function (annotations) {
                    return annotations.year > 2011;
                });

                expect(routes.get).to.be.an('array');
                expect(routes.get).to.have.length(2);

                expect(routes.get.map(function (route) {
                    return route.path;
                })).to.include('/classes/2012', '/classes/2013');
            });

            it('should return an empty object for an unmatched filter', function () {
                var routes = app.findAll('nothing');

                expect(routes).to.be.an('object');
                expect(routes).to.be.empty;
            });

            it('should match routes between different HTTP methods', function () {
                var routes = app.findAll({ label: 'Blog' });

                // '/blog' has both GET and POST routes
                expect(routes).to.contain.keys('get', 'post');

                expect(routes.get).to.be.an('array');
                expect(routes.post).to.be.an('array');

                expect(routes.get[0]).to.have.property('path', '/blog');
                expect(routes.post[0]).to.have.property('path', '/blog');
            });

            it('should contain the correct information inside each route', function () {
                var routes = app.findAll({ label: 'Blog Post' }),
                    route = routes.get[0];

                expect(route).to.contain.keys('path', 'method', 'keys', 'regexp');

                expect(route.path).to.be.a('string');
                expect(route.method).to.be.a('string');
                expect(route.keys).to.be.an('array');
                expect(route.regexp).to.be.a('regexp');
            });
        });
    });
});
