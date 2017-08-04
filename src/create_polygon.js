const Constants = require("./constants");
const turf = require("@turf/turf");
const featureUtils = require("./feature_utils");
const utils = require("./utils");

module.exports = function (ctx) {

  function updateSources() {
    ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection([]));
    ctx.map.getSource(Constants.sources.SELECT_HELPER).setData(turf.featureCollection([]));
    ctx.selectedFeatures = null;
  }

  function createPolygon() {
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
          const coords = featureUtils.combineSameTypeFeatures(ctx.selectedFeatures);
          if (coords.length > 0) {
            if (!utils.isPointEqual(coords[0], coords[coords.length - 1])) {
              coords.push(coords[0]);
            }
            ctx.featuresStore.addFeatures([turf.polygon([coords], ctx.selectedFeatures[0].properties)]);
            updateSources();
          }
        } else {
          alert("Es können nur Objekte vom Typ LineString zu einem Polygon kombiniert werden");
        }
      }
    } else {
      alert("Die Funktion 'Polygon erstellen' kann nur im Auswahlmodus ausgeführt werden");
    }
  }

  return createPolygon;
};
