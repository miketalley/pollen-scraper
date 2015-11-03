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
  Promise = require('promise').Promise,
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
      promises.push(self.getLinksFromUrl(url));
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
          self.scrape(uncheckedLink);
        });
      }
      else{
        console.log("DONE!!!! Found " + self.checkedLinks.length + " links!");
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
      linksArray = Array.prototype.slice.call(links);

    linksArray = linksArray.map(function(link){
      return fixLink(link.attribs.href);
    });

    linksArray = _.uniq(linksArray);

    return linksArray;
    
    function fixLink(linkUrl){
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
    }
  };

  function addToCheckedLinks(url){
    if(self.checkedLinksArray.indexOf(url) === -1){
      self.checkedLinksArray.push(url);
    }
  }

  function addToUncheckedLinks(urlArray){
    urlArray.forEach(function(url){
      if(self.uncheckedLinks.indexOf(url) === -1){
        self.uncheckedLinks.push(url);
      }
    });
  }


  /*======================*/
  /*======================*/
  /*========OLD===========*/
  /*=======BELOW==========*/
  /*======================*/
  /*======================*/


  this.showScrapeResults = function(results, res){
    results.forEach(function(result){
      console.log(9876543210, result);
    });

    // res.send(results);
  };
  
  this.getUniqueSiteLinks = function(url){
    var checkedLinks = [],
      uncheckedLinks = [],
      pageLinks = this.getLinksFromPage(url);

    console.log("Running getUniqueSiteLinks");

    console.log("pageLinks Promise: ", pageLinks);
    

    return new Promise(function(resolve, reject){
      pageLinks.done(function(links){
        uncheckedLinks = uncheckedLinks.concat(links);
        
        self.processLinks(uncheckedLinks, checkedLinks)
        .done(function(links){
          console.log("Did I ever make it here?");
          resolve(links);
        });
      });
    });
  };

  // Checks if links are in list and returns them if they 
  // are not, optional push flag will concat them to the list
  this.checkNonDuplicateLinksInList = function(links, list, push){
    var nonDuplicateLinks = links.filter(function(link){
      return list.indexOf(link) === -1;
    });

    if(push){
      nonDuplicateLinks.forEach(function(link){
        list.push(link);
      });
    }

    return nonDuplicateLinks;
  };

  this.processLinks = function(uncheckedLinksArray, checkedLinksArray){
    if(!uncheckedLinksArray || !checkedLinksArray){
      throw new Error("Bad parameters passed to processLinks!");
    }

    console.log(uncheckedLinksArray.length, checkedLinksArray.length);

    return new Promise(function(resolve, reject){
      while(uncheckedLinksArray.length){
        var currentIndex = 0,
          currentLink = uncheckedLinksArray[currentIndex],
          uncheckedLinks, nonDuplicateUncheckedLinks;

        if(currentLink){
          uncheckedLinks = self.getLinksFromPage(currentLink);
          uncheckedLinks.done(function(links){
            console.log(8787, links.length);
            nonDuplicateUncheckedLinks = self.checkNonDuplicateLinksInList(links, checkedLinksArray);

            console.log(8686, nonDuplicateUncheckedLinks.length, uncheckedLinksArray.length);
            self.checkNonDuplicateLinksInList(nonDuplicateUncheckedLinks, uncheckedLinksArray, true);
            console.log(8585, nonDuplicateUncheckedLinks.length, uncheckedLinksArray.length);
          });

          checkedLinksArray.push(currentLink);
        }
        else{
          console.log("Invalid link, disposing");
        }
        
        uncheckedLinksArray.splice(currentIndex, 1);
        console.log(uncheckedLinksArray.length, checkedLinksArray.length);
      }

      resolve(checkedLinksArray);
    });
  };

  this.checkIfLinkIsAlreadyKnown = function(links){
    var nonDuplicateUncheckedLinks = self.checkNonDuplicateLinksInList(links, checkedLinksArray);

    console.log(111, uncheckedLinksArray.length);
    self.checkNonDuplicateLinksInList(nonDuplicateUncheckedLinks, uncheckedLinksArray, true);
    console.log(222, uncheckedLinksArray.length);
  };

}

function Website(siteUrl){

  this.site = siteUrl;

  this.getHTML = function(site){
    if(typeof site !== "string"){
      throw new Error("No site passed to getHTML!");
    }
    
    return new Promise(function(resolve, reject){
      console.log('Requesting Site: ', site);
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

  this.getBodyHTML = function($){
    var $body = $('body');
    
    return $body.html();
  };

  // Returns a promise that is resolved with the links
  // found within the HTML at the passed URL
  this.getLinksFromPage = function(url){
    var pageHTML = this.getHTML(url);

    return new Promise(function(resolve, reject){
      pageHTML.done(function(resp){
        if(resp){
          var links = self.getLinks(resp);

          resolve(links);
        }
        else{
          reject("No response");
        }
      });
    });
  };

  this.getLinks = function(html){
    var $ = this.fakeDOM(html),
      links = $('a'),
      linksArray = Array.prototype.slice.call(links);

    linksArray = linksArray.map(function(link){
      return self.fixLink(link.attribs.href);
    });

    linksArray = _.uniq(linksArray);

    return linksArray;
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

