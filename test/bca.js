
exports.scraper={
  url: function(){
    return 'https://ibank.klikbca.com/'
  },
  onInit: function(req,next){
    var html = false
    var start = {
      date: 1,
      month: 4,
      year: 2016
    }
    var end = {
      date: 11,
      month: 4,
      year: 2016
    }
    var horseman = new this.Horseman()
    console.log('test')
    horseman
		.userAgent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0")
    .open('https://ibank.klikbca.com/')
    .on('loadFinished', function(status){
      console.log('status ',status)
    })
    .type('user_id','xxx')
    .type('#pswd','xxx')
    .screenshot('bca-login.jpg')
    .keyboardEvent('keypress', 16777221)
    .waitForNextPage()
    .post('https://ibank.klikbca.com/accountstmt.do?value(actions)=acct_stmt')
    .screenshot('bca-menu.jpg')
    .post('https://ibank.klikbca.com/accountstmt.do?value(actions)=acctstmtview','value%28D1%29=0&value%28r1%29=1&value%28startDt%29='+start.date+'&value%28startMt%29='+start.month+'&value%28startYr%29='+start.year+'&value%28endDt%29='+end.date+'&value%28endMt%29='+end.month+'&value%28endYr%29='+end.year+'&value%28fDt%29=&value%28tDt%29=&value%28submit1%29=View+Account+Statement')
    .screenshot('bca-history.jpg')
    .html('html')
    .then(function(body){
      console.log('body',body)
      html = body
    })
    .open('https://ibank.klikbca.com/authentication.do?value(actions)=logout')
    .screenshot('bca-logout.jpg')
    .then(function(response){
      horseman.close()
      console.log('next')
      next(html)
    })
  },
  rows:function($){
    return $('table[border=1] tr')
  },
  fields: {
    date: function($){
      return $.find('td').eq(0).text()
    },
    description: function($){
      return $.find('td').eq(1).text()
    },
    amount: function($){
      return $.find('td').eq(3).text()
    }
  }
}
//
