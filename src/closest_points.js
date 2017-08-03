import cheapRuler from "cheap-ruler";


function closestPoints(ruler, coordinates, evtCoords) {
  const result = [];
  const pointOnLine = ruler.pointOnLine(coordinates, evtCoords);
  let lineEdge = false;
  const pointCoords = pointOnLine.point;
  const pointIndex = pointOnLine.index;
  const linePoint = {type: "linepoint", coords: pointCoords};
  let vertex = null;

  const p1 = coordinates[pointIndex];
  const p2 = coordinates[pointIndex + 1];
  const distance1 = ruler.distance(p1, evtCoords);
  const distance2 = ruler.distance(p2, evtCoords);
  if (distance1 < distance2) {
    lineEdge = pointIndex === 0;
    vertex = p1;
  } else {
    lineEdge = pointIndex + 1 === coordinates.length - 1;
    vertex = p2;
  }

  linePoint.border1 = p1;
  linePoint.distance1 = distance1;
  linePoint.border2 = p2;
  linePoint.distance2 = distance2;

  result.push(linePoint);
  result.push({type: "vertex", coords: vertex, lineEdge: lineEdge});
  return result;
}

function calculatePointsOnLine(uniqueFeatures, evtCoords) {
  const coords = [];
  const knownIds = {};
  const ruler = cheapRuler(evtCoords[1]);

  uniqueFeatures.forEach((feature) => {
    const geoHubId = feature.properties.geoHubId;
    if (knownIds[geoHubId] === undefined) {
      knownIds[geoHubId] = true;
      const type = feature.geometry.type;
      if (type === "LineString") {
        if (feature.geometry.coordinates) {
          closestPoints(ruler, feature.geometry.coordinates, evtCoords).forEach((pointType) => {
            pointType.geoHubId = geoHubId;
            pointType.dist = ruler.distance(pointType.coords, evtCoords);
            coords.push(pointType);
          });
        } else {
          console.log("no coordinates: ", feature);
        }
      } else if (type === "Point") {
        const ruler = cheapRuler(feature.geometry.coordinates[1]);
        const pointType = {type: "vertex", coords: feature.geometry.coordinates, lineEdge: true};
        pointType.dist = ruler.distance(pointType.coords, evtCoords);
        coords.push(pointType);
      }
    }
  });
  return coords;
}

function findClosestPoint(uniqueFeatures, evtCoords, radius) {
  const coords = calculatePointsOnLine(uniqueFeatures, evtCoords);

  let closestVertex = null;
  let closestLinepoint = null;
  let borders;


  coords.forEach((pointType) => {
    const dist = pointType.dist;
    if (dist !== null) {
      if (pointType.type === "vertex") {
        if (closestVertex === null) {
          closestVertex = pointType;
        } else if (pointType.dist <= closestVertex.dist) {
          if (pointType.dist === closestVertex.dist) {
            if (closestVertex.lineEdge) {
              closestVertex = pointType;
            }
          } else {
            closestVertex = pointType;
          }
        }
      } else if (dist < radius) {
        if (closestLinepoint !== null && dist === closestLinepoint.dist && closestLinepoint.geoHubId !== pointType.geoHubId) {
          // dies ist für den fall, dass zwei linien übereinander liegen.
          // finde dann die linie, deren endpunkte am nächsten zum mauszeiger liegen
          if (closestLinepoint.type === "linepoint") {
            if ((pointType.distance1 <= closestLinepoint.distance1 && pointType.distance2 <= closestLinepoint.distance2) ||
              (pointType.distance2 <= closestLinepoint.distance1 && pointType.distance1 <= closestLinepoint.distance2)) {
              console.log("switch closest points");
              closestLinepoint = pointType;
            }
          }
        }
        if (closestLinepoint === null || dist < closestLinepoint.dist) {
          closestLinepoint = pointType;
          if (pointType.border1 && pointType.border2) {
            borders = {
              border1: pointType.border1,
              border2: pointType.border2,
              distance1: pointType.distance1,
              distance2: pointType.distance2
            };
          } else {
            borders = null;
          }
        }
      }
    }
  });

  if (closestVertex !== null) {
    if (closestLinepoint !== null) {
      if (closestVertex.dist < radius) {
        return {coords: closestVertex.coords, borders: null, geoHubId: closestVertex.geoHubId, type: "vertex"};
      } else {
        return {
          coords: closestLinepoint.coords,
          borders: borders,
          geoHubId: closestLinepoint.geoHubId,
          type: "linepoint"
        };
      }
    } else {
      return {coords: closestVertex.coords, borders: null, geoHubId: closestVertex.geoHubId, type: "vertex"};
    }
  } else if (closestLinepoint !== null) {
    return {coords: closestLinepoint.coords, borders: borders, geoHubId: closestLinepoint.geoHubId, type: "linepoint"};
  } else {
    return null;
  }
}

module.exports = {findClosestPoint};
