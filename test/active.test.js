const test = require("tape");
const turf = require("@turf/turf");
const fs = require("fs");

test("geohub - overpass converter", {skip: false}, t => {
  const overpass = JSON.parse(fs.readFileSync("./debug/overpass-data.json"));
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

  fs.writeFileSync("./debug/overpass.geojson", JSON.stringify(turf.featureCollection(lineStrings), null, 1));
  //console.log(JSON.stringify(turf.featureCollection(lineStrings), null, 1));

  t.end();
});

