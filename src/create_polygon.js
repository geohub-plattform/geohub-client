const Constants = require("./constants");
const turf = require("@turf/turf");
const featureUtils = require("./feature_utils");
const utils = require("./utils");

module.exports = function (ctx) {

  function createPolygon() {
    if (ctx.mode === Constants.modes.SELECT) {
      if (ctx.selectStore.hasSelection()) {
        const allFeaturesType = ctx.selectStore.getCommonGeometryType();
        if (allFeaturesType === "LineString") {
          const coords = featureUtils.combineSameTypeFeatures(ctx.selectStore.getFeatures());
          if (coords.length > 0) {
            if (!utils.isPointEqual(coords[0], coords[coords.length - 1])) {
              coords.push(coords[0]);
            }
            ctx.featuresStore.addFeatures([turf.polygon([coords], ctx.selectStore.getMergedProperties())]);
            ctx.selectStore.clearSelection();
          }
        } else {
          ctx.snackbar("Es können nur Objekte vom Typ LineString zu einem Polygon kombiniert werden");
        }
      }
    } else {
      ctx.snackbar("Die Funktion 'Polygon erstellen' kann nur im Auswahlmodus ausgeführt werden");
    }
  }

  return createPolygon;
};
