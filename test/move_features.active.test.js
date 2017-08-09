const test = require("tape");
const turf = require("@turf/turf");

function move() {

}


test("geohub - move line", {skip: false}, t => {
  const testLine = [[9.2194539, 49.1456542],
    [9.2185956, 49.1450893],
    [9.2181343, 49.1443734],
    [9.2192501, 49.1438962]];


  console.log(JSON.stringify(turf.featureCollection([turf.multiLineString(cutLines),
    turf.lineString(testLine)])));

  t.end();
});



