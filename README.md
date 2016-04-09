#Scraper engine
>complate solutions for build scraper API service, easy to use 

version 8.0.0 

output.json and output.csv

#tutorial
https://youtu.be/j_PJkSVx7n4


https://www.youtube.com/watch?v=HHP2NyEJq4w

#How to install

```
npm install scraper-engine
```
create app.js
```
var express = require('express');
var app = express();


var nu = require('nu-widget');
require('scraper-engine');

app.get('/:site', function(req, res) {
    var site = req.params.site;
    nu.scraperEngine({
        req     : req,
        res     : res,
        dir     : __dirname,
        site    : site,
    });
});

app.listen(4000);

```

```
$ node app.js
Scraper Engine Started (port 4000)...
```
and open your browser

http://localhost:4000/output.json?site=**controller**

## example controller

http://localhost:4000/output.json?site=olx
or 
http://localhost:4000/output.csv?site=olx

example : Walmart Category controller

```
var S = require('string');
exports.scraper = {
    name: 'OLX',
    url: function (index) {
        return "http://www.walmart.com/browse/toys/action-figures/4171_4172_133130?page="+index+"&cat_id=4171_4172_133130"
    },
	next:function($,currentindex){
		if(currentindex>=5){
			return false
		}else{
			return true
		}
	},
    rows: function ($) {
        return $('.tile-grid-unit-wrapper');
    },
    fields: {
        title: function ($) {
            return S($.find('.tile-heading').text()).trim().s;
        },
        price: function ($) {
            return S($.find('.tile-price').text().replace('$','')).trim().s;
        },
        image: function ($) {
            return $.find('.product-image').attr('src');
        },
        urlproduct: function ($) {
            return $.find('.js-product-title').attr('href');
        }
 
 
    }
 
}
```

Example: Olx Controller
```
var S = require('string');
exports.scraper = {
    name: 'OLX',
    url: function () {
        return "http://olx.co.id/all-results/q-batu-bacan/"
    },
    rows: function ($) {
        return $('.offer');
    },
    fields: {
        title: function ($) {
            return S($.find('.link.linkWithHash').text()).trim().s;
        },
        price: function ($) {
            return S($.find('.price').text()).trim().s;
        },
        image: function ($) {
            return $.find('.linkWithHash img').attr('src');
        }


    }

}
```
#using request parameter
Example: Olx Controller part 2 
```
var S = require('string');
var keyword="";
exports.scraper = {
    name: 'OLX-pass-url',
    url: function () {
        return "http://olx.co.id/all-results/q-"+keyword+"/"
    },
    setup:function(req){
        keyword=req.query.keyword
    },
    rows: function ($) {
        return $('.offer');
    },
    fields: {
        title: function ($) {
            return S($.find('.link.linkWithHash').text()).trim().s;
        },
        price: function ($) {
            return S($.find('.price').text()).trim().s;
        },
        image: function ($) {
            return $.find('.linkWithHash img').attr('src');
        }


    }

}
```

#scraping all pages detail
Example: Olx Controller part 3
```
var S = require('string');
var keyword="";
exports.scraper = {
    name: 'OLX-all-pages',
    url: function () {
        return "http://olx.co.id/all-results/q-"+keyword+"/"
    },
    setup:function(req){
        keyword=req.query.keyword
    },
    list: function ($) {
        var urls=[];
        $('.offer').each(function(){
            ulrs.push($(this).find('.link.linkWithHash').attr('href'))
        })
        return urls;
    },
    fields: {
        title: function ($) {
            return $.find('.offerheadinner h1').text()
        },
        price: function ($) {
            return $.find('.pricelabel strong').text()
        },
        seller: function ($) {
            return $.find('.userdetails .brkword').text();
        }


    }

}
```


#Author
##luklukaha@gmail.com
