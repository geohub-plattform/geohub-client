const test = require("tape");
const MeshIndex = require("../src/mesh_index");
const fs = require("fs");
const turf = require("@turf/turf");

test("geohub - route to endpoint simple-simple grid", {skip: true}, t => {
  const fc = JSON.parse(fs.readFileSync("./debug/odenwald-hw.json"));
  const features = fc.features;
  console.time("Meshing");
  const meshIndex = new MeshIndex(features);
  console.timeEnd("Meshing");
  t.equals(meshIndex.getMesh().length, 9894);
  t.end();
});

test("geohub - lineSplit test", {skip: false}, t => {

  const lineString = turf.lineString([[9.2202022, 49.1438226], [9.2199531, 49.1439048], [9.2196177, 49.1440264]]);
  const resultFc = turf.lineSplit(lineString, turf.point([9.219953175634146, 49.14390480825327]));

  console.log(JSON.stringify(resultFc, null, 1));

  t.equals(resultFc.features.length, 2);

  //const resultFc = turf.lineSplit(lineString, turf.point([9.2199531, 49.1439048]));

  t.end();
});




