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
    scraper = new Scraper(site);


  scraper.scrape([site]);

}


/* =====================
    Scraper
======================*/
function Scraper(siteUrl){
  var self = this;

  this.site = siteUrl;
  this.uncheckedLinks = [];
  this.checkedLinks = [];

  this.scrape = function(urls){
    var promises = [];

    urls.forEach(function(url){
      var newLinksPromise = self.getLinksFromUrl(url);

      console.log('Got new links promise', newLinksPromise);
      promises.push(newLinksPromise);
    });

    Promise.all(promises).done(function(getLinksObjArray){
      getLinksObjArray.forEach(function(obj){
        // This url has now been scraped successfully
        addToCheckedLinks(obj.url);
        // Add the links that it found to the uncheckedLinks array
        addToUncheckedLinks(obj.links);
      });

      if(self.uncheckedLinks.length){
        self.uncheckedLinks.forEach(function(uncheckedLink){
          console.log("Unchecked Link: ", uncheckedLink);
        });
        
        self.scrape(self.uncheckedLinks);
      }
      else{
        console.log("DONE!!!! Found " + self.checkedLinks.length + " links!");
        return self.checkedLinks;
      }
    });
  };

  this.getLinksFromUrl = function(url){
    console.log("Getting links from Url: ", url);
    return new Promise(function(resolve, reject){
      // Get HTML -- Needs promise
      self.getHtml(url).done(function(html){
        // Resolve with url and unique links
        console.log("Html returned to getLinksFromUrl", url);
        resolve({
          url: url,
          links: self.getLinksFromHtml(html)
        });
      });
    });
  };

  this.getHtml = function(site){
    if(typeof site !== "string"){
      throw new Error("No site passed to getHTML!");
    }
    
    return new Promise(function(resolve, reject){
      console.log('Requesting Site: ', site);
      request(site, function(error, response, html){
        if(!error){
          console.log('Got HTML!');
          resolve(html);
        }
        else{
          console.log("Error!", error);
          reject(error);
        }
      });
    });
  };

  this.fakeDOM = function(html){
    console.log('Generating fake DOM');
    return cheerio.load(html);
  };

  this.getLinksFromHtml = function(html){
    var $ = self.fakeDOM(html),
      links = $('a'),
      linksArray = Array.prototype.slice.call(links);

    linksArray = linksArray.map(function(link){
      return fixLink(link.attribs.href);
    });

    linksArray = _.uniq(linksArray);

    console.log('Links found in HTML', linksArray.length);
    return linksArray;
    
    function fixLink(linkUrl){
      var urlObj = url.parse(linkUrl);
        thisHost = url.parse(self.site).host;

      if(typeof linkUrl !== "string" || !linkUrl.length){ throw new Error("fixLink must be passed a valid string!");}

      if(!urlObj.host){
        return self.site + (linkUrl[0] === '/' ? linkUrl : '/' + linkUrl);
      }
      else if(urlObj.host === thisHost){
        return linkUrl;
      }
      else{
        return false;
      }
    }
  };

  function addToCheckedLinks(url){
    if(self.checkedLinks.indexOf(url) === -1){
      self.checkedLinks.push(url);
    }
  }

  function addToUncheckedLinks(urlArray){
    urlArray.forEach(function(url){
      if(url && self.uncheckedLinks.indexOf(url) === -1){
        self.uncheckedLinks.push(url);
      }
    });
  }
}

scrapeSite({
  body: {
    site: "http://www.charronmed.com"
  }
}, null);

