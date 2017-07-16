const filesaver = require("./filesaver");
import tokml from "tokml";

function asGist(file) {
    file.features.forEach(function(element, index) {
        delete element.properties.geoHubId;
    }, this);
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
    file.features.forEach(function(element, index) {
        delete element.properties.geoHubId;
    }, this);
    var blob = new Blob([JSON.stringify(file)], { type: "application/json;charset=utf-8" });
    var d = new Date();
    filesaver.saveAs(blob, "geohub-export-" + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + "-" + d.getHours() + d.getMinutes() + ".geojson");
    console.log(JSON.stringify(file));
}
function asKml(file) {
    file.features.forEach(function(element, index) {
        delete element.properties.geoHubId;
    }, this);
    var kml = tokml(file);
    var blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml;charset=utf-8" });
    var d = new Date();    
    filesaver.saveAs(blob, "geohub-export-" + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + "-" + d.getHours() + d.getMinutes() + ".kml");
}

module.exports = {
    asGist,
    asGeojson,
    asKml
};