var express = require('express');
var app = express();
var browserify = require('browserify-middleware');

app.get('/geohub-client.js', browserify('./index.js', {
    standalone: 'GeoHubClient',
    debug: true,
    cache: 'dynamic',
    minify: false
}));

app.get('/mapbox-gl.js', function(req, res) {
  res.sendFile(__dirname+'/node_modules/mapbox-gl/dist/mapbox-gl.js');
});

app.get('/mapbox-gl.css', function(req, res) {
    res.sendFile(__dirname+ '/node_modules/mapbox-gl/dist/mapbox-gl.css');
});

app.use('/debug', express.static(__dirname + '/debug'));
app.use('/dist', express.static(__dirname + '/dist'));


var port = process.env.PORT || 9967;

app.listen(port, function () {
    console.log('GeoHubClient debug server running at http://localhost:' + port);
});
