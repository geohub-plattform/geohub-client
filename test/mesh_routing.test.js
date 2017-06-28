const test = require("tape");
const fs = require("fs");
const MeshRouting = require("../src/mesh_routing");
const MeshIndex = require("../src/mesh_index");

test("geohub - meshRouting", {skip: false}, t => {
  const fc = JSON.parse(fs.readFileSync("./test/testdata.json"));
  const features = fc.features;
  console.time("Meshing");
  const meshIndex = new MeshIndex(features);
  console.timeEnd("Meshing");
  const mesh = meshIndex.getMesh();
  console.time("Vertexing");
  const meshRouting = new MeshRouting(mesh);
  console.timeEnd("Vertexing");

  console.time("Routing");
  const fromPoint = [9.2385927, 49.1371923];
  const toPoint = [9.2352176, 49.1356715];
  const coords = meshRouting.getRouteFromTo({coords: fromPoint}, {coords: toPoint});
  console.timeEnd("Routing");
  t.equals(JSON.stringify(coords), '{"path":[[9.2385927,49.1371923],[9.2377742,49.1372279],[9.2369915,49.1372548],[9.2369466,49.1368506],[9.2361759,49.1368891],[9.2353881,49.1369284],[9.2353262,49.1365135],[9.2352591,49.1360636],[9.2352176,49.1356715]],"length":0.4159222659595568}');
  t.end();
});

test("geohub - route to endpoint simple-simple grid", {skip: false}, t => {
  const fc = JSON.parse(fs.readFileSync("./test/simplegrid-simple.geojson"));
  const features = fc.features;
  const meshIndex = new MeshIndex(features);
  const meshRouting = new MeshRouting(meshIndex.getMesh());
  const fromPoint = {
    coords: [9.2370936, 49.1364137],
    borders: {
      border1: [9.236114323139189, 49.136462671800935],
      border2: [9.238137, 49.1363616],
      distance1: 0.0716723576184958,
      distance2: 0.07635883813209744
    }
  };
  const toPoint = [9.238533675670624, 49.13676801670233];
  const route = meshRouting.getRouteFromTo(fromPoint, {coords: toPoint});
  t.equals(JSON.stringify(route), '{"path":[[9.2370936,49.1364137],[9.238137,49.1363616],[9.237244,49.136838],[9.238533675670624,49.13676801670233]],"length":0.2543861969601582}');
  t.end();
});



