const Constants = require("./constants");
const turf = require("@turf/turf");

module.exports = function (ctx) {

  function group() {
    if (ctx.mode === Constants.modes.SELECT) {
      if (ctx.selectStore.hasSelection()) {
        const allFeaturesType = ctx.selectStore.getCommonGeometryType();
        if (allFeaturesType === "Polygon") {
          const coords = [];
          ctx.selectStore.forEach((feature) => {
            coords.push(feature.geometry.coordinates);
          });
          if (coords.length > 0) {
            ctx.featuresStore.addFeatures([turf.multiPolygon(coords, ctx.selectStore.getMergedProperties())]);
            ctx.selectStore.clearSelection();
            ctx.snackbar("Elemente gruppiert");
          }
        } else if (allFeaturesType === "LineString") {
          const coords = [];
          ctx.selectStore.forEach((feature) => {
            coords.push(feature.geometry.coordinates);
          });
          if (coords.length > 0) {
            ctx.featuresStore.addFeatures([turf.multiLineString(coords, ctx.selectStore.getMergedProperties())]);
            ctx.selectStore.clearSelection();
            ctx.snackbar("Elemente gruppiert");
          }
        } else {
          ctx.snackbar("Es können nur Objekte vom selben Typ kombiniert werden, " +
            "d.h. Linien mit Linien und Polygone mit Polygonen");
        }
      }
    } else {
      ctx.snackbar("Die Funktion 'Groupieren' kann nur im Auswahlmodus ausgeführt werden");
    }
  }

  return group;
};
