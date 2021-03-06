﻿// This is the main requirejs script

requirejs.config({
    // This defines aliases for requirejs modules, so you don't have to type the full path:
    paths: {
        'durandal': '../lib/durandal/js',
        'jquery': '../lib/jquery/dist/jquery.min',
        'knockout': '../lib/knockout/build/output/knockout-latest',
        'knockout.punches': '../lib/knockout.punches/index',
        'plugins': '../lib/durandal/js/plugins',
        'text': '../lib/require/text',
        'transitions': '../lib/durandal/js/transitions'
        // FYI require.js automatically appends '.js' to these paths above.   Why? I don't know...
    },
    // Some non-requirejs libraries need their dependencies configured for them:
    shim: {
        'jquery.bootstrap': { deps: ['jquery'] }
    }
});

// The application entry point:
define(function (require) {

    // Durandal configuration:
    var app = require('durandal/app');
    var system = require('durandal/system');
    var viewLocator = require('durandal/viewLocator');
    
    require(['knockout', 'knockout.punches'], function(ko){
        ko.punches.enableAll();
        ko.punches.attributeInterpolationMarkup.enable();
    });
    
    system.debug(true);

    app.title = 'node.js Rules';
    app.configurePlugins({
        observable: true, // eliminates need for `ko.observable(...)`
        router: true
    });

    // This call starts the client side view rendering and routing:
    app.start()
        .then(function () {
            viewLocator.useConvention();

            // This will call the Shell.js module, and use the 'entrance' animation to display the view.
            app.setRoot('Shell', 'entrance');
        });
});