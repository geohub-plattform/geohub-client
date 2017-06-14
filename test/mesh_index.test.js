import test from "tape";
import turf from "@turf/turf";
import MeshIndex from "../src/mesh_index";

test("geohub - mesh with intersections", {skip: false}, t => {
  const features = [turf.lineString([[9.214, 49.133], [9.232, 49.133]]),
    turf.lineString([[9.214, 49.136], [9.231, 49.127]]), turf.lineString([[9.213, 49.126], [9.231, 49.136]])];

  const extraLine = turf.lineString([[9.22877311706543, 49.1359291911374],
    [9.228966236114502, 49.126213223144774]]);

  const selfCrossingLine = turf.lineString([
    [9.218752384185791, 49.13483413389217],
    [9.215641021728516, 49.13041154120394],
    [9.219911098480225, 49.131436494632105],
    [9.213967323303223, 49.13386540924051]
  ]);

  console.time("Meshing");
  const meshIndex = new MeshIndex(features);
  console.timeEnd("Meshing");

  const result = meshIndex.getMesh();
  t.equals(result.length, 9);

  let lengthCount = 0;
  result.forEach((element) => {
    console.log("length: ", element.properties.length);
    if (element.properties.length !== undefined) {
      lengthCount++;
    }
  });
  t.equals(lengthCount, 9);

  console.time("Add feature");
  meshIndex.addNewFeatures([extraLine]);
  console.timeEnd("Add feature");

  const result2 = meshIndex.getMesh();
  t.equals(result2.length, 16);

  console.time("Add self crossing line");
  meshIndex.addNewFeatures([selfCrossingLine]);
  console.timeEnd("Add self crossing line");

  const result3 = meshIndex.getMesh();
  t.equals(result3.length, 27);

  //console.log(JSON.stringify(turf.featureCollection(result3)));

  t.end();
});

