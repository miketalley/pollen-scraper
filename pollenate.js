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
  path = require('path'),
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
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/scraperForm.html'));
});


// POST
app.post('/scrapeSite', scrapeSite);

// Server
var server = app.listen(3000, function(){
  var host = server.address().address;
  var port = server.address().port;

  console.log('Pollen Scraper listening at http://%s:%s', host, port);

});

function displayScraperForm(req, res){
  fs.readFile('./views/scraperForm.html', function(err, data){
    console.log(arguments);
    res.send(data);
    // res.send(scraperFormHtml);
  });
}

function scrapeSite(req, res){
  var site = req.body.site,
    sendResponse = function(scrapedSites){
      res.json(scrapedSites);
    },
    scraper = new Scraper(site, sendResponse);

  console.log('Scraping site: ', site);
  scraper.scrape([site]);
}


/* =====================
    Scraper
======================*/
function Scraper(siteUrl, doneScraping){
  var self = this;

  this.site = siteUrl;
  this.uncheckedLinks = [];
  this.checkedLinks = [];
  this.checkedLinksObjects = [];

  this.scrape = function(urls){
    var promises = [];

    urls.forEach(function(url){
      if(urlIsUnchecked(url)){
        promises.push(self.getLinksFromUrl(url));
      }
    });

    // Wait for all links to be retrieved first
    Promise.all(promises).done(function(getLinksObjArray){
      getLinksObjArray.forEach(function(obj){
        // This url has now been scraped successfully
        addToCheckedLinks(obj);
        // Add the links that it found to the uncheckedLinks array
        addToUncheckedLinks(obj.links);
      });

      if(self.uncheckedLinks.length && getLinksObjArray.length){
        self.scrape(self.uncheckedLinks);
      }
      else{
        console.log("Found " + self.checkedLinks.length + " links.");
        self.checkedLinks.forEach(function(link, i){
          console.log("Checked Link: ", link);
          if(i === self.checkedLinks.length - 1){
            console.log(self.checkedLinksObjects[i]);
          }

          if(typeof doneScraping === "function"){
            doneScraping(self.checkedLinksObjects);
          }
        });
        return self.checkedLinks;
      }
    });
  };

  this.getLinksFromUrl = function(url){
    return new Promise(function(resolve, reject){
      // Get HTML -- Needs promise
      self.getHtml(url).done(function(html){
        // Resolve with url and unique links
        resolve({
          url: url,
          links: self.getLinksFromHtml(html),
          html: html
        });
      });
    });
  };

  this.getHtml = function(site){
    if(typeof site !== "string"){
      throw new Error("No site passed to getHTML!");
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

  this.fakeDOM = function(html){
    return cheerio.load(html);
  };

  this.getLinksFromHtml = function(html){
    var $ = self.fakeDOM(html),
      links = $('a'),
      linksArray = Array.prototype.slice.call(links),
      scrubbedLinks = [];

    linksArray = linksArray.forEach(function(link){
      var url = cleanUrl(link.attribs.href);

      if(url && urlIsUnchecked(url)){
        var fixedLink = fixLink(url);

        if(fixedLink){
          scrubbedLinks.push(fixedLink);
        }
      }
    });

    scrubbedLinks = _.uniq(scrubbedLinks);

    return scrubbedLinks;
    
    // TODO: change to whitelist
    // also, check MIME type
    function fixLink(linkUrl){
      var urlObj = url.parse(linkUrl);
        thisHost = url.parse(self.site).host,
        blackListedExtensions = ['.pdf'],
        isBlackListed = false;

      if(typeof linkUrl !== "string"){ 
        // console.log('Invalid string: ', linkUrl);
        // return false;
        throw new Error("fixLink must be passed a valid string!");
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
        // handle relative links
        return self.site + (linkUrl[0] === '/' ? linkUrl : '/' + linkUrl);
        // return false;
      }
      else if(thisHost.indexOf(urlObj.host) !== -1 || urlObj.host.indexOf(thisHost) !== -1){
        return linkUrl;
      }
      else{
        return false;
      }
    }
  };

  function addToCheckedLinks(obj){
    var url = obj.url;

    if(self.checkedLinks.indexOf(url) === -1){
      self.checkedLinksObjects.push(obj);
      self.checkedLinks.push(url);
      removeFromUncheckedLinks(url);
    }
  }

  function removeFromUncheckedLinks(url){
    self.uncheckedLinks.shift();
  }

  function addToUncheckedLinks(urlArray){
    urlArray.forEach(function(url){
      url = cleanUrl(url);

      if(url && urlIsValid(url) && self.uncheckedLinks.indexOf(url) === -1){
        self.uncheckedLinks.push(url);
      }
    });
  }

  function urlIsValid(url){
    var rg = /^(http|https):\/\/(([a-zA-Z0-9$\-_.+!*'(),;:&=]|%[0-9a-fA-F]{2})+@)?(((25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])(\.(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])){3})|localhost|([a-zA-Z0-9\-\u00C0-\u017F]+\.)+([a-zA-Z]{2,}))(:[0-9]+)?(\/(([a-zA-Z0-9$\-_.+!*'(),;:@&=]|%[0-9a-fA-F]{2})*(\/([a-zA-Z0-9$\-_.+!*'(),;:@&=]|%[0-9a-fA-F]{2})*)*)?(\?([a-zA-Z0-9$\-_.+!*'(),;:@&=\/?]|%[0-9a-fA-F]{2})*)?(\#([a-zA-Z0-9$\-_.+!*'(),;:@&=\/?]|%[0-9a-fA-F]{2})*)?)?$/;
    
    return rg.test(url);
  }

  function cleanUrl(url){
    if(url && url[url.length - 1] === '/'){
      url = url.slice(0, url.length - 1);
    }

    return url;
  }

  function urlIsUnchecked(url){
    url = cleanUrl(url);
    
    return self.checkedLinks.indexOf(url) === -1;
  }
}

// scrapeSite({
//   body: {
//     site: "http://www.charronmed.com"
//   }
// }, null);
// displayScraperForm();

