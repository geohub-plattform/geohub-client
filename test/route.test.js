import test from "tape";
import turf from "@turf/turf";
import fs from "fs";
import kdbush from "kdbush";
import utils from "../src/utils";
import Dijkstras from "../src/dijkstras";


test("geohub - find point on lineString coordinates", t => {
  t.plan(3);
  const line1 = turf.lineString([[7.5, 50], [8, 50], [8.5, 50], [9, 50], [9.5, 50]]);
  t.equals(utils.pointInCoordinates(line1, [7.5, 50]).length, 0);
  t.equals(utils.pointInCoordinates(line1, [8.5, 50])[0], 2);
  t.equals(utils.pointInCoordinates(line1, [9.5, 50]).length, 0);
});

test("geohub - split lineString", t => {
  t.plan(2);
  const line1 = turf.lineString([[7.5, 50], [8, 50], [8.5, 50], [9, 50], [9.5, 50]]);
  const lines = utils.lineSplit(line1, [2]);
  t.equals(JSON.stringify(lines[0].geometry.coordinates), "[[7.5,50],[8,50],[8.5,50]]");
  t.equals(JSON.stringify(lines[1].geometry.coordinates), "[[8.5,50],[9,50],[9.5,50]]");
});

test("geohub - split lineString two times", t => {
  t.plan(3);
  const line1 = turf.lineString([[7.5, 50], [8, 50], [8.5, 50], [9, 50], [9.5, 50]]);
  const lines = utils.lineSplit(line1, [1, 3]);
  t.equals(JSON.stringify(lines[0].geometry.coordinates), "[[7.5,50],[8,50]]");
  t.equals(JSON.stringify(lines[1].geometry.coordinates), "[[8,50],[8.5,50],[9,50]]");
  t.equals(JSON.stringify(lines[2].geometry.coordinates), "[[9,50],[9.5,50]]");
});

test("geohub - split lineString at vertex", t => {
  t.plan(4);
  const line1 = turf.lineString([[7.5, 50], [8, 50], [8.5, 50], [9, 50], [9.5, 50]]);
  const linesStart = utils.lineSplit(line1, [0]);
  const linesEnd = utils.lineSplit(line1, [4]);
  t.equals(linesStart.length, 1);
  t.equals(JSON.stringify(line1.geometry), JSON.stringify(linesStart[0].geometry));
  t.equals(linesEnd.length, 1);
  t.equals(JSON.stringify(line1.geometry), JSON.stringify(linesEnd[0].geometry));
});

test("geohub - split two lineStrings", t => {
  const line1 = turf.lineString([[7.5, 50], [8, 50], [8.5, 50], [9, 50], [9.5, 50]]);
  const line2 = turf.lineString([[7.5, 49], [8, 50], [8.5, 49], [9, 50], [9.5, 49]]);
  const result = utils.splitLines(line1, line2);
  t.equals(result.length, 6);
  t.end();
});

test("geohub - convert lineStrings into mesh", {skip: false}, t => {
  const fc = JSON.parse(fs.readFileSync("./test/testdata.json"));
  //const fc = JSON.parse(fs.readFileSync("./errordata2.json"));
  t.ok(fc);
  const features = fc.features;

  console.time("Meshing");
  const mesh = utils.createMesh(features);
  console.timeEnd("Meshing");
  console.log("Mesh size: ", mesh.length);
  t.end();
});

test("geohub - find close by points", {skip: false}, t => {
  const fc = JSON.parse(fs.readFileSync("./test/testdata.json"));
  const indexData = utils.createFeaturesIndex(fc);
  const features = utils.findClosestFeatures(indexData, {lng: 9.2442388, lat: 49.1373489}, 0.0005);
  t.equals(features.length, 1);
  t.end();
});

test("geohub - test close by points", {skip: true}, t => {
  const points = [[9, 10], [9, 11], [10, 10], [10, 11], [10, 10]];
  const pointIndex = kdbush(points);
  const result = pointIndex.within(9.7, 10, 0.4);
  console.log("result: ", result);
  t.end();
});

