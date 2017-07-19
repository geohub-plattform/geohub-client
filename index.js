const events = require("./src/events");
const pointindex = require("./src/pointindex");
const Constants = require("./src/constants");
const ui = require("./src/ui");
const combineFeatures = require("./src/combine_features");
const theme = require("./src/theme");
const SelectMode = require("./src/mode_select");
const DrawMode = require("./src/mode_draw");
const doubleClickZoom = require("./src/double_click_zoom");

const defaultOptions = {
  controls: {
    point: false,
    line_string: false,
    polygon: false,
    trash: false,
    combine_features: false,
    uncombine_features: false
  }
};

const setupGeoHub = function (options = defaultOptions, api) {
  const ctx = {
    options: options
  };
  ctx.api = api;
  ctx.geoHubIdCounter = 1;
  ctx.ui = ui(ctx);
  ctx.pointindex = pointindex(ctx);
  ctx.events = events(ctx);
  ctx.coldFeatures = [];

  api.onAdd = function (map) {
    console.log("onAdd");
    map.loadImage("../dist/ic_edit_location_black_24dp_1x.png", (error, image) => {
      map.addImage("location", image);
    });
    map.loadImage("../dist/arrow_color.png", (error, image) => {
      map.addImage("arrow", image);
    });
    ctx.map = map;
    ctx.container = map.getContainer();
    ctx.modes = [];
    ctx.modes.push(new SelectMode(ctx), new DrawMode(ctx));

    const buttons = ctx.ui.addButtons();
    ctx.events.addEventListeners(map);
    ctx.events.changeMode(Constants.modes.SELECT);
    ctx.ui.setActiveButton("select");

    Object.keys(Constants.sources).forEach((key) => {
      ctx.map.addSource(Constants.sources[key], {
        data: {
          type: Constants.geojsonTypes.FEATURE_COLLECTION,
          features: []
        },
        type: 'geojson'
      });
    });
    theme.forEach((layer) => {
      ctx.map.addLayer(layer);
    });
    doubleClickZoom.disable(ctx.map);
    return buttons;
  };
  api.onRemove = function () {
    console.log("onRemove");
    ctx.events.removeEventListeners(ctx.map);
    if (ctx.map.getLayer('geohub-line-active') !== undefined) {
      ctx.map.removeLayer('geohub-line-active');
    }
    doubleClickZoom.enable(ctx.map);
  };
  api.addData = ctx.pointindex.addData;
  api.addOverpassData = ctx.pointindex.addOverpassData;
  api.addUserData = ctx.pointindex.addUserData;
  api.deleteSnapData = ctx.pointindex.deleteSnapData;
  api.featuresAt = ctx.pointindex.featuresAt;
  api.userFeaturesAt = ctx.pointindex.userFeaturesAt;
  api.getRouteFromTo = ctx.pointindex.getRouteFromTo;
  api.getRouteLength = ctx.pointindex.getRouteLength;
  api.addFeaturesToMesh = ctx.pointindex.addFeaturesToMesh;
  api.splitSegmentAtPoint = ctx.pointindex.splitSegmentAtPoint;
  api.options = options;
  api.combineFeatures = combineFeatures(ctx);
  return api;
};

module.exports = function (options) {
  setupGeoHub(options, this);
};
