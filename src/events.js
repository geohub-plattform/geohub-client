import Constants from "./constants";
import turf from "@turf/turf";
import togeojson from "@mapbox/togeojson";
const overpassApi = require("./overpass_api");
const exportFile = require("./export_file");

module.exports = function (ctx) {

  const mouseMove = function (event) {
    ctx.lastMouseEvent = event;
    ctx.currentMode.handleMove(event);
  };

  const mouseClick = function (event) {
    ctx.currentMode.handleClick(event);
  };

  const keypress = function (event) {
    console.log("keycode: ", event.keyCode, " => ", event.key, " | Code: ", event.code);
    switch (event.code) {
      case "KeyD": {
        if (ctx.debug) {
          console.log("Debug: ", JSON.stringify(ctx.debug));
        }
        break;
      }
      case "KeyP": {
        if (ctx.coldFeatures) {
          console.log("coldFeatures: ", JSON.stringify(turf.featureCollection(ctx.coldFeatures)));
        }
        break;
      }
      case "Delete": {
        if (ctx.mode === Constants.modes.SELECT) {
          if (ctx.selectedFeatures) {
            ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection([]));
            ctx.map.getSource(Constants.sources.SELECT_HELPER).setData(turf.featureCollection([]));
            ctx.selectedFeatures = null;
          }
        } else if (ctx.mode === Constants.modes.DRAW) {
          if (ctx.hotFeature) {
            const coords = ctx.hotFeature.geometry.coordinates;
            if (coords.length > 1) {
              coords.splice(coords.length - 1, 1);
              ctx.lastClick = {coords: coords[coords.length - 1]};
              if (coords.length > 0) {
                ctx.snapFeature = turf.point(coords[coords.length - 1]);
              } else {
                ctx.snapFeature = null;
              }
              if (coords.length > 1) {
                ctx.map.getSource(Constants.sources.HOT).setData(turf.featureCollection([ctx.hotFeature]));
              } else {
                ctx.hotFeature = null;
                ctx.map.getSource(Constants.sources.HOT).setData(turf.featureCollection([]));
              }
            }
            if (ctx.lastMouseEvent) {
              mouseMove(ctx.lastMouseEvent);
            }
          } else if (ctx.snapFeature) {
            ctx.snapFeature = null;
            ctx.lastClick = null;
            ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
          }
        }
        break;
      }
    }
  };

  function handleWaysDownloadButton() {
    console.log("Downloading ", ctx.map.getBounds());
    overpassApi.loadWays(ctx.map.getBounds(), (result) => {
      console.log("Data downloaded");
      const geojson = overpassApi.convertFromOverpassToGeojson(result);
      console.log("Data adding to map");
      ctx.api.addData(geojson);
    });
  }

  function handleBuildingsDownloadButton() {
    console.log("Downloading ", ctx.map.getBounds());
    overpassApi.loadBuildings(ctx.map.getBounds(), (result) => {
      console.log("Data downloaded");
      const geojson = overpassApi.convertFromOverpassToGeojson(result);
      console.log("Data adding to map");
      ctx.api.addData(geojson);
    });
  }

  function handleSaveButton() {
    const dropdownGroup = $('.geohub-dropdown-group');
    if (dropdownGroup.css('display') == 'none') {
      dropdownGroup.show();
    } else {
      dropdownGroup.hide();
    }
  }

  function handleSaveAsGistButton() {
    const file = turf.featureCollection(ctx.coldFeatures);
    exportFile.asGist(file);
  }

  function handleSaveAsGeojsonButton() {
    const file = turf.featureCollection(ctx.coldFeatures);
    exportFile.asGeojson(file);
  }

  function handleSaveAsKmlButton() {
    const file = turf.featureCollection(ctx.coldFeatures);
    exportFile.asKml(file);
  }

  function stringToDOM(str) {
    const parser = new DOMParser();
    return parser.parseFromString(str, "text/xml");
  }

  function handleLoadDataButton() {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('multiple', 'multiple');
    input.addEventListener('change', handleSelection, false);
    input.click();
    function handleSelection(event) {
      const files = event.target.files;
      const names = input.files;
      for (var i = 0, f; f = files[i]; i++) {
        const ext = names[i].name.substring(names[i].name.lastIndexOf('.') + 1, names[i].name.length).toLowerCase();
        const reader = new FileReader();
        reader.onload = (function (file) {
          return function (e) {
            if (ext === 'geojson' || ext === 'json') {
              ctx.api.addUserData(JSON.parse(e.target.result));
            } else if (ext === 'kml') {
              var geojson = togeojson.kml(stringToDOM(e.target.result));
              ctx.api.addUserData(geojson);
            } else if (ext === 'gpx') {
              var geojson = togeojson.gpx(stringToDOM(e.target.result));
              ctx.api.addUserData(geojson);
            } else {
              alert(`unsupported file extension: ${ext}`);
            }
          };
        })(f);
        reader.readAsText(f);
      }
    }
  }

  function changeMode(modeName) {
    console.log("New mode", modeName);
    ctx.mode = modeName;
    if (ctx.currentMode) {
      ctx.currentMode.deactivate();
    }

    const classesToRemove = [];
    ctx.container.classList.forEach((className) => {
      if (className.indexOf("mouse-") !== -1) {
        classesToRemove.push(className);
      }
    });
    if (classesToRemove.length > 0) {
      ctx.container.classList.remove(...classesToRemove);
    }

    let nextMode = null;
    ctx.modes.forEach((mode) => {
      if (mode.canHandle(modeName)) {
        nextMode = mode;
      }
    });
    if (nextMode) {
      nextMode.activate();
      ctx.currentMode = nextMode;
    }
    console.log("class list container: ", ctx.container.classList);
  }

  function combineFeatures() {
    ctx.api.combineFeatures();

  }

  function deleteUserData() {
    // finish current mode
    ctx.coldFeatures = [];
    ctx.hotFeature = null;
    ctx.snapFeature = null;
    ctx.selectedFeatures = null;
    ctx.lastClick = null;
    ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
    ctx.map.getSource(Constants.sources.COLD).setData(turf.featureCollection(ctx.coldFeatures));
    ctx.map.getSource(Constants.sources.HOT).setData(turf.featureCollection([]));
    ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection([]));
    ctx.map.getSource(Constants.sources.SELECT_HELPER).setData(turf.featureCollection([]));
  }

  return {
    addEventListeners: function (map) {
      map.on("mousemove", mouseMove);
      map.on('click', mouseClick);
      const container = map.getContainer();
      container.addEventListener('keydown', keypress);

    },
    removeEventListeners: function (map) {
      map.off("mousemove", mouseMove);
      map.off('click', mouseClick);
      const container = map.getContainer();
      container.removeEventListener('keydown', keypress);

    },
    handleWaysDownloadButton,
    handleBuildingsDownloadButton,
    changeMode,
    combineFeatures,
    handleSaveButton,
    handleSaveAsGistButton,
    handleSaveAsGeojsonButton,
    handleSaveAsKmlButton,
    handleLoadDataButton,
    deleteUserData
  };
};
