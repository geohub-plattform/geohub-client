const Constants = require("./constants");
const turf = require("@turf/turf");

module.exports = function (ctx) {

  const moveDistance = 0.001;

  function updateSources() {
    ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection(ctx.selectedFeatures));
  }

  function moveLine(line, direction) {
    const result = [];
    let lastDestinationPoint = null;

    for (let index = 0; index < line.length; index++) {
      let moveBearing = 0;
      let startPoint = null;
      const middlePoint = line[index];

      if (index === 0) {
        const endPoint = line[index + 1];
        const secondBearing = turf.bearing(middlePoint, endPoint);
        moveBearing = secondBearing - 90;
        if (moveBearing < -180) {
          moveBearing += 180;
        }
      } else if (index === line.length - 1) {
        startPoint = line[index - 1];
        const firstBearing = turf.bearing(middlePoint, startPoint);
        moveBearing = firstBearing - 90;
        if (moveBearing < -180) {
          moveBearing += 180;
        }
      } else {
        startPoint = line[index - 1];
        const endPoint = line[index + 1];

        const firstBearing = turf.bearing(middlePoint, startPoint);
        const secondBearing = turf.bearing(middlePoint, endPoint);

        let angle = 0;
        if ((firstBearing < 0 && secondBearing < 0) || (firstBearing > 0 && secondBearing > 0)) {
          angle = Math.abs(Math.abs(firstBearing) - Math.abs(secondBearing));
          moveBearing = firstBearing < 0 ? firstBearing - (angle / 2) : firstBearing + (angle / 2);
        } else {
          angle = Math.abs(Math.abs(firstBearing) + Math.abs(secondBearing));
          moveBearing = firstBearing < 0 ? firstBearing - (angle / 2) : ((angle / 2) - firstBearing) * -1;
        }

        console.log("bearing 1: ", turf.bearing(middlePoint, startPoint));
        console.log("bearing 2: ", turf.bearing(middlePoint, endPoint));
        console.log("angle: ", angle);
      }

      let destinationPoint = turf.destination(middlePoint, direction * moveDistance, moveBearing);

      if (lastDestinationPoint && startPoint) {
        const crossingLine = turf.lineString([lastDestinationPoint.geometry.coordinates, destinationPoint.geometry.coordinates]);
        const intersectFc = turf.lineIntersect(turf.lineString([startPoint, middlePoint]), crossingLine);
        if (intersectFc.features.length > 0) {
          destinationPoint = turf.destination(middlePoint, direction * -moveDistance, moveBearing);
        }
      }
      result.push(destinationPoint.geometry.coordinates);
      lastDestinationPoint = destinationPoint;
    }
    return result;

  }

  function move(direction) {
    if (ctx.mode === Constants.modes.SELECT) {
      if (ctx.selectedFeatures) {
        let allFeaturesType = null;
        ctx.selectedFeatures.forEach((feature) => {
          if (allFeaturesType === null) {
            allFeaturesType = feature.geometry.type;
          } else if (feature.geometry.type !== allFeaturesType) {
            allFeaturesType = "illegal";
          }
        });
        if (allFeaturesType === "LineString") {
          const newSelectedFeatures = [];
          ctx.selectedFeatures.forEach((feature) => {
            newSelectedFeatures.push(turf.lineOffset(feature, moveDistance * direction));
          });
          ctx.selectedFeatures = newSelectedFeatures;
          updateSources();

        } else {
          ctx.snackbar("Es können nur Objekte vom selben Typ verschoben werden, " +
            "d.h. Linien mit Linien und Polygone mit Polygonen");
        }
      }
    } else {
      ctx.snackbar("Die Funktion 'Verschieben' kann nur im Auswahlmodus ausgeführt werden");
    }
  }

  return move;
};
