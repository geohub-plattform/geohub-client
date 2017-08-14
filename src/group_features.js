const Constants = require("./constants");
const turf = require("@turf/turf");
const propertiesMerge = require("./properties_merge");

module.exports = function (ctx) {

  function updateSources() {
    ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection([]));
    ctx.selectedFeatures = null;
  }

  function group() {
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
        if (allFeaturesType === "Polygon") {
          const coords = [];
          ctx.selectedFeatures.forEach((feature) => {
            coords.push(feature.geometry.coordinates);
          });
          if (coords.length > 0) {
            ctx.featuresStore.addFeatures([turf.multiPolygon(coords, propertiesMerge(ctx.selectedFeatures))]);
            updateSources();
            ctx.snackbar("Elemente gruppiert");
          }
        } else if (allFeaturesType === "LineString") {
          const coords = [];
          ctx.selectedFeatures.forEach((feature) => {
            coords.push(feature.geometry.coordinates);
          });
          if (coords.length > 0) {
            ctx.featuresStore.addFeatures([turf.multiLineString(coords, propertiesMerge(ctx.selectedFeatures))]);
            updateSources();
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
