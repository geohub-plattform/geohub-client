const events = require("./src/events");
const pointindex = require("./src/pointindex");
import Constants from "./src/constants";
import FeatureIndex from "./src/feature_index";

const setupGeoHub = function (options = {}, api) {
  const ctx = {
    options: options
  };
  ctx.api = api;
  ctx.pointindex = pointindex(ctx);
  ctx.events = events(ctx);
  ctx.coldFeatures = [];
  ctx.featureIndex = new FeatureIndex();

  api.onAdd = function (map) {
    console.log("onAdd");
    ctx.map = map;
    ctx.container = map.getContainer();
    ctx.container.classList.add("mouse-add");
    ctx.events.addEventListeners(map);
    Object.keys(Constants.sources).forEach((key) => {
      ctx.map.addSource(Constants.sources[key], {
        data: {
          type: Constants.geojsonTypes.FEATURE_COLLECTION,
          features: []
        },
        type: 'geojson'
      });
    });
    ctx.map.addLayer({
      id: Constants.layers.BASE,
      source: Constants.sources.BASE,
      type: "line",
      paint: {
        "line-color": "#888",
        "line-width": 2,
        "line-opacity": 0.3
      }
    });
    ctx.map.addLayer({
      id: "geohub-snap-layer-circle",
      source: Constants.sources.BASE,
      'type': 'circle',
      'paint': {
        'circle-radius': 5,
        'circle-color': '#888'
      }
    });
    ctx.map.addLayer({
      'source': Constants.sources.COLD,
      'id': 'geohub-line-cold',
      'type': 'line',
      'layout': {
        'line-cap': 'round',
        'line-join': 'round'
      },
      'paint': {
        'line-color': '#ff0015',
        'line-width': 2
      }
    });
    ctx.map.addLayer({
      'source': Constants.sources.HOT,
      'id': 'geohub-line-hot',
      'type': 'line',
      'layout': {
        'line-cap': 'round',
        'line-join': 'round'
      },
      'paint': {
        'line-color': '#0000ff',
        'line-width': 2
      }
    });
    ctx.map.addLayer({
      'source': Constants.sources.SNAP,
      'id': 'geohub-point-active',
      'type': 'circle',
      'paint': {
        'circle-radius': 5,
        'circle-color': '#3bb2d0'
      }
    });
    ctx.map.addLayer({
      'source': Constants.sources.SNAP,
      'id': 'geohub-line-active',
      'type': 'line',
      'layout': {
        'line-cap': 'round',
        'line-join': 'round'
      },
      'paint': {
        'line-color': '#3bb2d0',
        'line-width': 2
      }
    });
    ctx.map.addLayer({
      'source': Constants.sources.DEBUG,
      'id': 'geohub-point-debug',
      'type': 'circle',
      'paint': {
        'circle-radius': 5,
        'circle-color': '#d0981f'
      }
    });
    ctx.map.addLayer({
      'source': Constants.sources.DEBUG,
      'id': 'geohub-line-debug',
      'type': 'line',
      'layout': {
        'line-cap': 'round',
        'line-join': 'round'
      },
      'paint': {
        'line-color': '#D0981F',
        'line-width': 2
      }
    });
    return document.createElement('div');
  };
  api.onRemove = function () {
    console.log("onRemove");
    ctx.events.removeEventListeners(ctx.map);
    if (ctx.map.getLayer('geohub-line-active') !== undefined) {
      ctx.map.removeLayer('geohub-line-active');
    }
  };
  api.addData = ctx.pointindex.addData;
  api.featuresAt = ctx.pointindex.featuresAt;
  api.getRouteFromTo = ctx.pointindex.getRouteFromTo;
  api.getRouteLength = ctx.pointindex.getRouteLength;
  api.addFeatureToIndex = ctx.pointindex.addFeatureToIndex;
  api.addFeaturesToMesh = ctx.pointindex.addFeaturesToMesh;
  api.options = options;

  return api;
};

module.exports = function (options) {
  setupGeoHub(options, this);
};
