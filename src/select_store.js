const Constants = require("./constants");
const turf = require("@turf/turf");
const propertiesMerge = require("./properties_merge");

module.exports = function (ctx) {

  const selectedFeatures = [];
  const hiddenFeatures = [];

  function updateSources() {
    ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection(selectedFeatures));
    ctx.eventBus.dispatch("selection_changed", selectedFeatures);
  }

  function getFeatures() {
    return selectedFeatures;
  }

  function setFeatures(features) {
    if (features !== undefined && features !== null) {
      selectedFeatures.splice(0, selectedFeatures.length, ...features);
      updateSources();
    }
  }

  function getCommonGeometryType() {
    let allFeaturesType = null;
    selectedFeatures.forEach((feature) => {
      if (allFeaturesType === null) {
        allFeaturesType = feature.geometry.type;
      } else if (feature.geometry.type !== allFeaturesType) {
        allFeaturesType = "illegal";
      }
    });

    if (allFeaturesType === "illegal") {
      return null;
    } else {
      return allFeaturesType;
    }
  }

  function hasSelection() {
    return selectedFeatures.length > 0;
  }

  function hasSingleSelection() {
    return selectedFeatures.length === 1;
  }

  function forEach(handler) {
    selectedFeatures.forEach(handler);
  }

  function clearSelection() {
    selectedFeatures.splice(0, selectedFeatures.length);
    updateSources();
  }

  function getSelectedFeatureIds() {
    return selectedFeatures.map((feature) => {
      return feature.properties.geoHubId;
    });
  }

  function addFeatures(features) {
    selectedFeatures.push(...features);
    updateSources();
  }

  function hideFeatures() {
    if (hiddenFeatures.length > 0) {
      selectedFeatures.push(...hiddenFeatures);
      hiddenFeatures.splice(0, hiddenFeatures.length);
    } else if (hasSelection()) {
      hiddenFeatures.push(...selectedFeatures.splice(0, selectedFeatures.length));
    }
    updateSources();
  }

  function getMergedProperties() {
    return propertiesMerge(selectedFeatures);
  }

  function length() {
    return selectedFeatures.length;
  }

  function updateProperties(newProperties) {
    console.log("properties to save: ", JSON.stringify(newProperties));
    selectedFeatures.forEach((feature) => {
      const savedId = feature.properties.geoHubId;
      feature.properties = Object.assign({}, newProperties, {geoHubId: savedId});
    });
  }

  return {
    getSelectedFeatureIds,
    clearSelection,
    hasSelection,
    hasSingleSelection,
    getFeatures,
    setFeatures,
    addFeatures,
    hideFeatures,
    getCommonGeometryType,
    forEach,
    getMergedProperties,
    length,
    updateProperties
  };
};
