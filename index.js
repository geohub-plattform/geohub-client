const events = require("./src/events");
const pointindex = require("./src/pointindex");
const Constants = require("./src/constants");
const ui = require("./src/ui");
const combineFeatures = require("./src/combine_features");
const createPolygon = require("./src/create_polygon");
const theme = require("./src/theme");
const SelectMode = require("./src/mode_select");
const DrawMode = require("./src/mode_draw");
const CutMode = require("./src/mode_cut");
const doubleClickZoom = require("./src/double_click_zoom");
const userData = require("./src/user_data");
const ColdFeaturesStore = require("./src/cold_features_store");
const zoomInFeatures = require("./src/zoom_in_features");
const snackbar = require("./src/snackbar");
const groupFeatures = require("./src/group_features");
const ungroupFeatures = require("./src/ungroup_features");
const moveFeatures = require("./src/move_features");
const editor = require("./src/editor");
const dragAndDrop = require("./src/drap_and_drop");
const fileUtils = require("./src/file_utils");
const eventBux = require("eventbusjs");
const selectStore = require("./src/select_store");

const defaultOptions = {
  snapToFeatures : true,
  routing : true
};

const setupGeoHub = function (options = defaultOptions, api) {
  const ctx = {
    options: options
  };
  ctx.api = api;
  ctx.internalApi = {};
  ctx.ui = ui(ctx);
  ctx.snackbar = snackbar();
  ctx.pointindex = pointindex(ctx);
  ctx.events = events(ctx);
  ctx.featuresStore = new ColdFeaturesStore(ctx);
  ctx.editor = editor(ctx);
  ctx.dragAndDrop = dragAndDrop(ctx);
  ctx.fileUtils = fileUtils(ctx);
  ctx.eventBus = eventBux;
  ctx.selectStore = selectStore(ctx);

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
    ctx.modes.push(new SelectMode(ctx), new DrawMode(ctx), new CutMode(ctx));

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

  ctx.userData = userData(ctx);

  api.addData = ctx.pointindex.addData;
  api.addOverpassData = ctx.pointindex.addOverpassData;
  api.addUserData = ctx.userData.addUserData;

  ctx.internalApi.addUserData = ctx.pointindex.addUserData;

  ctx.internalApi.deleteSnapData = ctx.pointindex.deleteSnapData;
  ctx.internalApi.featuresAt = ctx.pointindex.featuresAt;
  ctx.internalApi.userFeaturesAt = ctx.pointindex.userFeaturesAt;
  ctx.internalApi.getRouteFromTo = ctx.pointindex.getRouteFromTo;
  ctx.internalApi.addFeaturesToMesh = ctx.pointindex.addFeaturesToMesh;
  ctx.internalApi.splitSegmentAtPoint = ctx.pointindex.splitSegmentAtPoint;
  ctx.internalApi.zoomInFeatures = zoomInFeatures(ctx);
  ctx.internalApi.combineFeatures = combineFeatures(ctx);
  ctx.internalApi.groupFeatures = groupFeatures(ctx);
  ctx.internalApi.ungroupFeatures = ungroupFeatures(ctx);
  ctx.internalApi.createPolygon = createPolygon(ctx);
  ctx.internalApi.moveFeatures = moveFeatures(ctx);
  return api;
};

module.exports = function (options) {
  setupGeoHub(options, this);
};
