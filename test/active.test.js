import test from "tape";
import turf from "@turf/turf";
import MeshIndex from "../src/mesh_index";
import cheapRuler from "cheap-ruler";

test("geohub - mesh with endpoints on line2", {skip: false}, t => {
  const notWorkingLine = turf.lineString([[9.237282773977249, 49.13639068738651], [9.23770828881629, 49.13660337062738]]);
  const ver4_3_1 = turf.lineString([[9.237330417927016, 49.136388646454634], [9.237705490884599, 49.13657689085556]]);
  const onePointWorking = turf.lineString([[9.23711246024184, 49.13639798314459], [9.237718632934047, 49.13670126789871]]);

  const southLine = turf.lineString([[9.2368973, 49.1364072], [9.237684, 49.1363735]]);
  const eastLine = turf.lineString([[9.2377299, 49.1368079], [9.237684, 49.1363735]]);
  const features = [southLine, eastLine, onePointWorking];

  const meshIndex = new MeshIndex(features);

  const result = meshIndex.getMesh();
  t.equals(result.length, 5);
  console.log(JSON.stringify(turf.featureCollection(result)));

  t.end();
});

test("geohub - mesh with endpoints on line2", {skip: true}, t => {

  //const onePointWorking = turf.lineString([[9.23711246024184, 49.13639798314459], [9.237718632934047, 49.13670126789871]]);
  const onePointWorking = turf.lineString([[
    9.23711246052352,
    49.136397983132525
  ], [9.237718632934047, 49.13670126789871]]);
  const southLine = turf.lineString([[9.2368973, 49.1364072], [9.237684, 49.1363735]]);

  const resultDirection1 = turf.lineIntersect(southLine, onePointWorking);
  const resultDirection2 = turf.lineIntersect(onePointWorking, southLine);

  t.equals(resultDirection1.features.length, 1);

  console.log("dir1: ", resultDirection1.features[0].geometry.coordinates);
  console.log("dir2: ", resultDirection2.features[0].geometry.coordinates);
  t.end();

});

test("geohub - mesh with endpoints on line2", {skip: true}, t => {

  var ruler = cheapRuler(49.136);

  const onePointWorking = turf.lineString([[9.23711246024184, 49.13639798314459], [9.237718632934047, 49.13670126789871]]);
  const southLine = turf.lineString([[9.2368973, 49.1364072], [9.237684, 49.1363735]]);


  // const result = turf.pointOnLine(southLine, turf.point([9.23711246024184, 49.13639798314459]));
//  const result = turf.pointOnLine(southLine, turf.point([9.23711246052352, 49.136397983132525]));
  const result = turf.pointOnLine(southLine, turf.point([9.2371124608052, 49.13639798312046]));

  const rulerResult = ruler.pointOnLine(southLine.geometry.coordinates, [9.23711246024184, 49.13639798314459]);


  console.log(JSON.stringify(rulerResult, null, 1));


  t.end();

});

test("geohub - routing issue", {skip: false}, t => {
  const shortRoute = turf.lineString([[9.23711190230233, 49.13684158888254], [9.2377299, 49.1368079],
    [9.237704381331193, 49.13656638998411], [9.237982697157868, 49.13639440432985]]);

  console.log("Length: ", turf.lineDistance(shortRoute));


  t.end();
});

test("geohub - split line", {skip: true}, t => {
  const shortRoute = turf.lineString([
    [
      9.237230122089386,
      49.136564453643736
    ],
    [
      9.238061606884003,
      49.13651005302963
    ]
  ]);


  const result = turf.lineSplit(shortRoute, turf.point([
    9.237653911113739,
    49.13656269878615
  ]));


  console.log("result: ", JSON.stringify(result));


  t.end();
});
