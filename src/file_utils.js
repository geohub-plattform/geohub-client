const togeojson = require("@mapbox/togeojson");

module.exports = function (ctx) {

  function stringToDOM(str) {
    const parser = new DOMParser();
    return parser.parseFromString(str, "text/xml");
  }
  function processFiles(files, handler) {
    files.forEach((file) => {
      const name = file.name;
      const ext = name.substring(name.lastIndexOf('.') + 1, name.length).toLowerCase();
      const fileReader = new FileReader();
      fileReader.onloadend = function () {
        if (fileReader.readyState === FileReader.DONE) {
          try {
            let geojson = null;
            if (ext === 'geojson' || ext === 'json') {
              geojson = JSON.parse(fileReader.result);
            } else if (ext === 'kml') {
              geojson = togeojson.kml(stringToDOM(fileReader.result));
            } else if (ext === 'gpx') {
              geojson = togeojson.gpx(stringToDOM(fileReader.result));
            } else {
              ctx.snackbar(`Dateityp wird nicht unterstützt: ${ext}`);
            }
            if (geojson) {
              handler(geojson);
            }
          } catch (e) {
            console.log(e);
            ctx.snackbar("JSON Daten ungültig");
          }
        }
      };
      fileReader.readAsText(file);
    });
  }

  return {processFiles};
};
