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
    const newCutPoint = utils.reducePrecision(feature.geometry.coordinates);
    if (segCutPoints.findIndex((element) => {
        return (element[0] === newCutPoint[0] && element[1] === newCutPoint[1]);
      }) === -1) {
      segCutPoints.push(newCutPoint);
    }
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

  function coordinatesToLineStrings(coords, result) {
    let firstPoint = coords[0];
    let secondPoint = null;
    for (let index = 1; index < coords.length; index++) {
      secondPoint = coords[index];
      const line = turf.lineString([firstPoint, secondPoint]);
      addFeatureToIndex(line);
      result.push(line);
      firstPoint = secondPoint;
    }
  }

  function splitIntoTwoPointSegmentsAndAddIds(features) {
    const result = [];
    features.forEach((feature) => {
      const type = feature.geometry.type;
      if (type === "MultiPolygon") {
        feature.geometry.coordinates.forEach((coords) => {
          coords.forEach((subCoords) => {
            coordinatesToLineStrings(subCoords, result);
          });
        });
      } else if (type === "Polygon" || type === "MultiLineString") {
        feature.geometry.coordinates.forEach((coords) => {
          coordinatesToLineStrings(coords, result);
        });
      } else if (type === "LineString") {
        coordinatesToLineStrings(feature.geometry.coordinates, result);
      } else if (type === "Point") {
        addFeatureToIndex(feature);
        result.push(feature);
      }
    });
    console.log("original features ", features.length, " split into single segments: ", result.length);
    return result;
  }

  function checkForIntersections(knownSegments, newSegments) {
    const segmentsWithCutPoints = {};
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

    const checkIfPointInCloseRange = function (feature, coords) {
      const pointOnline = turf.pointOnLine(feature, turf.point(coords));
      if (pointOnline.properties.dist < Constants.MIN_DISTANCE) {
        if (!utils.isPointAtVertex(feature.geometry.coordinates, coords)) {
          appendCutFeatures(segmentsWithCutPoints, feature, [pointOnline]);
          return true;
        }
      }
      return false;
    };

    const sameSegments = knownSegments === newSegments;
    console.log("sameSegments: ", sameSegments);

    for (let knownIndex = 0; knownIndex < knownSegments.length; knownIndex++) {
      const segmentFeature1 = knownSegments[knownIndex];
      const feature1Type = segmentFeature1.geometry.type;
      for (let newIndex = sameSegments ? knownIndex + 1 : 0; newIndex < newSegments.length; newIndex++) {
        const segmentFeature2 = newSegments[newIndex];
        const feature2Type = segmentFeature2.geometry.type;
        if (feature1Type === "LineString" && feature2Type === "LineString") {
          if (utils.featuresOverlap(segmentFeature1, segmentFeature2)) {
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
              checkIfPointInCloseRange(segmentFeature1, seg2Coords[0]);
              checkIfPointInCloseRange(segmentFeature1, seg2Coords[1]);
              checkIfPointInCloseRange(segmentFeature2, seg1Coords[0]);
              checkIfPointInCloseRange(segmentFeature2, seg1Coords[1]);
            }
          }
        } else if (feature1Type === "Point" || feature2Type === "Point") {
          if (feature2Type === "Point" && feature2Type === "Point") {
            console.log("Point & Point");
            // kann im moment ignoriert werden. falls zwei punkte so nah bei einander sind,
            // dass sie einen punkt ergeben, könnte hier einer der punkte gelöscht werden
          } else {
            console.log("Point & LineString");
            const point = feature1Type === "Point" ? segmentFeature1 : segmentFeature2;
            const line = feature1Type === "LineString" ? segmentFeature1 : segmentFeature2;
            if (checkIfPointInCloseRange(line, point.geometry.coordinates)) {
              segmentsWithCutPoints[point.properties.geoHubId] = [];
            }
          }
        }
      }
    }

    return segmentsWithCutPoints;
  }

  function cutSegments(newSegments, segmentsWithCutPoints) {
    // iterate over all segments, copy segments into a new array,
    // if a segment has cut point then replace it with the new sub segments
    const result = [];
    newSegments.forEach((segment) => {
      if (segment.geometry.type === "LineString") {
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
      } else {
        const cutPoints = segmentsWithCutPoints[segment.properties.geoHubId];
        if (cutPoints === undefined) {
          result.push(segment);
        } else {
          console.log("Removing point ", segment);
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
  console.log("all segments after intersections: ", allSegments.length);
};

module.exports = MeshIndex;
