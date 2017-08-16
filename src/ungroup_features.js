const Constants = require("./constants");
const turf = require("@turf/turf");

module.exports = function (ctx) {


  function ungroup() {
    if (ctx.mode === Constants.modes.SELECT) {
      if (ctx.selectStore.hasSingleSelection()) {
        const currentFeature = ctx.selectStore.getFeatures()[0];
        const newFeatures = [];
        if (currentFeature.geometry.type === "MultiPolygon") {
          currentFeature.geometry.coordinates.forEach((coords) => {
            newFeatures.push(turf.polygon(coords, Object.assign({}, currentFeature.properties)));
          });
        } else if (currentFeature.geometry.type === "MultiLineString") {
          currentFeature.geometry.coordinates.forEach((coords) => {
            newFeatures.push(turf.lineString(coords, Object.assign({}, currentFeature.properties)));
          });
        } else {
          ctx.snackbar("Unbekannte Gruppe");
        }
        if (newFeatures.length > 0) {
          ctx.featuresStore.addFeatures(newFeatures);
          ctx.selectStore.clearSelection();
          ctx.snackbar("Gruppe aufgelöst");
        }
      } else {
        ctx.snackbar("Es kann immer nur ein Element als Gruppe aufgelöst werden.");
      }
    } else {
      ctx.snackbar("Die Funktion 'Groupieren' kann nur im Auswahlmodus ausgeführt werden");
    }
  }

  return ungroup;
};
