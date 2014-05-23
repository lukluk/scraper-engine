var express = require('express');
var app = express();
var request = require('request');
var cheerio = require('cheerio');


var fs = require('fs');

    exports.start = function(dir, port) {
        if (!port) {
            port = 4000;
        }
        app.get('/output.json', function(req, res) {
            var fileName = req.param('site');
            if (!fs.existsSync(dir + '/' + fileName + '.js')) {
                fileName = false;
            }
            if (!fileName) {
                res.status(404);
                res.send('no input');
            } else {
                console.log
                var scr = require(dir + '/' + fileName + '.js').scraper;
                if (scr.setup)
                    scr.setup(req);

                var json = [];
                request(scr.url(), function(initialerror, firstresponse, firsthtml) {
                    if (initialerror) {
                        var content = initialerror;
                        res.status(404);
                        res.send('eroor ' + content);
                    }
                    console.log("->" + scr.url());
                    var s = cheerio.load(firsthtml);

                    var list = scr.list(s);
                    console.log("-->", list);
                    var tot = list.length;
                    for (var i in list) {
                        //Detail
                        console.log("--->" + list[i]);
                        request(list[i], function(error, response, dom) {
                            if (!error) {
                                var $ = cheerio.load(dom);
                                var output = {};
                                for (var key in scr.fields) {
                                    if (typeof scr.fields[key] == 'function')
                                        output[key] = scr.fields[key]($, dom);
                                }
                                json.push(output);
                                if (json.length >= tot) {
                                    if (scr.finish)
                                        scr.finish();
                                    res.json(json);
                                }
                            } else {
                                if (error) {
                                    var content = error;
                                    res.status(404);
                                    res.send('error' + error);

                                }

                            }
                        })
                    }
                })
            }



        })
        var server = app.listen(port, function() {
            console.log("scraper engine ready!");
            console.log('Listening on port %d', server.address().port);            
        });

    }
