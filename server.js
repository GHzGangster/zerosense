var port = 9000;

var connect = require('connect');
var serveStatic = require('serve-static');
var path = require('path');

var folder = path.resolve(__dirname, 'dist');

connect().use(serveStatic(folder)).listen(port, function(){
    console.log('Server running on %d...', port);
});