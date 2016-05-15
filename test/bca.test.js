var request = require('request')

describe('[Gmail] Login', function() {
  it('respond with json', function(done) {
    request('http://127.0.0.1:4000/output.json?site=bca', function(err, res, body) {
      console.log(body)
      done()
    })
  }).timeout(100000)
})
