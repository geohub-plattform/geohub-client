module.exports = function (ctx) {

  function addUserData(fc) {
    ctx.internalApi.addUserData(fc);
    ctx.featuresStore.addFeatures(fc.features);
  }

  return {addUserData};
};
