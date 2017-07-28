const turf = require("@turf/turf");

module.exports = function (ctx) {

  function zoomInFeatures() {
    const coldFeatures = ctx.featuresStore.getColdFeatures();
    if (coldFeatures.length > 0) {
      const bbox = turf.bbox(turf.featureCollection(coldFeatures));
      ctx.map.fitBounds(bbox);
    } else {
      ctx.snackbar("Keine Elemente verfügbar");
    }
  }

  return zoomInFeatures;
};
