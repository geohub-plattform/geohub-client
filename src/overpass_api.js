const turf = require("@turf/turf");

function loadData(query, success) {
  const xhr = new XMLHttpRequest();
  console.log("Query data: ", query);
  xhr.open('GET', "http://overpass-api.de/api/interpreter?data=" + query, true);
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        success(response);
      } else {
        console.log(e);
        console.log(xhr.status);
      }
    }
  };
  xhr.send();
}

function loadBuildings(bbox, success) {
  const query = '[out:json][timeout:25];' +
    '(way["building"](' + bbox.getSouth() + ',' + bbox.getWest() + ',' + bbox.getNorth() + ',' + bbox.getEast() + ');' +
    'relation["building"](' + bbox.getSouth() + ',' + bbox.getWest() + ',' + bbox.getNorth() + ',' + bbox.getEast() + '););' +
    'out body;>;out skel qt;';
  loadData(query, success);
}

function loadWays(bbox, success) {
  const query = '[out:json][timeout:25];(way["highway"](' + bbox.getSouth() + ',' + bbox.getWest() + ',' + bbox.getNorth() + ',' + bbox.getEast() + '););out body;>;out skel qt;';
  loadData(query, success);
}

function convertFromOverpassToGeojson(overpass) {
  const elementsById = {};

  overpass.elements.forEach((element) => {
    const key = `${element.type}-${element.id}`;
    elementsById[key] = element;
  });

  const wayToPoints = function (way) {
    const line = [];
    way.nodes.forEach((nodeId) => {
      const key = `node-${nodeId}`;
      const nodeElement = elementsById[key];
      if (nodeElement) {
        line.push([nodeElement.lon, nodeElement.lat]);
      } else {
        console.error("Node ", key, " missing");
      }
    });
    return line;
  };

  const lineStrings = [];
  overpass.elements.forEach((element) => {
    if (element.type === "way") {
      const line = wayToPoints(element);
      if (line.length > 1) {
        lineStrings.push(turf.lineString(line, element.tags));
      }
    } else if (element.type === "relation") {
      element.members.forEach((member) => {
        const memberType = member.type;
        if (memberType === "way") {
          const key = `way-${member.ref}`;
          const way = elementsById[key];
          const line = wayToPoints(way);
          if (line.length > 1) {
            lineStrings.push(turf.lineString(line, element.tags));
          }
        }
      });
    }
  });
  return turf.featureCollection(lineStrings);
}

module.exports = {convertFromOverpassToGeojson, loadWays, loadBuildings};
