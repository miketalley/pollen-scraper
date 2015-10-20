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

function displayScraperForm(req, res){
	res.send(scraperFormHtml);
}

function scrapeSite(req, res){
	var site = req.body.site,
		scraper = new Scraper(site),
		uniqueLinks = [];

	console.log("Scraping: ", site);

	uniqueLinks = scraper.getUniqueSiteLinks(site);
	// scraper.getSiteHTML(null, function(html){
	// 	var $ = scraper.createFakeDOM(html);
	// 	console.log(3333, uniqueLinks);
	// });
		
	scraper.showScrapeResults(uniqueLinks, res);
}


/* =====================
		Scraper
======================*/
function Scraper(site){
	var self = this,
		OUTPUTFOLDER = '/output/';
	
	this.site = site;

	this.saveLocation = function(){
		return new URL(this.site).host;
	};

	this.getSiteHTML = function(site){
		if(typeof site !== "string"){
			throw new Error("No site passed to getSiteHTML!");
		}
		
		return new Promise(function(resolve, reject){
			request(site, function(error, response, html){
				if(!error){
					resolve(html);
				}
				else{
					console.log("Error!", error);
					reject(error);
				}
			});
			
		});
	};

	this.createFakeDOM = function(html){
		return cheerio.load(html);
	};

	this.getBodyHTML = function($){
		var $body = $('body');
		
		return $body.html();
	};

	this.showScrapeResults = function(results, res){
		results.forEach(function(result){
			console.log(9876543210, result);
		});

		// res.send(results);
	};

	this.saveContent = function(html){
		var saveLoc = OUTPUTFOLDER + this.saveLocation();

		fs.writeFile(saveLoc, html, function(err){
			return console.log("Error Saving Content!", err);
		});

		console.log("File saved to " + saveLoc);
	};

	// This function looks at url, finds links
	// gets unique links, and returns them
	this.findUniqueLinksOnPage = function(url){

	};

	// This method takes a linkUrl and checks it to
	// see if it is a local/external link and also
	// catches relative links and attaches the site
	// url to them to try
	this.fixLink = function(linkUrl){
		var urlObj = url.parse(linkUrl),
			thisHost = url.parse(this.site).host;

		if(typeof linkUrl !== "string" || !linkUrl.length){ throw new Error("fixLink must be passed a valid string!");}

		if(!urlObj.host){
			return this.site + (linkUrl[0] === '/' ? linkUrl : '/' + linkUrl);
		}
		else if(urlObj.host === thisHost){
			return linkUrl;
		}
		else{
			return false;
		}
	};

	this.getLinksFromHTML = function(html){
		var $ = this.createFakeDOM(html),
			links = $('a'),
			linksArray = Array.prototype.slice.call(links);

		linksArray = linksArray.map(function(link){
			return self.fixLink(link.attribs.href);
		});

		linksArray = _.uniq(linksArray);

		return linksArray;
	};

	this.getLinksFromPage = function(url){
		var pageHTML = this.getSiteHTML(url);

		return new Promise(function(resolve, reject){
			pageHTML.done(function(resp){
				if(resp){
					var links = self.getLinksFromHTML(resp);

					resolve(links);
				}
				else{
					reject("No response");
				}
			});
		});
	};

	this.processUniqueLinks = function(links, accumulator){

	};
	
	this.getUniqueSiteLinks = function(url){
		var uniqueLinks = [];
			pageLinks = this.getLinksFromPage(url);

		pageLinks.done(function(links){
			self.processUniqueLinks(links, uniqueLinks);
		});

		return uniqueLinks;
	};

}

scrapeSite({
	body: {
		site: "http://www.charronmed.com"
	}
}, null);

