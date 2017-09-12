const filesaver = require("./filesaver");
import tokml from "tokml";

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
    asGeojson,
    asKml
};