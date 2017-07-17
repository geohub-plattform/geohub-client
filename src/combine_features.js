const Constants = require("./constants");
const turf = require("@turf/turf");
const utils = require("./utils");
const featureUtils = require("./feature_utils");

module.exports = function (ctx) {

  function updateSources() {
    ctx.map.getSource(Constants.sources.COLD).setData(turf.featureCollection(ctx.coldFeatures));
    ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection([]));
    ctx.map.getSource(Constants.sources.SELECT_HELPER).setData(turf.featureCollection([]));
    ctx.selectedFeatures = null;
  }

  function combine() {
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
          const polygons = [];
          ctx.selectedFeatures.forEach((polygon) => {
            polygons.push(...polygon.geometry.coordinates);
          });
          if (polygons.length > 0) {
            ctx.coldFeatures.push(turf.polygon(polygons, ctx.selectedFeatures[0].properties));
            updateSources();
          }
        } else if (allFeaturesType === "LineString") {
          const coords = featureUtils.combineSameTypeFeatures(ctx.selectedFeatures);
          if (coords.length > 0) {
            ctx.coldFeatures.push(turf.lineString(coords, ctx.selectedFeatures[0].properties));
            updateSources();
          }
        } else {
          alert("Es können nur Objekte vom selben Typ kombiniert werden, " +
            "d.h. Linien mit Linien und Polygone mit Polygonen");
        }
      }
    } else {
      alert("Die Funktion 'Kombinieren' kann nur im Auswahlmodus ausgeführt werden");
    }
  }

  return combine;
};
