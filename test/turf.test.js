const test = require("tape");
const turf = require("@turf/turf");


test("geohub - lineSplit test", {skip: false}, t => {
  const lineString = turf.lineString([[9.2202022, 49.1438226], [9.2199531, 49.1439048], [9.2196177, 49.1440264]]);
  const resultFc = turf.lineSplit(lineString, turf.point([9.2199531, 49.1439048]));
  t.equals(resultFc.features.length, 2);
  t.end();
});


test("geohub - lineSplit splitter at end test", {skip: false}, t => {
  const lineString = turf.lineString([[9.2202022, 49.1438226], [9.2199531, 49.1439048], [9.2196177, 49.1440264]]);
  const resultFc = turf.lineSplit(lineString, turf.point([9.2202022, 49.1438226]));
  t.equals(resultFc.features.length, 2);

  console.log("line1:", JSON.stringify(resultFc.features[0].geometry.coordinates));
  console.log("line2:", JSON.stringify(resultFc.features[1].geometry.coordinates));
  t.end();
});

/*
test("geohub - lineSplit splitter at end test2", {skip: false}, t => {
  const lineString = turf.lineString([[9.2194539, 49.1456542], [9.2185956, 49.1450893], [9.2181343, 49.1443734]]);
  const resultFc = turf.lineSplit(lineString, turf.point([9.2194539, 49.1456542]));
  t.equals(resultFc.features.length, 2);

  console.log("line1:", JSON.stringify(resultFc.features[0].geometry.coordinates));
  //console.log("line2:", JSON.stringify(resultFc.features[1].geometry.coordinates));
  t.end();
});
*/

test("geohub - lineSplit splitter at end test3", {skip: false}, t => {
  const lineString = turf.lineString([[9.2185956, 49.1450893], [9.2181343, 49.1443734], [9.2192501, 49.1438962]]);
  const resultFc = turf.lineSplit(lineString, turf.point([9.2181343, 49.1443734]));
  t.equals(resultFc.features.length, 2);

  console.log("line1:", JSON.stringify(resultFc.features[0].geometry.coordinates));
  t.end();
});