test("geohub - test sameBorders", {skip: false}, t => {
  const fromBorders = {border1: [9.237684, 49.1363735], border2: [9.2376375, 49.1359338]};
  const toBorders = {border1: [9.2368973, 49.1364072], border2: [9.237684, 49.1363735]};
  const result = utils.sameBorders(fromBorders, toBorders);
  t.notOk(result);
  t.end();
});


test("geohub - test sameBorders paralell", {skip: false}, t => {
  const fromBorders = {border1: [9, 49], border2: [9, 50]};
  const toBorders = {border1: [9, 49], border2: [9, 50]};
  const result = utils.sameBorders(fromBorders, toBorders);
  t.ok(result, "border should be same");
  t.end();
});

test("geohub - test sameBorders cross", {skip: false}, t => {
  const fromBorders = {border1: [9, 49], border2: [9, 50]};
  const toBorders = {border1: [9, 50], border2: [9, 49]};
  const result = utils.sameBorders(fromBorders, toBorders);
  t.ok(result, "border should be same");
  t.end();
});


test("geohub - dijkstras", {}, t => {
  const g = new Dijkstras();

  g.addVertex('A', {B: 7, C: 8});
  g.addVertex('B', {A: 7, F: 2});
  g.addVertex('C', {A: 8, F: 6, G: 4});
  g.addVertex('D', {F: 8});
  g.addVertex('E', {H: 1});
  g.addVertex('F', {B: 2, C: 6, D: 8, G: 9, H: 3});
  g.addVertex('G', {C: 4, F: 9});
  g.addVertex('H', {E: 1, F: 3});

  t.equals(JSON.stringify(g.shortestPath('A', 'H').concat(['A']).reverse()), '["A","B","F","H"]');
  t.end();
});

test("geohub - dijkstras with mesh", {skip: false}, t => {
  const fc = JSON.parse(fs.readFileSync("./test/testdata.json"));
  const features = fc.features;
  console.time("Meshing");
  const mesh = utils.createMesh(features);
  console.timeEnd("Meshing");

  console.time("Vertexing");
  const graphData = {};

  const addVertex = function (startPoint, endPoint, length) {
    let startData = graphData[startPoint];
    if (!startData) {
      startData = {};
      graphData[startPoint] = startData;
    }
    if (!startData[endPoint]) {
      startData[endPoint] = length;
    }
  };

  mesh.forEach((vertex) => {
    const coords = vertex.geometry.coordinates;
    const startPoint = coords[0].join("#");
    const endPoint = coords[coords.length - 1].join("#");
    const length = vertex.properties.length;
    addVertex(startPoint, endPoint, length);
    addVertex(endPoint, startPoint, length);
  });

  console.timeEnd("Vertexing");

  console.time("Routing");

  const g = new Dijkstras();
  g.setVertices(graphData);


  const fromPoint = [9.2385927, 49.1371923];
  const toPoint = [9.2352176, 49.1356715];

  const path = g.shortestPath(fromPoint.join("#"), toPoint.join("#")).concat([fromPoint.join("#")]).reverse();

  console.timeEnd("Routing");
  const coords = [];
  path.forEach((point) => {
    const pair = point.split("#");
    coords.push([Number(pair[0]), Number(pair[1])]);
  });

  t.end();
});


/*  const allPoints = turf.coordAll(fc);
 const index = kdbush(allPoints);
 var nearest = geokdbush.around(index, 8, 50, 1, 0);
 console.log("nearest: ", nearest);*/


/*  const splitLines = turf.lineSplit(line1, point);

 turf.featureEach(splitLines, (feature) => {
 console.log("line: ", feature.geometry);
 });*/

/*
 const pointAlong = turf.along(line1, 71.49662609671813);
 console.log("point: ", pointAlong);
 const pointOnLine = turf.pointOnLine(line1, pointAlong);

 console.log(pointOnLine);

 t.ok(isNaN(pointOnLine.properties.location));*/

// var features = turf.lineIntersect(line1, line2);
//  var features = turf.lineSegment(line1);

/*  turf.featureEach(features, (feature) => {
 console.log("feature: ", JSON.stringify(feature, null, 1));
 });*/


//const mesh = createMesh([line1, line2, line3]);
//t.assert(mesh.length, 4);
