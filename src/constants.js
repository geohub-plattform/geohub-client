module.exports = {
  classes: {
    PREDEFINED_CONTROL_BASE: 'mapboxgl-ctrl',
    PREDEFINED_CONTROL_GROUP: 'mapboxgl-ctrl-group',
    CONTROL_PREFIX: 'mapboxgl-ctrl-',
    ACTION_BUTTON: 'geohub-action-btn',
    CONTROL_BUTTON: 'mapbox-gl-draw_ctrl-draw-btn',
    CONTROL_BUTTON_LINE: 'mapbox-gl-draw_line',
    CONTROL_BUTTON_POLYGON: 'mapbox-gl-draw_polygon',
    CONTROL_BUTTON_POINT: 'mapbox-gl-draw_point',
    CONTROL_BUTTON_DELETE: 'geohub-delete-data',
    CONTROL_BUTTON_COMBINE_FEATURES: 'mapbox-gl-draw_combine',
    CONTROL_BUTTON_UNCOMBINE_FEATURES: 'mapbox-gl-draw_uncombine',
    CONTROL_BUTTON_DOWNLOAD: 'geohub-download',
    CONTROL_BUTTON_EDIT: 'geohub-edit',
    CONTROL_BUTTON_CUT: 'geohub-cut',
    CONTROL_BUTTON_SELECT: 'geohub-select',
    CONTROL_BUTTON_DOWNLOAD_DATA: 'geohub-download-data',
    CONTROL_BUTTON_SAVE: 'geohub-save',
    CONTROL_BUTTON_SAVE_AS_GIST: 'geohub-save-as-gist',
    CONTROL_BUTTON_SAVE_AS_GEOJSON: 'geohub-save-as-geojson',
    CONTROL_BUTTON_SAVE_AS_KML: 'geohub-save-as-kml',
    CONTROL_BUTTON_LOAD_DATA: 'geohub-load-data',
    CONTROL_GROUP: 'geohub-ctrl-group',
    DROPDOWN_GROUP: 'geohub-dropdown-group',
    DIVIDER: 'geohub-divider',
    ACTION_GROUP: 'geohub-action-group',
    ATTRIBUTION: 'mapboxgl-ctrl-attrib',
    ACTIVE_BUTTON: 'active',
    BOX_SELECT: 'mapbox-gl-draw_boxselect'
  },
  sources: {
    DEBUG: 'geohub-draw-debug',
    SELECT_HELPER: 'geohub-draw-select-helper',
    SELECT: 'geohub-draw-select',
    SNAP: 'geohub-draw-snap',
    HOT: 'geohub-draw-hot',
    COLD: 'geohub-draw-cold',
    BASE: 'geohub-snap-basis'
  },
  layers: {
    BASE: 'geohub-snap-basis',
  },
  cursors: {
    ADD: 'add',
    MOVE: 'move',
    DRAG: 'drag',
    POINTER: 'pointer',
    NONE: 'none'
  },
  types: {
    POLYGON: 'polygon',
    LINE: 'line_string',
    POINT: 'point'
  },
  geojsonTypes: {
    FEATURE: 'Feature',
    POLYGON: 'Polygon',
    LINE_STRING: 'LineString',
    POINT: 'Point',
    FEATURE_COLLECTION: 'FeatureCollection',
    MULTI_PREFIX: 'Multi',
    MULTI_POINT: 'MultiPoint',
    MULTI_LINE_STRING: 'MultiLineString',
    MULTI_POLYGON: 'MultiPolygon'
  },
  modes: {
    DRAW: 'draw',
    CUT: 'cut',
    SELECT: 'select',
    DELETE: 'delete'
  },
  events: {
    CREATE: 'draw.create',
    DELETE: 'draw.delete',
    UPDATE: 'draw.update',
    SELECTION_CHANGE: 'draw.selectionchange',
    MODE_CHANGE: 'draw.modechange',
    ACTIONABLE: 'draw.actionable',
    RENDER: 'draw.render',
    COMBINE_FEATURES: 'draw.combine',
    UNCOMBINE_FEATURES: 'draw.uncombine'
  },
  updateActions: {
    MOVE: 'move',
    CHANGE_COORDINATES: 'change_coordinates'
  },
  meta: {
    FEATURE: 'feature',
    MIDPOINT: 'midpoint',
    VERTEX: 'vertex'
  },
  activeStates: {
    ACTIVE: 'true',
    INACTIVE: 'false'
  },
  LAT_MIN: -90,
  LAT_RENDERED_MIN: -85,
  LAT_MAX: 90,
  LAT_RENDERED_MAX: 85,
  LNG_MIN: -270,
  LNG_MAX: 270,
  MIN_SEGMENT_LENGTH: 0.000001,
  MIN_DISTANCE: 0.00001 // 0.000001
};
