const turf = require("@turf/turf");
const utils = require("./utils");

/**
 * Cuts a polygon and creates a line string and new polygons of all the inner polygons
 * @param polygonCoords
 * @param cutPoint
 * @param polygonCoordsArray on with polygon is the cut point
 * @returns {Array}
 */
function cutPolygon(polygonCoords, cutPoint, polygonCoordsArray) {
  const newFeatures = [];

  const lineToCut = polygonCoords.splice(polygonCoordsArray, 1)[0];
  const newLineStrings = turf.lineSplit(turf.lineString(lineToCut), cutPoint);
  const features = newLineStrings.features;
  console.log("features: ", features.length);

  if (features.length > 1) {
    const firstLine = features[0].geometry.coordinates;
    const secondLine = features[1].geometry.coordinates;
    const firstLineFirstPoint = firstLine[0];
    if (utils.isPointEqual(cutPoint, firstLineFirstPoint)) {
      firstLine.push(...secondLine.slice(1, firstLine.length));
      newFeatures.push(features[0]); // return first line

    } else {
      secondLine.push(...firstLine.slice(1, firstLine.length));
      newFeatures.push(features[1]); // return second line

    }
  } else {
    newFeatures.push(...features);
  }

  polygonCoords.forEach((element) => {
    newFeatures.push(turf.polygon([element]));
  });

  return newFeatures;
}

function lineSplit(lineCoords, splitterCoords) {

}

module.exports = {cutPolygon};
