var scraperFormHtml = '<div class="title">Pollen Scraper</div>' +
  			'<form action="/scrapeSite" method="post">' +
  				'<label>Site to Scrape:</label><br />' +
  				'<input type="text" name="site" placeholder="http://www.thrivehive.com"/><br />' +
  				'<button type="submit">Scrape</button>' +
  			'</form>',
  	backToScraperButton = '<div class="title">Pollen Scraper</div>' +
  			'<a href="/">' +
  				'<button type="submit">Back to Scraper Form</button>' +
  			'</a>';



// Dependencies
var fs = require('fs'),
	$ = require('jquery'),
	phantom = require('phantom'),
	express = require('express'),
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
app.post('/scrapeSite', showScrapeResults);

// Server
var server = app.listen(3000, function(){
  var host = server.address().address;
  var port = server.address().port;

  console.log('Pollen Scraper listening at http://%s:%s', host, port);

});

function displayScraperForm(req, res){
	res.send(scraperFormHtml);
}

function showScrapeResults(req, res){
	var siteToScrape = req.body.site;

	console.log("Scraping: ", siteToScrape);
	res.send(siteToScrape + backToScraperButton);
}