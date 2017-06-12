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
    knownSegments.forEach((segmentFeature1, idx1) => {
      newSegments.forEach((segmentFeature2, idx2) => {
        const forwardDir = `${idx1}:${idx2}`;
        const backDir = `${idx2}:${idx1}`;
        if (segmentFeature1 !== segmentFeature2 && checkedSegments[backDir] === undefined) {
          checkedSegments[forwardDir] = true;
          const fc = turf.lineIntersect(segmentFeature1, segmentFeature2);
          turf.featureEach(fc, (point) => {
            const pointCoords = point.geometry.coordinates;
            const seg1Coords = segmentFeature1.geometry.coordinates;
            const seg2Coords = segmentFeature2.geometry.coordinates;
            if ((!isPointEqual(pointCoords, seg1Coords[0])) && (!isPointEqual(pointCoords, seg1Coords[1])) &&
              (!isPointEqual(pointCoords, seg2Coords[0])) && (!isPointEqual(pointCoords, seg2Coords[1]))) {
              appendCutFeatures(segmentsWithCutPoints, segmentFeature1, fc.features);
              appendCutFeatures(segmentsWithCutPoints, segmentFeature2, fc.features);
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
    const newSegments = splitIntoTwoPointSegmentsAndAddIds(newFeatures);
    const segmentsWithCutPoints = checkForIntersections(allSegments, newSegments);
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

  const features = fc.features;
  const features2 = [turf.lineString([[9.214, 49.133], [9.232, 49.133]]),
    turf.lineString([[9.214, 49.136], [9.231, 49.127]]), turf.lineString([[9.213, 49.126], [9.231, 49.136]])];

  const extraLine = turf.lineString([[9.22877311706543, 49.1359291911374],
    [9.228966236114502, 49.126213223144774]]);

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

  //t.equals(JSON.stringify(result), '[{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[9.214,49.133],[9.219666666666667,49.133]]}},{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[9.219666666666667,49.133],[9.225600000000002,49.133]]}},{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[9.225600000000002,49.133],[9.232,49.133]]}},{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[9.214,49.136],[9.219666666666667,49.133]]}},{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[9.219666666666667,49.133],[9.22270481927711,49.13139156626506]]}},{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[9.22270481927711,49.13139156626506],[9.231,49.127]]}},{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[9.213,49.126],[9.22270481927711,49.13139156626506]]}},{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[9.22270481927711,49.13139156626506],[9.225600000000002,49.133]]}},{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[9.225600000000002,49.133],[9.231,49.136]]}}]');


  //console.log(JSON.stringify(turf.featureCollection(result2)));

  t.end();
});

