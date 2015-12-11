/* =====================
    Scraper
======================*/
function Scraper(siteUrl){
  var self = this;

  self.hostName = url.parse(siteUrl).host;
  self.uncheckedLinks = [];
  self.checkedLinks = [];

  // This method takes a u
  self.scrape = function(url){

  };

}


function setupServer(){
  // Dependencies
  var fs = require('fs'),
    phantom = require('phantom'),
    express = require('express'),
    cheerio = require('cheerio'),
    request = require('request'),
    url = require('url'),
    Promise = require('promise'),
    _ = require('lodash'),
    bodyParser = require('body-parser');

  // Setup
  var app = express();

  app.use(bodyParser.json());       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  }));

  // GET
  app.get('/', displayScraperForm);


  // POST
  app.post('/scrapeSite', scrapeSite);

  // Server
  var server = app.listen(3000, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Pollen Scraper listening at http://%s:%s', host, port);

  });
}

function scrapeSite(req, res){
  var site = req.body.site,
    scraper = new Scraper(site);

  scraper.scrape([site]);
}