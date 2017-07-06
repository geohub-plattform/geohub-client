const turf = require("@turf/turf");
const Constants = require("./constants");
/**
 * Returns the points that the given point matches with the given coordinates. The function
 * only tests for exact coordinates.
 * @param lineString
 * @param pointCoords
 * @returns {Array}
 */
function pointInCoordinates(lineString, pointCoords) {
  const result = [];
  lineString.geometry.coordinates.forEach((coords, index) => {
    if (index !== 0 && index !== lineString.geometry.coordinates.length - 1) {
      if (coords[0] === pointCoords[0] && coords[1] === pointCoords[1]) {
        result.push(index);
      }
    }
  });
  return result;
}

function sameBorders(fromBorders, toBorders) {
  if (fromBorders && toBorders) {
    return (fromBorders.border1[0] === toBorders.border1[0] && fromBorders.border1[1] === toBorders.border1[1] &&
      fromBorders.border2[0] === toBorders.border2[0] && fromBorders.border2[1] === toBorders.border2[1]) ||
      (fromBorders.border1[0] === toBorders.border2[0] && fromBorders.border1[1] === toBorders.border2[1] &&
      fromBorders.border2[0] === toBorders.border1[0] && fromBorders.border2[1] === toBorders.border1[1]);
  } else {
    return false;
  }
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
function createRandomStroke() {
  return {stroke: getRandomColor()};
}

function createLineAndSaveLength(lineCoords, props) {
  const copyProps = Object.assign({}, props, createRandomStroke());
  const line = turf.lineString(lineCoords, copyProps);
  copyProps.length = turf.lineDistance(line);
  return line;

}

function lineSplit(lineString, pointIndexes) {
  const props = lineString.properties;
  let lineCoords = [...lineString.geometry.coordinates];
  const result = [];
  let delta = 0;
  pointIndexes.forEach((pointIndex) => {
    pointIndex -= delta;
    if (pointIndex < lineCoords.length - 1) {
      const secondPart = lineCoords.splice(pointIndex, lineCoords.length - pointIndex);
      if (lineCoords.length > 0) { // if a part is remaining
        lineCoords.push(secondPart[0]); // duplicate cutting point
        result.push(createLineAndSaveLength(lineCoords, props));
      }
      lineCoords = secondPart;
      delta += pointIndex;
    }
  });
  if (lineCoords.length > 0) {
    result.push(createLineAndSaveLength(lineCoords, props));
  }
  return result;
}

function splitLines(lineString1, lineString2) {
  const line1CutPoints = [];
  const line2CutPoints = [];

  lineString1.geometry.coordinates.forEach((coords, index) => {
    const points = pointInCoordinates(lineString2, coords);
    if (points.length > 0) {
      line2CutPoints.push(...points);
      line1CutPoints.push(index);
    }
  });

  if (line1CutPoints.length === 0 && line2CutPoints.length === 0) {
    return null;
  } else {
    const result = [];
    result.push(...lineSplit(lineString1, line1CutPoints));
    result.push(...lineSplit(lineString2, line2CutPoints));
    return result;
  }
}

function createSimpleMesh(features) {
  const result = [];
  features.forEach((lineString) => {
    const props = lineString.properties;
    const coords = lineString.geometry.coordinates;
    let firstPoint = coords[0];
    let secondPoint = null;
    for (let index = 1; index < coords.length; index++) {
      secondPoint = coords[index];
      result.push(createLineAndSaveLength([firstPoint, secondPoint], props));
      firstPoint = secondPoint;
    }
  });
  return result;
}

function createMesh(features) {
  features.forEach((lineString1) => {
    let line1CutPoints = lineString1.properties.cutPoints;
    if (!line1CutPoints) {
      line1CutPoints = [];
      lineString1.properties.cutPoints = line1CutPoints;
    }
    features.forEach((lineString2) => {
      if (lineString1 !== lineString2) {
        let line2CutPoints = lineString2.properties.cutPoints;
        if (!line2CutPoints) {
          line2CutPoints = [];
          lineString2.properties.cutPoints = line2CutPoints;
        }
        lineString1.geometry.coordinates.forEach((coords, index) => {
          const points = pointInCoordinates(lineString2, coords);
          if (points.length > 0) {
            points.forEach((cutPoint) => {
              if (line2CutPoints.indexOf(cutPoint) === -1) {
                line2CutPoints.push(cutPoint);
              }
            });
            if (index !== 0 && index !== lineString1.geometry.coordinates.length - 1) {
              if (line1CutPoints.indexOf(index) === -1) {
                line1CutPoints.push(index);
              }
            }
          }
        });
      }
    });
  });
  const mesh = [];
  features.forEach((lineString) => {
    lineString.properties.cutPoints.sort((a, b) => {
      return a - b;
    });
    mesh.push(...lineSplit(lineString, lineString.properties.cutPoints));
  });
  return mesh;
}

function setProperty(feature, name, value) {
  let props = feature.properties;
  if (!props) {
    props = {};
    feature.properties = props;
  }
  props[name] = value;
}

function addProperties(feature, newProps) {
  feature.properties = Object.assign(feature.properties || {}, newProps);
}

function findClosestFeatures(indexData, point, radius) {
  const featureIdsWithin = indexData.pointIndex.within(point.lng, point.lat, radius);
  const assertUniqueFeatures = {};
  const featureResult = [];
  featureIdsWithin.forEach((pointId) => {
    const featureId = indexData.pointFeatureMap[pointId];
    if (!assertUniqueFeatures[featureId]) {
      featureResult.push(indexData.featureById[featureId]);
      assertUniqueFeatures[featureId] = true;
    }
  });
  return featureResult;
}

function isPointEqual(coords1, coords2) {
  return coords1[0] === coords2[0] && coords1[1] === coords2[1];
}

function isPolygon(feature) {
  const coords = feature.geometry.coordinates;
  const firstCoords = coords[0];
  const lastCoords = coords[coords.length - 1];
  return isPointEqual(firstCoords, lastCoords);
}

function isEmptyLineString(feature) {
  if (feature.geometry.type === "LineString") {
    const coords = feature.geometry.coordinates;
    if (coords.length === 2) {
      const firstCoords = coords[0];
      const lastCoords = coords[coords.length - 1];
      return isPointEqual(firstCoords, lastCoords);
    }
  }
  return false;
}


function isPointAtVertex(geometryCoords, pointCoords) {
  const firstPoint = geometryCoords[0];
  const lastPoint = geometryCoords[geometryCoords.length - 1];
  return isPointEqual(firstPoint, pointCoords) || isPointEqual(lastPoint, pointCoords);
}

function isPointNotTooClose(coords1, coords2) {
  const line = turf.lineString([coords1, coords2]);
  const length = turf.lineDistance(line);

  if (length >= Constants.MIN_DISTANCE) {
    return !(coords1[0] === coords2[0] && coords1[1] === coords2[1]);
  } else {
    return false;
  }
}

function createLineWithLength(coords) {
  const line = turf.lineString(coords);
  const length = turf.lineDistance(line);
  addProperties(line, {length: length});
  return line;
}

function reducePrecision(coords) {
  coords[0] = Number(Number(coords[0]).toFixed(7));
  coords[1] = Number(Number(coords[1]).toFixed(7));
  return coords;
}

function createBbox(coords) {
  const bbox1 = {};
  if (coords[0][0] < coords[1][0]) {
    bbox1.west = coords[0][0];
    bbox1.east = coords[1][0];
  } else {
    bbox1.west = coords[1][0];
    bbox1.east = coords[0][0];
  }
  if (coords[0][1] < coords[1][1]) {
    bbox1.south = coords[0][1];
    bbox1.north = coords[1][1];
  } else {
    bbox1.south = coords[1][1];
    bbox1.north = coords[0][1];
  }
  return bbox1;
}


function featuresOverlap(feature1, feature2) {
  const coords1 = feature1.geometry.coordinates;
  const coords2 = feature2.geometry.coordinates;
  if (coords1.length === 2 && coords2.length === 2) {
    const bbox1 = createBbox(coords1);
    const bbox2 = createBbox(coords2);
    if (bbox1.east < bbox2.west || bbox1.west > bbox2.east) {
      return false;
    } else if (bbox1.north < bbox2.south || bbox1.south > bbox2.north) {
      return false;
    }
    return true;
  } else {
    throw new Error("wrong number of coordinates, expected 2");
  }
}


module.exports = {
  pointInCoordinates,
  lineSplit,
  splitLines,
  createSimpleMesh,
  createLineAndSaveLength,
  createMesh,
  findClosestFeatures,
  sameBorders,
  setProperty,
  createRandomStroke,
  addProperties,
  isPointEqual,
  createLineWithLength,
  reducePrecision,
  isPointNotTooClose,
  featuresOverlap,
  isPointAtVertex,
  isPolygon,
  isEmptyLineString
};
