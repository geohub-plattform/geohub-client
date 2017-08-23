const Constants = require("./constants");

module.exports = function (ctx) {

  this.canHandle = function (modeName) {
    return Constants.modes.SELECT === modeName;
  };

  this.selectFeature = function (selectedFeatureId) {
    if (ctx.lastKnownSelectIds.indexOf(selectedFeatureId) === -1) {
      ctx.lastKnownSelectIds.push(selectedFeatureId);
    }
    if (ctx.selectStore.hasSelection()) {
      ctx.selectStore.forEach((feature) => {
        if (selectedFeatureId === feature.properties.geoHubId) {
          // wenn ausgewählt, dann nicht mehr hinzufügen oder togglen
        }
      });
    } else {
      ctx.selectStore.clearSelection();
    }

    const removedFeatures = ctx.featuresStore.removeFeatures(selectedFeatureId);
    ctx.selectStore.addFeatures(removedFeatures);
  };

  this.deselectCurrentFeature = function () {
    if (ctx.selectStore.hasSelection()) {
      ctx.featuresStore.addFeatures(ctx.selectStore.getFeatures());
      ctx.selectStore.clearSelection();
    }
  };

  this.handleMove = function (event) {
    // empty handler, keep it
  };

  this.handleClick = function (event) {
    const multipleSelect = event.originalEvent.shiftKey;
    const nearFeatures = ctx.internalApi.userFeaturesAt(event.lngLat);
    console.log("nearFeatures: ", nearFeatures.length);

    if (nearFeatures.length > 0) {
      nearFeatures.forEach((element) => {
        console.log("nearFeature: ", element);
      });
      if (ctx.lastKnownSelectIds === undefined) {
        ctx.lastKnownSelectIds = [];
      }

      if (nearFeatures.length >= ctx.lastKnownSelectIds.length) {
        // remove old IDs
        ctx.lastKnownSelectIds.splice(0, nearFeatures.length - ctx.lastKnownSelectIds.length + 1);
      }

      let selectedGeoHubId = nearFeatures[0].properties.geoHubId;
      if (nearFeatures.length > 1) {
        nearFeatures.forEach((nearFeature) => {
          const nearFeatureId = nearFeature.properties.geoHubId;
          if (ctx.lastKnownSelectIds.indexOf(nearFeatureId) === -1) {
            selectedGeoHubId = nearFeatureId;
          }
        });
      }
      if (!multipleSelect) {
        this.deselectCurrentFeature();
      }
      this.selectFeature(selectedGeoHubId);
    } else if (!multipleSelect) {
      ctx.lastKnownSelectIds = [];
      this.deselectCurrentFeature();
    }
  };

  this.activate = function () {
    ctx.container.classList.add("mouse-pointer");
  };

  this.deactivate = function () {
    this.deselectCurrentFeature();
  };
};
