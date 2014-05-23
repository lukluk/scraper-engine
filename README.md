#Scraper engine
>complate solutions for build scraper API service, easy to use 

#How to use

```
npm install scraper-engine
```
create app.js and write
```
var port=4000;
require('scraper-engine').start(__dirname,port);
```

```
$ node app.js
Scraper Engine Started (port 4000)...
```
and open your browser

http://localhost:4000/output.json?site=**controller**

example

http://localhost:4000/output.json?site=4shared&key=bruno

done!!
##See in action
[http://www.youtube.com/watch?v=JnCX4k7QtVg](http://www.youtube.com/watch?v=JnCX4k7QtVg)

[http://youtu.be/HHP2NyEJq4w](http://youtu.be/HHP2NyEJq4w)
##How it work
>just need write controller and define few simple function like :
> 1. start	//fn that will call before engine start
> 2. finish	//fn that will call after engine complate scraping
> 3. list($)	//doing javascript query (jquery) and return link list
> 4. fields($)	//doing jquery operation and return value for each field

example controller (4shared API)
```
var fs = require('fs');
var S = require('string');
var start = 0;
var key = '';

exports.scraper = {
    name: '4shared',
    url: function() {
        return 'http://search.4shared.com/network/searchXml.jsp?q=' + key + '&searchCategory=audio&searchExtention=mp3&searchmode=3&sortType=1&sortOrder=1&start=' + start;
    },
    setup: function(req) {
        start = parseInt(req.param('start'));
        if (!start) {
            start = 0;
        }
        key = req.param('key');
    },
    finish: function() {

    },

    list: function($) {
        var links = [];
        $('file').each(function() {
            links.push($(this).find('url').eq(0).html());
        })
        return links;
    },
    fields: {
        title: function($) {
            return $('.fileMeta .fileName').eq(0).text();
        },
        info: function($) {
            $('.fileMeta .fileInfo a').remove();
            return $('.fileMeta .fileInfo').text();
        },
        link: function($, dom) {
            return 'http:' + S(dom).between('file: http:', 'preview.mp3') + 'preview.mp3';
        }

    }

}

```

#Author
##luklukaha@gmail.com
