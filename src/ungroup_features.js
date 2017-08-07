const Constants = require("./constants");
const turf = require("@turf/turf");

module.exports = function (ctx) {

  function updateSources() {
    ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection([]));
    ctx.map.getSource(Constants.sources.SELECT_HELPER).setData(turf.featureCollection([]));
    ctx.selectedFeatures = null;
  }

  function ungroup() {
    if (ctx.mode === Constants.modes.SELECT) {
      if (ctx.selectedFeatures && ctx.selectedFeatures.length === 1) {
        const currentFeature = ctx.selectedFeatures[0];
        const newFeatures = [];
        if (currentFeature.geometry.type === "MultiPolygon") {
          currentFeature.geometry.coordinates.forEach((coords) => {
            // TODO merge properties from all features
            newFeatures.push(turf.polygon(coords));
          });
        } else if (currentFeature.geometry.type === "MultiLineString") {
          currentFeature.geometry.coordinates.forEach((coords) => {
            // TODO merge properties from all features
            newFeatures.push(turf.lineString(coords));
          });
        } else {
          ctx.snackbar("Unbekannte Gruppe");
        }
        if (newFeatures.length > 0) {
          ctx.featuresStore.addFeatures(newFeatures);
          updateSources();
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
