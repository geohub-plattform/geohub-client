import test from "tape";
import turf from "@turf/turf";
import fs from "fs";
import utils from "../src/utils";

const appendCutFeatures = function (segmentsWithCutPoints, feature, cutPointFeatures) {
  let segCutPoints = segmentsWithCutPoints[feature.properties.geoHubId];
  if (segCutPoints === undefined) {
    segCutPoints = [];
    segmentsWithCutPoints[feature.properties.geoHubId] = segCutPoints;
  }
  cutPointFeatures.forEach((feature) => {
    segCutPoints.push(feature.geometry.coordinates);
  });
};

function isPointEqual(coords1, coords2) {
  return coords1[0] === coords2[0] && coords1[1] === coords2[1];
}


const MeshIndex = function (originalData) {
  let segmentId = 0;
  let allSegments = [];

  function splitIntoTwoPointSegmentsAndAddIds(features) {
    const result = [];
    features.forEach((lineString) => {
      const coords = lineString.geometry.coordinates;
      let firstPoint = coords[0];
      let secondPoint = null;
      for (let index = 1; index < coords.length; index++) {
        secondPoint = coords[index];
        const line = turf.lineString([firstPoint, secondPoint]);
        utils.setProperty(line, "geoHubId", segmentId);
        segmentId++;
        result.push(line);
        firstPoint = secondPoint;
      }
    });
    return result;
  }

  function checkForIntersections(knownSegments, newSegments) {
    const segmentsWithCutPoints = {};
    const checkedSegments = {};
    knownSegments.forEach((segmentFeature1) => {
      const idx1 = segmentFeature1.properties.geoHubId;
      newSegments.forEach((segmentFeature2) => {
        const idx2 = segmentFeature2.properties.geoHubId;
        const forwardDir = `${idx1}:${idx2}`;
        const backDir = `${idx2}:${idx1}`;
        if (segmentFeature1 !== segmentFeature2 && checkedSegments[backDir] === undefined) {
          checkedSegments[forwardDir] = true;
          const intersectionPoints = turf.lineIntersect(segmentFeature1, segmentFeature2);
          turf.featureEach(intersectionPoints, (point) => {
            const pointCoords = point.geometry.coordinates;
            const seg1Coords = segmentFeature1.geometry.coordinates;
            const seg2Coords = segmentFeature2.geometry.coordinates;
            if ((!isPointEqual(pointCoords, seg1Coords[0])) && (!isPointEqual(pointCoords, seg1Coords[1])) &&
              (!isPointEqual(pointCoords, seg2Coords[0])) && (!isPointEqual(pointCoords, seg2Coords[1]))) {
              appendCutFeatures(segmentsWithCutPoints, segmentFeature1, intersectionPoints.features);
              appendCutFeatures(segmentsWithCutPoints, segmentFeature2, intersectionPoints.features);
            }
          });
        }
      });
    });
    return segmentsWithCutPoints;
  }

  function cutSegments(newSegments, segmentsWithCutPoints) {
    // iterate over all segments, copy segments into a new array,
    // if a segment has cut point then replace it with the new sub segments
    const result = [];
    newSegments.forEach((segment) => {
      const cutPoints = segmentsWithCutPoints[segment.properties.geoHubId];
      if (cutPoints !== undefined) {
        const fc = turf.lineSplit(segment, turf.multiPoint(cutPoints));
        turf.featureEach(fc, (feature) => {
          utils.addProperties(feature, utils.createRandomStroke());
          utils.addProperties(feature, {length: turf.lineDistance(feature)});
          utils.setProperty(feature, "geoHubId", segmentId++);
          result.push(feature);
        });
      } else {
        result.push(segment);
      }
    });
    return result;
  }

  this.addNewFeatures = function (newFeatures) {
    const newFeaturesSegments = splitIntoTwoPointSegmentsAndAddIds(newFeatures);
    const newFeaturesWithCutPoints = checkForIntersections(newFeaturesSegments, newFeaturesSegments);
    const allNewFeatures = cutSegments(newFeaturesSegments, newFeaturesWithCutPoints);

    const newSegments = splitIntoTwoPointSegmentsAndAddIds(allNewFeatures);
    const segmentsWithCutPoints = checkForIntersections(newSegments, allSegments);
    allSegments = [...cutSegments(allSegments, segmentsWithCutPoints),
      ...cutSegments(newSegments, segmentsWithCutPoints)];
  };

  this.getMesh = function () {
    return allSegments;
  };

  const newSegments = splitIntoTwoPointSegmentsAndAddIds(originalData);
  const segmentsWithCutPoints = checkForIntersections(newSegments, newSegments);
  allSegments = cutSegments(newSegments, segmentsWithCutPoints);
};


test("geohub - mesh with intersections", {skip: false}, t => {
  const fc = JSON.parse(fs.readFileSync("./test/testdata.json"));

  const features2 = fc.features;
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

  console.log(JSON.stringify(turf.featureCollection(result3)));

  t.end();
});

