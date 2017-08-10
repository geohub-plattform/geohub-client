module.exports = function (ctx) {

  function addUserData(fc) {
    if (fc && fc.features) {
      ctx.internalApi.addUserData(fc);
      ctx.featuresStore.addFeatures(fc.features);
    } else {
      ctx.snackbar("Keine gültigen GeoJSON Daten");
    }
  }
  return {addUserData};
};
