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

test("geohub - mesh with endpoints on line", {skip: false}, t => {
  const features = [turf.lineString([[9, 49], [10, 49]]),
    turf.lineString([[9.5, 49], [9.5, 50]])];

  console.time("Meshing");
  const meshIndex = new MeshIndex(features);
  console.timeEnd("Meshing");

  const result = meshIndex.getMesh();
  t.equals(result.length, 3);

  let lengthCount = 0;
  result.forEach((element) => {
    if (element.properties.length !== undefined) {
      lengthCount++;
    }
  });
  t.equals(lengthCount, 3);
  t.end();
});

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

test("geohub - mesh with line on edges", {skip: false}, t => {
  const features = [
    turf.lineString([[9, 10], [10, 10]]),
    turf.lineString([[10, 10], [11, 10]]),
    turf.lineString([[10, 10], [10, 9]]),
    turf.lineString([[10, 11], [10, 10]])
  ];
  const meshIndex = new MeshIndex(features);
  const result = meshIndex.getMesh();
  t.equals(result.length, 4);

  meshIndex.addNewFeatures([turf.lineString([[9.5, 10], [10, 10.5]])]);

  const result2 = meshIndex.getMesh();
  t.equals(result2.length, 7);
  t.end();
});

test("geohub - zoom dependant radius", {}, t => {
  const calculatedRadius = 0.001 + ((0.1 - 0.001) * (1 - (22 / 22)));
  t.equals(0.001, calculatedRadius);
  t.end();
});

test("geohub - mesh with endpoints on line", {skip: false}, t => {
  const segmentFeature1 = turf.lineString([[9, 49], [10, 49]]);
  const segmentFeature2 = turf.lineString([[9.5, 49], [9.5, 50]]);
  const intersectionPoints = turf.lineIntersect(segmentFeature1, segmentFeature2);
  t.equals(1, intersectionPoints.features.length);
  t.end();
});

test("geohub - line split with points at the end", {skip: false}, t => {
  const segment = turf.lineString([[9, 49], [10, 49]]);
  const fc = turf.lineSplit(segment, turf.multiPoint([[9, 49], [10, 49]]));
  // lineSplit returns a 0 length segment
  t.equals(2, fc.features.length);
  t.end();
});

test("geohub - line split with points in mixed order", {skip: false}, t => {
  const segment = turf.lineString([[9, 49], [10, 49]]);
  const fc = turf.lineSplit(segment, turf.multiPoint([[9.1, 49], [9.8, 49], [9.2, 49], [9.3, 49]]));
  // lineSplit returns a 0 length segment
  t.equals(5, fc.features.length);
  t.end();
});

