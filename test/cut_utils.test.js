const test = require("tape");
const turf = require("@turf/turf");
const cutUtils = require("../src/cut_utils");


test("geohub - cutPolygon in the middle", {skip: false}, t => {
  const testPolygon = [[[9.2194539, 49.1456542], [9.2185956, 49.1450893], [9.2181343, 49.1443734],
    [9.2192501, 49.1438962], [9.2209828, 49.1442681], [9.2212617, 49.1459385], [9.2202532, 49.1458051],
    [9.2194539, 49.1456542]]];

  const cutPoint = turf.point([9.2181343, 49.1443734]);
  const features = cutUtils.cutPolygon(testPolygon, cutPoint, 0);
  t.equals(features.length, 1);
  t.equals(JSON.stringify(features[0].geometry.coordinates), "[[9.2181343,49.1443734],[9.2192501,49.1438962],[9.2209828,49.1442681],[9.2212617,49.1459385],[9.2202532,49.1458051],[9.2194539,49.1456542],[9.2185956,49.1450893],[9.2181343,49.1443734]]");
  t.end();
});

test("geohub - cutPolygon at the edge", {skip: false}, t => {
  const testPolygon = [[[9.2194539, 49.1456542], [9.2185956, 49.1450893], [9.2181343, 49.1443734],
    [9.2192501, 49.1438962], [9.2209828, 49.1442681], [9.2212617, 49.1459385], [9.2202532, 49.1458051],
    [9.2194539, 49.1456542]]];

  const cutPoint = turf.point([9.2194539, 49.1456542]);
  const features = cutUtils.cutPolygon(testPolygon, cutPoint, 0);
  t.equals(features.length, 1);
  t.equals(JSON.stringify(features[0].geometry.coordinates), "[[9.2194539,49.1456542],[9.2185956,49.1450893],[9.2181343,49.1443734]," +
    "[9.2192501,49.1438962],[9.2209828,49.1442681],[9.2212617,49.1459385],[9.2202532,49.1458051]," +
    "[9.2194539,49.1456542]]");
  t.end();
});



