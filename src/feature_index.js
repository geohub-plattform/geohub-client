import utils from "./utils";

/**
 *
 * @type {module.exports}
 */
const FeatureIndex = module.exports = function () {
  this.featureById = {};
  this.featureIdCounter = 0;
};

FeatureIndex.prototype.reset = function () {
  this.featureById = {};
  this.featureIdCounter = 0;
};

FeatureIndex.prototype.addFeatures = function (features) {
  const that = this;
  features.forEach((feature) => {
    that.featureById[that.featureIdCounter] = feature;
    utils.setProperty(feature, "geoHubId", that.featureIdCounter);
    that.featureIdCounter++;
  });
};

FeatureIndex.prototype.getFeaturesFromIndex = function (features) {
  const that = this;
  const result = [];
  features.forEach((feature) => {
    const id = feature.properties.geoHubId;
    const originalFeature = that.featureById[id];
    if (originalFeature !== undefined) {
      result.push(originalFeature);
    } else {
      console.error("no original feature for id ", id);
    }
  });
  return result;
};
