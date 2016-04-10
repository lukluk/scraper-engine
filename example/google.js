var S = require('string');
exports.scraper = {
    url: function () {
        return "http://google.co.id"
    },
    evaluate : function(){
        return this.engine.click('input:contains("Google Search")');
    },
}