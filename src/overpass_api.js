const turf = require("@turf/turf");

function loadWays(bbox, success) {
  const xhr = new XMLHttpRequest();
  const query = '[out:json][timeout:25];(way["highway"](' + bbox.getSouth() + ',' + bbox.getWest() + ',' + bbox.getNorth() + ',' + bbox.getEast() + '););out body;>;out skel qt;';
  console.log("Query data: ", query);
  xhr.open('GET', "http://overpass-api.de/api/interpreter?data=" + query, true);
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      success(response);
    } else {
      console.log(e);
      console.log(xhr.status);
    }
  };
  xhr.send();
}

function convertFromOverpassToGeojson(overpass) {
  const elementsById = {};

  overpass.elements.forEach((element) => {
    const key = `${element.type}-${element.id}`;
    elementsById[key] = element;
  });

  const lineStrings = [];
  overpass.elements.forEach((element) => {
    if (element.type === "way") {
      const line = [];
      element.nodes.forEach((nodeId) => {
        const key = `node-${nodeId}`;
        const nodeElement = elementsById[key];
        if (nodeElement) {
          line.push([nodeElement.lon, nodeElement.lat]);
        } else {
          console.error("Node ", key, " missing");
        }
      });
      if (line.length > 1) {
        lineStrings.push(turf.lineString(line, element.tags));
      }
    }
  });
  return turf.featureCollection(lineStrings);
}

module.exports = {convertFromOverpassToGeojson, loadWays};
