Express Annotations
===================

[![Build Status](https://travis-ci.org/yahoo/express-annotations.png?branch=master)](https://travis-ci.org/yahoo/express-annotations)
[![Dependency Status](https://gemnasium.com/yahoo/express-annotations.png)](https://gemnasium.com/yahoo/express-annotations)
[![npm Version](https://badge.fury.io/js/express-annotations.png)](https://npmjs.org/package/express-annotations)

Augment your Express routes with metadata, so they can be serialized and shared
between different environments, such as the browser and server.

Overview
--------

### Goals

When creating routes for an application, there's often extra information that 
might be helpful to be attached to them when rendering them out in a template. 

For instance, if you were creating a navigation menu, and wanted it to be
updated automatically whenever you created a new route on your application, it
might be useful to know what label you would want the route to have on the menu,
and what subsection of your application that route would fall under, so you
could automatically render it as soon as you set up the route.

Express Annotations solves this problem for you by giving you the ability to
set arbitrary metadata on any route in your Express application, which you
serialize to use in any environment, be in browser or server.

### How It Works

You specify a route path and an annotations object using 
`app.annotate(path, annotations)`. These annotations are added to an
app-level annotations object, which you can use to look up the annotations of
any route in your application.

Installation
------------

Install using npm:

```
$ npm install express-annotations
```

Usage
-----

### Extending an Express App

To use Express Annotations with an Express app, the app must first be extended.
Use the `extend()` method that Express Annotations exports:

```js
var express     = require('express'),
    annotations = require('express-annotations'),

    app = express();

annotations.extend(app);
```

Once extended, the `app` object will contain two new methods, and a
new property, `annotations`:

## Methods

### `app.annotate(path, annotations)`

This function takes in a given URL path string for a route, and an
annotations object, which can contain any arbitrary values.

It maps together that `path` to the provided `annotations` object
inside of `app.annotations`. If that path has existing annotations in
`app.annotations`, then the new `annotations` object will extend
those existing annotations, overwriting any previous annotations
with the same key.

An example of using this method:

```js
app.annotate('/movies', {label: 'Movies', section: 'entertainment'});
app.annotate('/finance', {label: 'Finance', section: 'news'});

app.get('/movies', function (req, res) {
    // ...
});

app.get('/finance', function (req, res) {
    // ...
});
```

A common technique to use is to create a sugar method that combines the actual
`app.VERB()` route with `app.annotate()`, though we kept this separate for more
flexibility in how you use Express Annotations. The above is functionally
equivalent to:

```js
function labelPage(path, annotations, callback) {
    app.annotate(path, annotations);
    app.get(path, callback);
}

labelPage('/movies', {label: 'Movies', section: 'entertainment'}, function (req, res) {
    // ...
});

labelPage('/finance', {label: 'Finance', section: 'news'}, function (req, res) {
    // ...
});
```

This sets up the annotations for you, which you can use directly by referencing
them inside of the `app.annotations` object, or filter them, using the
`app.findAll` function.

### `app.findAll(annotations)`

This function returns an object representing the list of available routes,
sorted by their respective HTTP methods. If no `annotations` are passed in,
then all routes are returned (effectively the same as `app.routes`).

An example object, using the routes above, looks like this:

```js
{
    get: [{
        path: '/movies',
        method: 'get',
        callbacks: [Object],
        keys: [],
        regexp: /^\/movies\/?$/i
    }, {
        path: '/finance',
        method: 'get',
        callbacks: [Object],
        keys: [],
        regexp: /^\/finance\/?$/i
    }]
}
```

Like the `app.routes` object, there can be multiple keys (for HTTP methods such
as `get`, `post`, `put`, `delete`, etc.), and they can also have references to
their parameter keys as well as multiple callbacks.

If you wanted to get only the routes that were in the `news` section, for
instance:

```js
var newsRoutes = app.findAll({ section: 'news' });
/*
Would only return one route => {
    get: [{
        path: '/finance',
        method: 'get',
        callbacks: [Object],
        keys: [],
        regexp: /^\/finance\/?$/i
    }]
}
*/
```

`app.findAll` is extremely flexible and can take any of the following parameters:
* Strings (for the key of the annotation)
* Objects (for a specific key/value pair of the annotation)
* Arrays (combining a mix of any number of string or object filters)
* Functions (with anything returning truthy to be considered a match)

## Properties

### `app.annotations`

This is the annotations object, which simply is just a map between the route
paths and their annotations. Using the above annotations, we have the following
object:

```js
{
    '/movies': {
        label: 'Movies',
        section: 'entertainment'
    },
    '/finance': {
        label: 'Finance',
        section: 'news'
    }
}
```

Advanced Use Cases
------------------

There are many possible uses for Express Annotations, particularly with sharing
data between client-side routes and server-side routes for single page
applications.

It's generally recommended to use [Express Map](https://github.com/yahoo/express-map) as well when using Express Annotations.  You can take a look at some of the
more advanced examples with Express Map to see what more complicated
applications can be created in combination with Express Annotations.

License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[LICENSE file]: https://github.com/yahoo/express-annotations/blob/master/LICENSE.md

Contribute
----------

See the [CONTRIBUTING file][] for information on contributing back to Express
Map.

[CONTRIBUTING file]: https://github.com/yahoo/express-annotations/blob/master/CONTRIBUTING.md
