//const turf = require("@turf/turf");
//const utils = require("./utils");
import turf from "@turf/turf";
import utils from "./utils";

const MIN_SEGMENT_LENGTH = 0.0000001;

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
            if (!utils.isPointEqual(pointCoords, seg1Coords[0]) && !utils.isPointEqual(pointCoords, seg1Coords[1])) {
              appendCutFeatures(segmentsWithCutPoints, segmentFeature1, intersectionPoints.features);
            }
            const seg2Coords = segmentFeature2.geometry.coordinates;
            if (!utils.isPointEqual(pointCoords, seg2Coords[0]) && !utils.isPointEqual(pointCoords, seg2Coords[1])) {
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
          const length = turf.lineDistance(feature);
          if (length > MIN_SEGMENT_LENGTH) {
            utils.addProperties(feature, utils.createRandomStroke());
            utils.addProperties(feature, {length: length});
            utils.setProperty(feature, "geoHubId", segmentId++);
            result.push(feature);
          } else {
            console.error("0 length feature: ", feature);
          }
        });
      } else {
        const length = turf.lineDistance(segment);
        if (length > MIN_SEGMENT_LENGTH) {
          utils.addProperties(segment, {length: length});
          result.push(segment);
        } else {
          console.error("0 length feature: ", segment);
        }
      }
    });
    return result;
  }

  function splitAndCheckForIntersections(newFeatures) {
    const newFeaturesSegments = splitIntoTwoPointSegmentsAndAddIds(newFeatures);
    const newFeaturesWithCutPoints = checkForIntersections(newFeaturesSegments, newFeaturesSegments);
    return cutSegments(newFeaturesSegments, newFeaturesWithCutPoints);
  }

  this.addNewFeatures = function (newFeatures) {
    const allNewFeatures = splitAndCheckForIntersections(newFeatures);
    const newSegments = splitIntoTwoPointSegmentsAndAddIds(allNewFeatures);
    const segmentsWithCutPoints = checkForIntersections(newSegments, allSegments);
    allSegments = [...cutSegments(allSegments, segmentsWithCutPoints),
      ...cutSegments(newSegments, segmentsWithCutPoints)];
  };

  this.getMesh = function () {
    return allSegments;
  };

  allSegments = splitAndCheckForIntersections(originalData);
};

module.exports = MeshIndex;
