var express = require('express')
var request = require('request')
var os = require('os')
var fs = require('fs')
  //reset cookies
fs.writeFileSync('cookies.json', '', 'utf-8')
var FileCookieStore = require('tough-cookie-filestore');
// NOTE - currently the 'cookies.json' file must already exist!
var j = request.jar(new FileCookieStore('cookies.json'));
request = request.defaults({
  jar: j
})
var json2csv = require('nice-json2csv')
var cheerio = require('cheerio')

var scraper = {
  express: {
    app: express()
  },
  dir: '',
  port: 4000,
  html: false,
  _request: function(url, content, callback) {
    if (!content) {
      request(url, callback)
    } else {
      callback && callback(false, 200, content)
    }
  },
  doScrape: function(scr, i, callback) {
    var json = []
    console.log("------->" + scr.url(i))
    this._request(scr.url(i), this.html, function(initialerror, firstresponse, firsthtml) {
        if (initialerror) {
          var content = initialerror
          res.status(404)
          res.send('eroor ' + content)
        }
        var s = cheerio.load(firsthtml)
        if (scr.rows) {
          var rows = scr.rows(s)
          var tot = rows.length
          rows.each(function() {
            var output = {}
            for (var key in scr.fields) {
              if (typeof scr.fields[key] == 'function')
                output[key] = scr.fields[key](s(this), s)
            }
            json.push(output)
            if (json.length >= tot) {
              if (scr.finish)
                scr.finish()
              console.log("--->" + json.length + " records",json)
              callback && callback(false, json, s)
            }
          })
        } else {
          var list = scr.list(s)
          var tot = 0
          for (var i in list) {
            //Detail
            console.log("--->" + list[i])
            if (!scr.onRequest) {
              scr.onRequest = function(url, callback) {
                callback(false)
              }
            }
            scr.onRequest(list[i], function(html) {
                this._request(list[i], html, function(error, response, dom) {
                    var ss = cheerio.load(dom)
                    var sublist = scr.sublist(ss)
                    tot = tot + sublist.length
                    for (var ii in sublist) {
                      console.log("--->" + sublist[ii])
                      scr.onRequest(sublist[ii], function(html) {
                        this._request(sublist[ii], subhtml, function(error, response, dom) {
                          if (!error) {
                            var jqq = cheerio.load(dom)
                            var output = {}
                            for (var key in scr.fields) {
                              if (typeof scr.fields[key] == 'function')
                                output[key] = scr.fields[key](jqq, dom)
                            }
                            json.push(output)
                            console.log(json.length, tot)
                            if (json.length >= tot) {
                              if (scr.finish)
                                scr.finish()
                              callback && callback(false, json, s)
                            }
                          } else {
                            if (error) {}
                          }
                        })
                      })
                    } //end For
                  }) // end this._request
              }) // end onRequest
          } //endFor
        } //endElse
      }) //end this._request
  },
  doRun: function(scr, allJson, callback, res) {
    var self = this
    var index = scr.index ? scr.index : 1
    this.doScrape(scr, index, function(error, json, s) {
      if (json.length > 0)
        allJson = allJson.concat(json)
      if (scr.next && scr.next(s, index)) {
        index += 1
        scr.index = index
        self.doRun(scr, allJson, callback, res)
      } else {

        callback && callback(allJson, res)
      }
    })
  },
  getResult: function(req, res, type) {
    var self = this
    var fileName = req.query.site
    if (!fs.existsSync(this.dir + '/' + fileName + '.js')) {
      fileName = false
    }
    if (!fileName) {
      res.status(404)
      res.send('no input')
    } else {
      var script = fs.readFileSync(this.dir + '/' + fileName + '.js')
      var uniq = (new Date()).getTime()
      var tmp = os.tmpdir()+'/'+fileName+uniq+'.js'
      fs.writeFileSync(tmp,script,'utf-8')
      var scr = require(tmp).scraper
      //support old ver
      if (scr.setup) scr.onInit = scr.setup
      scr.Horseman = require('node-horseman')
      if (scr.onInit)
        scr.onInit(req, function(content) {
          console.log('next')
          self.html = content
          console.log(self.html)
          self.doRun(scr, [], function(result, res) {
            if(type=='json')
            res.json(result)
            else {
              res.csv(result,'output.csv')
            }
          }, res)
        })
    }
  },
  routes: function() {
    var self = this
    self.express.app.get('/output.csv', function(req, res) {
      self.getResult(req, res, 'csv')
    })
    self.express.app.get('/output.json', function(req, res) {
      self.getResult(req, res, 'json')
    })
  },
  start: function(dir, port,callback) {
    this.dir = dir
    this.port = port
    if (!port) {
      port = 4000
    }
    this.routes()
    this.express.app.use(json2csv.expressDecorator)
    var server = this.express.app.listen(port, function() {
      console.log("scraper engine ready!")
      console.log('Listening on port %d', server.address().port)
      callback && callback(scraper)
    })
  }
}


module.exports = scraper
