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
