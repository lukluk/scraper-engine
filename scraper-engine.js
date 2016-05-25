var express = require('express')
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var request = require('request')
var localStorage = require('localStorage')
var os = require('os')
var fs = require('fs')

function createRandomString(length) {
  return Math.random().toString(36).slice(2)
}

//reset cookies
request = request.defaults({
  jar: true
})
var json2csv = require('nice-json2csv')
var cheerio = require('cheerio')

function requestDOM(url, cb) {
  request(url, function(err, response, body) {
    cb(err, cheerio.load(body))
  })

}

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
    var self = this
    if (!scr.url) {
      scr.url = function(i) {
        return i
      }
    }
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
                scr.finish(json)
              if (scr.onResponse) {
                console.log("on Response")
                scr.onResponse(json, function(resultJSON) {
                  callback && callback(false, resultJSON, s)
                })
              } else
                callback && callback(false, json, s)
            }
          })
        } else {
          var list = scr.list(s)
          var tot = 0
          tot = list.length
          for (var i in list) {
            //Detail
            console.log("--->" + list[i])
            if (!scr.onRequest) {
              scr.onRequest = function(url, callback) {
                callback(false)
              }
            }
            scr.onRequest(list[i], function(html) {
                self._request(list[i], html, function(error, response, dom) {
                    if (!error) {
                      var jqq = cheerio.load(dom)
                      var output = {}
                      for (var key in scr.fields) {
                        if (typeof scr.fields[key] == 'function')
                          output[key] = scr.fields[key](jqq, dom)
                      }
                      json.push(output)
                        //console.log(json.length, tot)
                      if (json.length >= tot) {
                        if (scr.finish)
                          scr.finish()
                        if (scr.onResponse) {
                          console.log("on Response")
                          scr.onResponse(json, function(resultJSON) {
                            callback && callback(false, resultJSON, s)
                          })
                        } else
                          callback && callback(false, json, s)
                      }
                    } else {
                      if (error) {
                        console.log('ERROR ', error)
                      }
                    }
                  }) // end this._request
              }) // end onRequest
          } //endFor
        } //endElse
      }) //end this._request
  },
  doRun: function(scr, allJson, callback, res) {
    var self = this
    var index = scr.index ? scr.index : 1
    if (!self.html && !scr.url) {
      res.json({
        error: true,
        message: 'connection failed'
      })
      return false
    } else
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
    console.log('load script', this.dir + '/' + fileName + '.js')
    if (!fs.existsSync(this.dir + '/' + fileName + '.js')) {
      fileName = false
    }
    if (!fileName) {
      res.status(404)
      res.send('no input')
    } else {
      var script = fs.readFileSync(this.dir + '/' + fileName + '.js')
      var uniq = (new Date()).getTime()
      fileName = fileName.replace('/', '-')
      var tmp = os.tmpdir() + '/' + fileName + uniq + '.js'
      fs.writeFileSync(tmp, script, 'utf-8')
      var scr = require(tmp).scraper
        //support old ver      
      if (scr.setup) scr.onInit = scr.setup
        //support action
      if (scr.secure) {
        var token = req.body.token ? req.body.token : req.query.token
        var valid = localStorage.getItem(token)
        if (valid) {

        } else {
          res.json({
            error: true,
            message: 'token not valid'
          })
          return false
        }
      }
      if (req.params.action) {
        console.log(scr[req.params.action].toString().indexOf('res.'))
        if (scr[req.params.action].toString().indexOf('res.') < 0) {
          console.log('no res.json syntax on ' + req.params.site + '.' + req.params.action)
          res.json({
            error: true,
            message: 'no res.json syntax on ' + req.params.site + '.' + req.params.action
          })
        } else {
          console.log('call action ', req.params.action)
          scr[req.params.action] && scr[req.params.action](req, res)
        }
      } else {
        scr.Horseman = require('node-horseman')
        scr.fs = fs
        scr.request = request
        scr.requestDOM = requestDOM
        if (scr.onInit && scr.onInit.toString().indexOf('next') > -1) {
          scr.onInit(req, res, function(content) {
            scr.req = req
            console.log('next')
            self.html = content
            self.doRun(scr, [], function(result, res) {
              if (type == 'json')
                res.json(result)
              else {
                res.csv(result, 'output.csv')
              }
            }, res)
          })
        } else {
          scr.onInit && scr.onInit(req, res)
          scr.req = req
          self.html = false
          self.doRun(scr, [], function(result, res) {
            if (type == 'json')
              res.json(result)
            else {
              res.csv(result, 'output.csv')
            }
          }, res)
        }
      }
    }
  },
  routes: function() {
    var self = this

    self.express.app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    self.express.app.get('/auth/:apikey', function(req, res) {
      if (fs.existsSync('./apikey/' + req.params.apikey + '.key')) {
        var token = createRandomString()
        localStorage.setItem(token, 'true')
        res.json({
          token: token
        })
      } else {
        res.json({
          error: true,
          message: 'api key not valid'
        })
      }
    })
    self.express.app.get('/:site/:action', function(req, res) {
      req.query.site = req.params.site
      self.getResult(req, res, 'json')
    })
    self.express.app.post('/:site/:action', function(req, res) {
      req.query.site = req.params.site
      self.getResult(req, res, 'json')
    })
    self.express.app.get('/:site', function(req, res) {

      if (req.params.site == 'output.json') {
        self.getResult(req, res, 'json')
      } else
      if (req.params.site == 'output.csv') {
        self.getResult(req, res, 'csv')
      } else {
        req.query.site = req.params.site
        self.getResult(req, res, 'json')
      }

    })
    self.express.app.post('/:site', function(req, res) {

      if (req.params.site == 'output.json') {
        self.getResult(req, res, 'json')
      } else
      if (req.params.site == 'output.csv') {
        self.getResult(req, res, 'csv')
      } else {
        req.query.site = req.params.site
        self.getResult(req, res, 'json')
      }

    })
  },
  start: function(dir, port, callback) {
    this.dir = dir
    this.port = port
    if (!port) {
      port = 4000
    }
    this.express.app.use(bodyParser.json()); // for parsing application/json
    this.express.app.use(bodyParser.urlencoded({
      extended: true
    })); // for parsing application/x-www-form-urlencoded
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