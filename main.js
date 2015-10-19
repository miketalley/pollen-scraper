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

	scraper.getSiteHTML(null, function(html){
		var $dom = scraper.createFakeDOM(html),
			uniqueAnchors = scraper.getUniqueLinks($dom),
			uniqueLinks = [];

		uniqueAnchors.forEach(function(a){
			var fixedAnchor = scraper.fixLink(a.attribs.href);

			if(fixedAnchor){
				uniqueLinks.push(fixedAnchor);
			}
		});

		scraper.showScrapeResults(uniqueLinks, res);
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

	this.getSiteHTML = function(site, callback){
		if(typeof callback !== "function"){
			throw new Error("No callback! getSiteHTML must be passed a site and callback!");
		}

		request(site || this.site, function(error, response, html){
			if(!error){
				callback(html);
				return html;
			}
			else{
				console.log("Error!", error);
				return "";
			}
		});
	};

	this.createFakeDOM = function(html){
		return cheerio.load(html);
	};

	this.getBodyHTML = function($){
		var $body = $('body');
		
		return $body.html();
	};

	this.getUniqueLinks = function($){
		var links = $('a'),
			uniqueLinks = [],
			linksArray = Array.prototype.slice.call(links);

		// TODO -- Make this faster
		// Watch out for anchors with no href
		linksArray.forEach(function(link){
			var duplicateHrefAttributeFound = uniqueLinks.filter(function(uniqueLink){
				return uniqueLink.attribs.href === link.attribs.href;
			})[0];

			if(!duplicateHrefAttributeFound){
				uniqueLinks.push(link);
			}
		});

		return uniqueLinks;
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
}

scrapeSite({
	body: {
		site: "http://www.charronmed.com"
	}
}, null);

