const Constants = require("./constants");

module.exports = [
  {
    id: Constants.layers.BASE,
    source: Constants.sources.BASE,
    type: "line",
    paint: {
      "line-color": "#888",
      "line-width": 2,
      "line-opacity": 0.3
    }
  },
  {
    id: "geohub-snap-layer-circle",
    source: Constants.sources.BASE,
    'type': 'circle',
    'paint': {
      'circle-radius': 3,
      'circle-color': '#888'
    }
  },
  {
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
  },
  {
    'source': Constants.sources.COLD,
    'id': 'geohub-fill-cold',
    'type': 'fill',
    'layout': {},
    'filter': ["==", "$type", "Polygon"],
    'paint': {
      'fill-color': '#ff0015',
      'fill-opacity': 0.4
    }
  },
  {
    'source': Constants.sources.COLD,
    'id': 'geohub-point-cold',
    'type': 'symbol',
    'filter': ["==", "$type", "Point"],
    'layout': {
      'icon-image': 'location',
      'icon-offset': [0, -12]
    }
  },
  {
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
  },
  {
    'source': Constants.sources.SNAP,
    'id': 'geohub-point-active',
    'type': 'circle',
    'paint': {
      'circle-radius': 5,
      'circle-color': '#3bb2d0'
    }
  },
  {
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
  },
  {
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
  },
  {
    'source': Constants.sources.SELECT,
    'id': 'geohub-fill-select',
    'type': 'fill',
    'layout': {},
    'filter': ["==", "$type", "Polygon"],
    'paint': {
      'fill-color': '#D0981F',
      'fill-opacity': 0.4
    }
  },
  {
    'source': Constants.sources.SELECT,
    'id': 'geohub-arrow-select',
    'type': 'symbol',
    'layout': {
      'icon-image': 'arrow',
      'symbol-placement': 'line',
      'icon-rotate': 180,
      'icon-offset': [0, 0]
    }
  },
  {
    'source': Constants.sources.SELECT_HELPER,
    'id': 'geohub-point-select-helper',
    'type': 'circle',
    'paint': {
      'circle-radius': 5,
      'circle-color': '#fff',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#d0981f'
    }
  }
];

