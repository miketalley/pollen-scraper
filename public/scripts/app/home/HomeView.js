// This define call is requirejs boilerplate used to define the module and isolate the scope:
define(function (require, exports, module) {

    var ko = require('knockout');
    var http = require('plugins/http');

    // Constructor function for this module
    function HomeView() {
        // This is (one) convention used to manage the scope of 'this', common in Knockout examples:
        var self = this;

        // This value will be data-bound to the references in HomeView.html:
        self.siteUrl = ko.observable('');
        self.links = ko.observableArray();

        self.scrapeSite = function(){
          http.get('/api/scrapeSite', {
            site: self.siteUrl()
          }).then(function(){
            debugger;
          });
        };
    }

    // This returns the constructor function, will be called automatically by Durandal when composing view:
    module.exports = HomeView;
});