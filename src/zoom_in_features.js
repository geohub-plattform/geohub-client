const turf = require("@turf/turf");

module.exports = function (ctx) {

  function zoomInFeatures() {
    const coldFeatures = ctx.featuresStore.getColdFeatures();
    if (coldFeatures.length > 0) {
      const bbox = turf.bbox(turf.featureCollection());
      ctx.map.fitBounds(bbox);
    }
  }

  return zoomInFeatures;
};
