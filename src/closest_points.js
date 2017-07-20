import cheapRuler from "cheap-ruler";

function closestPoints(ruler, coordinates, evtCoords) {
  const result = [];
  const pointOnLine = ruler.pointOnLine(coordinates, evtCoords);
  if (pointOnLine) {
    const pointCoords = pointOnLine.point;
    const pointIndex = pointOnLine.index;
    const linePoint = {type: "linepoint", coords: pointCoords};
    let vertex = null;
    if (pointIndex === coordinates.length) {
      vertex = coordinates[pointIndex];
    } else {
      const p1 = coordinates[pointIndex];
      const p2 = coordinates[pointIndex + 1];
      const distance1 = ruler.distance(p1, evtCoords);
      const distance2 = ruler.distance(p2, evtCoords);
      vertex = distance1 < distance2 ? p1 : p2;
      linePoint.border1 = p1;
      linePoint.distance1 = distance1;
      linePoint.border2 = p2;
      linePoint.distance2 = distance2;
    }
    result.push(linePoint);
    result.push({type: "vertex", coords: vertex});
  }
  return result;
}

function calculatePointsOnLine(uniqueFeatures, evtCoords) {
  const coords = [];
  const knownIds = {};

  uniqueFeatures.forEach((feature) => {
    const geoHubId = feature.properties.geoHubId;
    if (knownIds[geoHubId] === undefined) {
      knownIds[geoHubId] = true;
      const type = feature.geometry.type;
      if (type === "LineString") {
        if (feature.geometry.coordinates) {
          const ruler = cheapRuler(feature.geometry.coordinates[0][1]);
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
        const pointType = {type: "vertex", coords: feature.geometry.coordinates};
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
        if (closestVertex === null || closestVertex.dist > pointType.dist) {
          closestVertex = pointType;
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
        return {coords: closestVertex.coords, borders: null, geoHubId: closestVertex.geoHubId};
      } else {
        return {coords: closestLinepoint.coords, borders: borders, geoHubId: closestLinepoint.geoHubId};
      }
    } else {
      return {coords: closestVertex.coords, borders: null, geoHubId: closestVertex.geoHubId};
    }
  } else if (closestLinepoint !== null) {
    return {coords: closestLinepoint.coords, borders: borders, geoHubId: closestLinepoint.geoHubId};
  } else {
    return null;
  }
}

module.exports = {findClosestPoint};
