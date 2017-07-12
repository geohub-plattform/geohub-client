const filesaver = require("./filesaver");
const tokml = require("./tokml");

function asGist(file) {
    var http = new XMLHttpRequest();
    var url = "https://api.github.com/gists";
    var schema = {
        "description": "GeoJson created with Geohub - https://geohub-plattform.github.io/geohub-client/",
        "public": true,
        "files": {
            "export.geojson": {
                "content": JSON.stringify(file)
            }
        }
    };
    var content = JSON.stringify(schema);
    http.open("POST", url, true);
    http.setRequestHeader("Content-type", "application/json");
    http.onreadystatechange = function () {
        if (http.readyState == 4 && http.status < 400) {           
            var response = JSON.parse(http.responseText);
            alert('Gist exported: ' + response.html_url);
            console.log(response.html_url);
        }
    }
    http.send(content);
}
function asGeojson(file) {
    var blob = new Blob([JSON.stringify(file)], { type: "application/json;charset=utf-8" });
    filesaver.saveAs(blob, "export.geojson");
}
function asKml(file) {
    var kml = tokml(file);
    var blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml;charset=utf-8" });
    filesaver.saveAs(blob, "export.kml");
}

module.exports = {
    asGist,
    asGeojson,
    asKml
};