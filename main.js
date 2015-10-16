var scraperFormHtml = '<div class="title">Pollen Scraper</div>' +
  			'<form action="/scrapeSite" method="post">' +
  				'<label>Site to Scrape:</label><br />' +
  				'<input type="text" name="site" placeholder="http://www.charronmed.com" value="http://www.charronmed.com"/><br />' +
  				'<button type="submit">Scrape</button>' +
  			'</form>',
  	backToScraperButton = '<div class="title">Pollen Scraper</div>' +
  			'<a href="/">' +
  				'<button type="submit">Back to Scraper Form</button>' +
  			'</a>';



// Dependencies
var fs = require('fs'),
	phantom = require('phantom'),
	express = require('express'),
	cheerio = require('cheerio'),
	request = require('request'),
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

function displayScraperForm(req, res){
	res.send(scraperFormHtml);
}

function scrapeSite(req, res){
	var site = req.body.site,
		scraper = new Scraper(site),
		scrapeResults;

	console.log("Scraping: ", site);

	scraper.getSiteBodyHTML(null, function(html){
		scraper.showScrapeResults(html, res);
	});
}


/* =====================
		Scraper
======================*/
function Scraper(site){
	var OUTPUTFOLDER = '/output/';
	
	this.site = site;

	this.saveLocation = function(){
		return new URL(this.site).host;
	};

	this.getSiteBodyHTML = function(site, callback){
		request(site || this.site, function(error, response, html){
			if(!error){
				var $ = cheerio.load(html),
					$body = $('body'),
					bodyHTML = $body.html();

				if(typeof callback === "function"){
					callback(bodyHTML);
				}

				return bodyHTML;
			}
			else{
				console.log("Error!", error);
				return "";
			}
		});
	};

	this.showScrapeResults = function(results, res){
		res.send(results);
	};

	this.saveContent = function(html){
		var saveLoc = OUTPUTFOLDER + this.saveLocation();

		fs.writeFile(saveLoc, html, function(err){
			return console.log("Error Saving Content!", err);
		});

		console.log("File saved to " + saveLoc);
	};
}