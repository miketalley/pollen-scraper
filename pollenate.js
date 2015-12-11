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

    console.log("Scraping!", self.uncheckedLinks.length, self.checkedLinks.length);

    urls.forEach(function(url){
      if(urlIsUnchecked(url)){
        setTimeout(function(){
          var newLinksPromise = self.getLinksFromUrl(url);

          console.log('Got new links promise', newLinksPromise);
          promises.push(newLinksPromise);
        }, 1000);
      }
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
          // console.log("Unchecked Link: ", uncheckedLink);
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
    // console.log("Getting links from Url: ", url);
    return new Promise(function(resolve, reject){
      // Get HTML -- Needs promise
      self.getHtml(url).done(function(html){
        // Resolve with url and unique links
        // console.log("Html returned to getLinksFromUrl", url);
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
      // console.log('Requesting Site: ', site);
      request(site, function(error, response, html){
        if(!error){
          // console.log('Got HTML!');
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
    // console.log('Generating fake DOM');
    return cheerio.load(html);
  };

  this.getLinksFromHtml = function(html){
    var $ = self.fakeDOM(html),
      links = $('a'),
      linksArray = Array.prototype.slice.call(links);

    linksArray = linksArray.map(function(link){
      return fixLink(link.attribs.href || "");
    });

    linksArray = _.uniq(linksArray);

    // console.log('Links found in HTML', linksArray.length);
    return linksArray;
    
    function fixLink(linkUrl){
      var urlObj = url.parse(linkUrl);
        thisHost = url.parse(self.site).host,
        blackListedExtensions = ['pdf'],
        isBlackListed = false;

      if(typeof linkUrl !== "string"){ 
        console.log('Invalid string: ', linkUrl);
        console.log("THROWN: ", linkUrl);
        return false;
        // throw new Error("fixLink must be passed a valid string!");
      }

      blackListedExtensions.forEach(function(ext){
        if(linkUrl.indexOf(ext) !== -1){
          isBlackListed = true;
        }
      });

      if(isBlackListed){
        return false;
      }
      else if(!urlObj.host){
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
      var index = self.uncheckedLinks.indexOf(url);

      console.log("Adding to checked: ", url);

      self.uncheckedLinks.splice(index, 1);
      self.checkedLinks.push(url);
    }
  }

  function addToUncheckedLinks(urlArray){
    urlArray.forEach(function(url){
      url = cleanUrl(url);

      if(url && urlIsValid(url) && urlIsUnchecked(url) && self.uncheckedLinks.indexOf(url) === -1){
        self.uncheckedLinks.push(url);
      }
    });
  }

  function urlIsValid(url){
    var rg = /^(http|https):\/\/(([a-zA-Z0-9$\-_.+!*'(),;:&=]|%[0-9a-fA-F]{2})+@)?(((25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])(\.(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])){3})|localhost|([a-zA-Z0-9\-\u00C0-\u017F]+\.)+([a-zA-Z]{2,}))(:[0-9]+)?(\/(([a-zA-Z0-9$\-_.+!*'(),;:@&=]|%[0-9a-fA-F]{2})*(\/([a-zA-Z0-9$\-_.+!*'(),;:@&=]|%[0-9a-fA-F]{2})*)*)?(\?([a-zA-Z0-9$\-_.+!*'(),;:@&=\/?]|%[0-9a-fA-F]{2})*)?(\#([a-zA-Z0-9$\-_.+!*'(),;:@&=\/?]|%[0-9a-fA-F]{2})*)?)?$/;
    
    return rg.test(url);
  }

  function cleanUrl(url){
    if(url[url.length - 1] === '/'){
      url = url.slice(0, url.length - 1);
    }

    return url;
  }

  function urlIsUnchecked(url){
    url = cleanUrl(url);
    
    return self.checkedLinks.indexOf(url) === -1;
  }
}

scrapeSite({
  body: {
    site: "http://www.charronmed.com"
  }
}, null);

