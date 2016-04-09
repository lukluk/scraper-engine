var nu = require('nu-widget.js');
var request = require('request');
var json2csv = require('nice-json2csv');
var cheerio = require('cheerio');
var extend 	= require('extend');

var fs = require('fs');

nu.widget('lukluk.scraperEngine',{
	options : {
		dir     : __dirname,
		output  : 'json'
	},
	_create : function(){
		if(this.options.site)
			this._get_site_params();
		if(this.options.setup)
			this.options.setup(this.options.req);
		this.run(this.options,[], function(result, res) {
			res.json (result);
		},this.options.res);
	},
	_get_site_params : function(){
		var fileName = this.options.site;
		if (!fs.existsSync(this.options.dir + '/' + fileName + '.js')) {
			fileName = false;
		}
		if (!fileName) {
			res.status(404);
			res.send('no input');
		} else {
			extend(true,this.options,require(this.options.dir + '/' + fileName + '.js').scraper);
		}

	},
	run : function(scr,allJson, callback,res) {
		var self  = this;
		var index = scr.index ? scr.index : 1;

		this.scrape(scr, index, function(error, json, s) {
			if (json.length > 0)
				allJson = allJson.concat(json);
			if (scr.next && scr.next(s, index)) {
				index += 1;
				scr.index = index;
				self.run(scr, allJson, callback, res);
			} else {

				callback && callback(allJson, res);
			}
		});
	},
	scrape : function(scr,i,callback){
		var self    = this;
		var json = [];
		console.log("------->" + scr.url(i));
		request(scr.url(i), function(initialerror, firstresponse, firsthtml) {
			if (initialerror) {
				var content = initialerror;
				res.status(404);
				res.send('eroor ' + content);
			}

			var s = cheerio.load(firsthtml);

			if (scr.rows) {
				var rows = scr.rows(s);

				var tot = rows.length;
				rows.each(function() {
					var output = {};
					for (var key in scr.fields) {
						if (typeof scr.fields[key] == 'function')

							output[key] = scr.fields[key](s(this),s);
					}
					json.push(output);
					if (json.length >= tot) {
						if (scr.finish)
							scr.finish();
						console.log("--->" + json.length + " records");
						callback && callback(false, json, s);
					}
				});
			} else {
				var list = scr.list(s);
//					console.log('list',list)
				var tot = 0;

				for (var i in list)
//			var i=0;
				{
					//Detail
					console.log("--->" + list[i]);
					request(list[i], function(error, response, dom) {
						var ss = cheerio.load(dom);
						var sublist = scr.sublist(ss);
//					console.log('sublist',sublist)
						tot = tot+sublist.length;

						for (var ii in sublist)
//					var ii=0;
						{

							//Detail
							console.log("--->" + sublist[ii]);
							request(sublist[ii], function(error, response, dom) {
								if (!error) {

									var jqq = cheerio.load(dom);

									var output = {};
									for (var key in scr.fields) {
										if (typeof scr.fields[key] == 'function')
											output[key] = scr.fields[key](jqq, dom);
									}
									json.push(output);
									console.log(json.length,tot);
									if (json.length >= tot) {
										if (scr.finish)
											scr.finish();
										callback && callback(false, json, s);
									}
								} else {
									if (error) {


									}

								}
							})
						}
					})
				}
			}
		})
	}
});