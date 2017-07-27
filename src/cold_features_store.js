const Constants = require("./constants");
const turf = require("@turf/turf");

module.exports = function (ctx) {
  const coldFeatures = [];
  let storeFeatureId = 0;

  function updateSource() {
    ctx.map.getSource(Constants.sources.COLD).setData(turf.featureCollection(coldFeatures));
  }

  function getFeatureById(id) {
    let result = null;
    coldFeatures.forEach((element) => {
      if (element.properties.geoHubId === id) {
        result = element;
      }
    });
    if (result === null) {
      console.error("cannot find cold feature with id: ", id, " storeFeatureId: ", storeFeatureId, " coldFeatures length: ", coldFeatures.length);
    }
    return result;
  }

  this.getColdFeatures = function () {
    // TODO clone everything, remove geoHubId from properties
    return coldFeatures;
  };


  this.getFeaturesById = function (ids) {
    const result = [];
    ids.forEach((id) => {
      const feature = getFeatureById(id);
      if (feature) {
        result.push(feature);
      }
    });
    return result;
  };

  this.deleteFeatures = function () {
    coldFeatures.splice(0, coldFeatures.length);
    updateSource();
  };

  this.addFeatures = function (features) {
    features.forEach((feature) => {
      feature.properties.geoHubId = storeFeatureId++;
      coldFeatures.push(feature);
    });
    updateSource();
  };

  this.removeFeatures = function (idToRemove) {
    let selectedIdIndex = -1;
    coldFeatures.forEach((element, index) => {
      if (element.properties.geoHubId === idToRemove) {
        selectedIdIndex = index;
      }
    });
    const removedFeatures = [];
    if (selectedIdIndex !== -1) {
      removedFeatures.push(...coldFeatures.splice(selectedIdIndex, 1));
    }
    updateSource();
    return removedFeatures;
  };
};
