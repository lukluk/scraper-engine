var nu          = require('nu-widget');
var cheerio     = require('cheerio');

/** tukangtest extension for scraperEngine **/

var base = {
    scrape: nu.lukluk.scraperEngine.prototype.scrape,
}

nu.extend(true,nu.lukluk.scraperEngine.prototype,{

    options : {
        evaluate:false,
        actions : []
    },

    scrape  : function(scr,i,callback){
        if(this.options.evaluate){
            this.scrape_tukang.apply(this,arguments);
        }else{
            base.scrape.apply(this,arguments);
        }
    },
    scrape_tukang : function (scr,i,callback) {
        var self    = this;
        var url     = scr.url(i);
        var Horseman = require('node-horseman');
        this.engine = new Horseman();

        this.engine = this.engine
            .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
            .open(url);

        this.engine = this.options.evaluate.apply(this,arguments);
        this.engine.html().then(function(result){
            var s = cheerio.load(result);
            self.load_html(scr,i,callback,s);
        });
    },
});