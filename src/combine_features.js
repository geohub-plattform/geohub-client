const Constants = require("./constants");
const turf = require("@turf/turf");
const featureUtils = require("./feature_utils");

module.exports = function (ctx) {

  function combine() {
    if (ctx.mode === Constants.modes.SELECT) {
      if (ctx.selectStore.hasSelection()) {
        const allFeaturesType = ctx.selectStore.getCommonGeometryType();
        if (allFeaturesType === "Polygon") {
          const polygons = [];
          ctx.selectStore.forEach((polygon) => {
            polygons.push(...polygon.geometry.coordinates);
          });
          if (polygons.length > 0) {
            ctx.featuresStore.addFeatures([turf.polygon(polygons, ctx.selectStore.getMergedProperties())]);
            ctx.selectStore.clearSelection();
          }
        } else if (allFeaturesType === "LineString") {
          const coords = featureUtils.combineSameTypeFeatures(ctx.selectStore.getFeatures());
          if (coords.length > 0) {
            ctx.featuresStore.addFeatures([turf.lineString(coords, ctx.selectStore.getMergedProperties())]);
            ctx.selectStore.clearSelection();
          }
        } else {
          ctx.snackbar("Es können nur Objekte vom selben Typ kombiniert werden, " +
            "d.h. Linien mit Linien und Polygone mit Polygonen");
        }
      }
    } else {
      ctx.snackbar("Die Funktion 'Kombinieren' kann nur im Auswahlmodus ausgeführt werden");
    }
  }

  return combine;
};
