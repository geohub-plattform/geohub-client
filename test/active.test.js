const test = require("tape");
const turf = require("@turf/turf");
const MeshIndex = require("../src/mesh_index");
const MeshRouting = require("../src/mesh_routing");
const fs = require("fs");

test("geohub - add point to mesh", {skip: false}, t => {
  const fc = JSON.parse(fs.readFileSync("./debug/simplegrid-simple.geojson"));
  const features = fc.features;
  const meshIndex = new MeshIndex(features);
  t.end();
});

