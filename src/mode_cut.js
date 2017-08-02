const Constants = require("./constants");
const turf = require("@turf/turf");
const closestPoints = require("./closest_points");

module.exports = function (ctx) {

  this.canHandle = function (modeName) {
    return Constants.modes.CUT === modeName;
  };

  this.handleMove = function (event) {
    const button = event.originalEvent.buttons !== undefined ? event.originalEvent.buttons : event.originalEvent.which;
    if (button === 1) {
      return;
    }
    const evtCoords = [event.lngLat.lng, event.lngLat.lat];
    let snapFeature = null;
    ctx.closestPoint = null;
    const calculatedRadius = 0.005 * Math.pow(2, Math.max(1, 19 - ctx.map.getZoom()));
    const radiusInKm = Math.min(1.0, Math.max(0.005, calculatedRadius));
    const nearFeatures = ctx.api.userFeaturesAt(event.lngLat);
    if (nearFeatures) {
      const closestPoint = closestPoints.findClosestPoint(nearFeatures, evtCoords, radiusInKm);
      if (closestPoint) {
        ctx.closestPoint = closestPoint;
        snapFeature = turf.point(closestPoint.coords);
      }
    }

    ctx.snapFeature = snapFeature;
    if (snapFeature) {
      ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([snapFeature]));
    } else {
      ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
    }
  };

  this.handleClick = function (event) {
    console.log("ctx.closestPoint :", ctx.closestPoint);
    if (ctx.closestPoint && ctx.closestPoint.geoHubId) {

      const clickedFeature = ctx.featuresStore.removeFeatures(ctx.closestPoint.geoHubId);
      if (clickedFeature.length === 1) {
        console.log("clickedFeature: ", JSON.stringify(turf.featureCollection(clickedFeature)));

        const cutPoint = turf.point(ctx.closestPoint.coords);
        const truncatedCutPoint = turf.truncate(cutPoint, 7); // turf issue

        console.log("line to cut: ", clickedFeature[0].geometry.coordinates);
        console.log("cut point: ", cutPoint.geometry.coordinates, " truncated: ", truncatedCutPoint.geometry.coordinates);
        const newLineStrings = turf.lineSplit(clickedFeature[0], truncatedCutPoint);
        // TODO copy properties on both parts
        console.log("new lines:", newLineStrings);
        ctx.featuresStore.addFeatures(newLineStrings.features);
      }
    }
  };

  this.activate = function () {
    ctx.container.classList.add("mouse-add");
  };

  this.deactivate = function () {
  };
};
