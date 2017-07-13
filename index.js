const events = require("./src/events");
const pointindex = require("./src/pointindex");
const Constants = require("./src/constants");
const ui = require("./src/ui");

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
    ctx.mode = Constants.modes.DIRECT_SELECT;
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
        'circle-radius': 3,
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
      'source': Constants.sources.COLD,
      'id': 'geohub-fill-cold',
      'type': 'fill',
      'layout': {},
      'filter': ["==", "$type", "Polygon"],
      'paint': {
        'fill-color': '#ff0015',
        'fill-opacity': 0.4
      }
    });
    ctx.map.addLayer({
      'source': Constants.sources.COLD,
      'id': 'geohub-point-cold',
      'type': 'symbol',
      'filter': ["==", "$type", "Point"],
      'layout': {
        'icon-image': 'location',
        'icon-offset': [0, -12]
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
      'source': Constants.sources.SELECT,
      'id': 'geohub-line-select',
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
    ctx.map.addLayer({
      'source': Constants.sources.SELECT,
      'id': 'geohub-fill-select',
      'type': 'fill',
      'layout': {},
      'filter': ["==", "$type", "Polygon"],
      'paint': {
        'fill-color': '#D0981F',
        'fill-opacity': 0.4
      }
    });
    ctx.map.addLayer({
      'source': Constants.sources.SELECT,
      'id': 'geohub-arrow-select',
      'type': 'symbol',
      'layout': {
        'icon-image': 'arrow',
        'symbol-placement': 'line',
        'icon-rotate': 180,
        'icon-offset': [0, 0]
      }
    });
    ctx.map.addLayer({
      'source': Constants.sources.SELECT_HELPER,
      'id': 'geohub-point-select-helper',
      'type': 'circle',
      'paint': {
        'circle-radius': 5,
        'circle-color': '#fff',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#d0981f'
      }
    });

    return ctx.ui.addButtons();
  };
  api.onRemove = function () {
    console.log("onRemove");
    ctx.events.removeEventListeners(ctx.map);
    if (ctx.map.getLayer('geohub-line-active') !== undefined) {
      ctx.map.removeLayer('geohub-line-active');
    }
  };
  api.addData = ctx.pointindex.addData;
  api.addOverpassData = ctx.pointindex.addOverpassData;
  api.addUserData = ctx.pointindex.addUserData;
  api.featuresAt = ctx.pointindex.featuresAt;
  api.userFeaturesAt = ctx.pointindex.userFeaturesAt;
  api.getRouteFromTo = ctx.pointindex.getRouteFromTo;
  api.getRouteLength = ctx.pointindex.getRouteLength;
  api.addFeaturesToMesh = ctx.pointindex.addFeaturesToMesh;
  api.splitSegmentAtPoint = ctx.pointindex.splitSegmentAtPoint;
  api.options = options;

  return api;
};

module.exports = function (options) {
  setupGeoHub(options, this);
};
