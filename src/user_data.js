const Constants = require("./constants");
const turf = require("@turf/turf");

module.exports = function (ctx) {

  function addUserData(fc) {
    ctx.internalApi.addUserData(fc);
    if (ctx.coldFeatures === undefined) {
      ctx.coldFeatures = [];
    }
    ctx.coldFeatures.push(...fc.features);
    ctx.map.getSource(Constants.sources.COLD).setData(turf.featureCollection(ctx.coldFeatures));
  }

  return {addUserData};
};
