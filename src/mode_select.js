const Constants = require("./constants");
const turf = require("@turf/turf");

module.exports = function (ctx) {

  this.canHandle = function (modeName) {
    return Constants.modes.SELECT === modeName;
  };

  this.selectFeature = function (selectedFeatureId) {
    if (ctx.lastKnownSelectIds.indexOf(selectedFeatureId) === -1) {
      ctx.lastKnownSelectIds.push(selectedFeatureId);
    }
    if (ctx.selectedFeatures) {
      ctx.selectedFeatures.forEach((feature) => {
        if (selectedFeatureId === feature.properties.geoHubId) {
          // wenn ausgewählt, dann nicht mehr hinzufügen oder togglen
        }
      });
    } else {
      ctx.selectedFeatures = [];
    }

    const removedFeatures = ctx.featuresStore.removeFeatures(selectedFeatureId);
    ctx.selectedFeatures.push(...removedFeatures);
    const points = [];
    ctx.selectedFeatures.forEach((feature) => {
      turf.coordEach(feature, (pointCoords) => {
        points.push(turf.point(pointCoords, {geoHubId: feature.properties.geoHubId}));
      });
    });
    ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection(ctx.selectedFeatures));
  };

  this.deselectCurrentFeature = function () {
    if (ctx.selectedFeatures) {
      ctx.featuresStore.addFeatures(ctx.selectedFeatures);
      ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection([]));
      ctx.selectedFeatures = null;
    }
  };

  this.handleMove = function (event) {
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
