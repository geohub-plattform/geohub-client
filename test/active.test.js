const test = require("tape");
const MeshIndex = require("../src/mesh_index");
const fs = require("fs");

test("geohub - route to endpoint simple-simple grid", {skip: false}, t => {
  const fc = JSON.parse(fs.readFileSync("./debug/odenwald-hw.json"));
  const features = fc.features;
  console.time("Meshing");
  const meshIndex = new MeshIndex(features);
  console.timeEnd("Meshing");
  t.equals(meshIndex.getMesh().length, 1997);
  t.end();
});


