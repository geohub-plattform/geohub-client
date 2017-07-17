const test = require("tape");
const turf = require("@turf/turf");
const featureUtils = require("../src/feature_utils");

test("geohub - combine two lines, same order", {skip: false}, t => {
  const baseLine = turf.lineString([[9, 50], [10, 50], [11, 50]]);
  const secondLine = turf.lineString([[11, 50], [12, 49], [13, 49]]);
  const combinedCords = featureUtils.combineSameTypeFeatures([baseLine, secondLine]);
  t.equals(JSON.stringify(combinedCords), "[[9,50],[10,50],[11,50],[12,49],[13,49]]");
  t.end();
});

test("geohub - combine two lines, second reverse order", {skip: false}, t => {
  const baseLine = turf.lineString([[9, 50], [10, 50], [11, 50]]);
  const secondLine = turf.lineString([[13, 49], [12, 49], [11, 50]]);
  const combinedCords = featureUtils.combineSameTypeFeatures([baseLine, secondLine]);
  t.equals(JSON.stringify(combinedCords), "[[9,50],[10,50],[11,50],[12,49],[13,49]]");
  t.end();
});


test("geohub - combine two lines, apart", {skip: false}, t => {
  const baseLine = turf.lineString([[9, 50], [10, 50], [11, 50]]);
  const secondLine = turf.lineString([[11, 49], [12, 49], [13, 49]]);
  const combinedCords = featureUtils.combineSameTypeFeatures([baseLine, secondLine]);
  t.equals(JSON.stringify(combinedCords), "[[9,50],[10,50],[11,50],[11,49],[12,49],[13,49]]");
  t.end();
});


test("geohub - combine two lines, apart reverse", {skip: false}, t => {
  const baseLine = turf.lineString([[9, 50], [10, 50], [11, 50]]);
  const secondLine = turf.lineString([[13, 49], [12, 49], [11, 49]]);
  const combinedCords = featureUtils.combineSameTypeFeatures([baseLine, secondLine]);
  t.equals(JSON.stringify(combinedCords), "[[9,50],[10,50],[11,50],[11,49],[12,49],[13,49]]");
  t.end();
});
