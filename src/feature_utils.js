const turf = require("@turf/turf");
const utils = require("./utils");

function combineSameTypeFeatures(features) {
  const coords = [];
  features.forEach((lineString) => {
    if (coords.length === 0) {
      coords.push(...lineString.geometry.coordinates);
    } else {
      const firstPoint = coords[0];
      const lastPoint = coords[coords.length - 1];
      const currentFirstPoint = lineString.geometry.coordinates[0];
      const currentLastPoint = lineString.geometry.coordinates[lineString.geometry.coordinates.length - 1];
      if (utils.isPointEqual(lastPoint, currentFirstPoint)) {
        coords.push(...lineString.geometry.coordinates.slice(1, lineString.geometry.coordinates.length));
      } else if (utils.isPointEqual(lastPoint, currentLastPoint)) {
        coords.push(...lineString.geometry.coordinates.slice(0, lineString.geometry.coordinates.length - 1).reverse());
      } else if (utils.isPointEqual(firstPoint, currentLastPoint)) {
        coords.splice(0, 0, ...lineString.geometry.coordinates.slice(0, lineString.geometry.coordinates.length - 1));
      } else {
        const distanceToFirstPoint = turf.distance(lastPoint, currentFirstPoint);
        const distanceToLastPoint = turf.distance(lastPoint, currentLastPoint);
        if (distanceToFirstPoint < distanceToLastPoint) {
          coords.push(...lineString.geometry.coordinates);
        } else {
          coords.push(...[...lineString.geometry.coordinates].reverse());
        }
      }
    }
  });
  return coords;
}

module.exports = {combineSameTypeFeatures};

