const turf = require("@turf/turf");
const utils = require("./utils");
const Constants = require("./constants");


const appendCutFeatures = function (segmentsWithCutPoints, feature, cutPointFeatures) {
  let segCutPoints = segmentsWithCutPoints[feature.properties.geoHubId];
  if (segCutPoints === undefined) {
    segCutPoints = [];
    segmentsWithCutPoints[feature.properties.geoHubId] = segCutPoints;
  }
  cutPointFeatures.forEach((feature) => {
    segCutPoints.push(utils.reducePrecision(feature.geometry.coordinates));
  });
};

const MeshIndex = function (originalData) {
  let segmentId = 0;
  let allSegments = [];
  const featureIndex = {};

  function addFeatureToIndex(feature) {
    featureIndex[segmentId] = feature;
    utils.setProperty(feature, "geoHubId", segmentId);
    segmentId++;
  }

  function splitIntoTwoPointSegmentsAndAddIds(features) {
    const result = [];
    features.forEach((lineString) => {
      const coords = lineString.geometry.coordinates;
      let firstPoint = coords[0];
      let secondPoint = null;
      for (let index = 1; index < coords.length; index++) {
        secondPoint = coords[index];
        const line = turf.lineString([firstPoint, secondPoint]);
        addFeatureToIndex(line);
        result.push(line);
        firstPoint = secondPoint;
      }
    });
    return result;
  }

  function checkForIntersections(knownSegments, newSegments) {
    const segmentsWithCutPoints = {};
    const checkedSegments = {};
    const processIntersectionPoint = function (point, feature1, feature2) {
      const pointCoords = point.geometry.coordinates;
      const seg1Coords = feature1.geometry.coordinates;
      const seg2Coords = feature2.geometry.coordinates;
      let addFeature1Point = false;
      let addFeature2Point = false;
      let closestPointAdded = false;

      if (!utils.isPointEqual(pointCoords, seg1Coords[0]) && !utils.isPointEqual(pointCoords, seg1Coords[1])) {
        const endpoint1 = turf.point(seg1Coords[0]);
        const endpoint2 = turf.point(seg1Coords[1]);
        const distanceEndpoint1 = turf.distance(point, endpoint1);
        const distanceEndpoint2 = turf.distance(point, endpoint2);

        const closestEndpoint = distanceEndpoint1 < distanceEndpoint2 ? endpoint1 : endpoint2;

        const pointOnLine = turf.pointOnLine(feature2, closestEndpoint);
        if (pointOnLine.properties.dist < Constants.MIN_DISTANCE) {
          appendCutFeatures(segmentsWithCutPoints, feature2, [closestEndpoint]);
          closestPointAdded = true;
        } else {
          addFeature1Point = true;
        }
      }
      if (!utils.isPointEqual(pointCoords, seg2Coords[0]) && !utils.isPointEqual(pointCoords, seg2Coords[1])) {
        const endpoint1 = turf.point(seg2Coords[0]);
        const endpoint2 = turf.point(seg2Coords[1]);
        const distanceEndpoint1 = turf.distance(point, endpoint1);
        const distanceEndpoint2 = turf.distance(point, endpoint2);

        const closestEndpoint = distanceEndpoint1 < distanceEndpoint2 ? endpoint1 : endpoint2;

        const pointOnLine = turf.pointOnLine(feature1, closestEndpoint);
        if (pointOnLine.properties.dist < Constants.MIN_DISTANCE) {
          appendCutFeatures(segmentsWithCutPoints, feature1, [closestEndpoint]);
          closestPointAdded = true;
        } else {
          addFeature2Point = true;
        }
      }

      if (!closestPointAdded) {
        if (addFeature1Point) {
          appendCutFeatures(segmentsWithCutPoints, feature1, [point]);
        }
        if (addFeature2Point) {
          appendCutFeatures(segmentsWithCutPoints, feature2, [point]);
        }
      }
    };

    knownSegments.forEach((segmentFeature1) => {
      const idx1 = segmentFeature1.properties.geoHubId;
      newSegments.forEach((segmentFeature2) => {
        const idx2 = segmentFeature2.properties.geoHubId;
        const forwardDir = `${idx1}:${idx2}`;
        const backDir = `${idx2}:${idx1}`;
        if (segmentFeature1 !== segmentFeature2 && checkedSegments[backDir] === undefined) {
          checkedSegments[forwardDir] = true;
          const intersectionPoints = turf.lineIntersect(segmentFeature1, segmentFeature2).features;
          if (intersectionPoints.length > 0) {
            if (intersectionPoints.length > 1) {
              console.error(`${intersectionPoints.length} intersection points received`);
            }
            const point = intersectionPoints[0];
            processIntersectionPoint(point, segmentFeature1, segmentFeature2);
          } else {
            const seg1Coords = segmentFeature1.geometry.coordinates;
            const seg2Coords = segmentFeature2.geometry.coordinates;
            const pOL1Seg20 = turf.pointOnLine(segmentFeature1, turf.point(seg2Coords[0]));
            if (pOL1Seg20.properties.dist < Constants.MIN_DISTANCE) {
              appendCutFeatures(segmentsWithCutPoints, segmentFeature1, [pOL1Seg20]);
            }
            const pOL1Seg21 = turf.pointOnLine(segmentFeature1, turf.point(seg2Coords[1]));
            if (pOL1Seg21.properties.dist < Constants.MIN_DISTANCE) {
              appendCutFeatures(segmentsWithCutPoints, segmentFeature1, [pOL1Seg21]);
            }
            const pOL2Seg10 = turf.pointOnLine(segmentFeature2, turf.point(seg1Coords[0]));
            if (pOL2Seg10.properties.dist < Constants.MIN_DISTANCE) {
              appendCutFeatures(segmentsWithCutPoints, segmentFeature2, [pOL2Seg10]);
            }
            const pOL2Seg11 = turf.pointOnLine(segmentFeature2, turf.point(seg1Coords[1]));
            if (pOL2Seg11.properties.dist < Constants.MIN_DISTANCE) {
              appendCutFeatures(segmentsWithCutPoints, segmentFeature2, [pOL2Seg11]);
            }
          }


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
          if (length > Constants.MIN_SEGMENT_LENGTH) {
            utils.addProperties(feature, utils.createRandomStroke());
            utils.addProperties(feature, {length: length});
            addFeatureToIndex(feature);
            result.push(feature);
          } else {
            console.error("0 length feature (", length, ") after line split: ", JSON.stringify(feature));
          }
        });
      } else {
        const length = turf.lineDistance(segment);
        if (length > Constants.MIN_SEGMENT_LENGTH) {
          utils.addProperties(segment, {length: length});
          result.push(segment);
        } else {
          console.error("0 length feature (", length, ") existing segment: ", JSON.stringify(segment));
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

  this.splitSegmentAtPoint = function (segmentId, pointCoords) {
    const feature = featureIndex[segmentId];
    if (feature !== undefined) {
      const pos = allSegments.indexOf(feature);
      allSegments.splice(pos, 1);
      const line1 = utils.createLineWithLength([pointCoords, feature.geometry.coordinates[0]]);
      const line2 = utils.createLineWithLength([pointCoords, feature.geometry.coordinates[1]]);
      addFeatureToIndex(line1);
      addFeatureToIndex(line2);
      allSegments.push(line1, line2);
    } else {
      console.error("splitSegmentAtPoint: no original feature for id ", segmentId);
    }
  };

  this.getFeaturesFromIndex = function (features) {
    const result = [];
    features.forEach((feature) => {
      const id = feature.properties.geoHubId;
      const originalFeature = featureIndex[id];
      if (originalFeature !== undefined) {
        result.push(originalFeature);
      } else {
        console.error("getFeaturesFromIndex: no original feature for id ", id);
      }
    });
    return result;
  };

  allSegments = splitAndCheckForIntersections(originalData);
};

module.exports = MeshIndex;
