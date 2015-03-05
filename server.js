// var http = require('http');
// http.createServer(function (req, res) {
//   res.writeHead(200, {'Content-Type': 'text/plain'});
//   res.end('Hello World\n');
// }).listen(1337, '127.0.0.1');
// console.log('Server running at http://127.0.0.1:1337/');

var connect = require('connect');
var serveStatic = require('serve-static');

var jf = require('jsonfile')
var util = require('util')
 
var file = '/tmp/data.json'
jf.readFile(file, function(err, obj) {
  console.log(util.inspect(obj))
})

connect().use(serveStatic(__dirname)).listen(9615);