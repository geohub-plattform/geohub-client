import Constants from "./constants";
import turf from "@turf/turf";

const overpassApi = require("./overpass_api");
const exportFile = require("./export_file");
const jQuery = require("jquery");
const gistApi = require("./gist_api");

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
    const buttonOptions = ctx.ui.getButtonOptions();

    let keyHandled = false;
    Object.keys(buttonOptions).forEach((buttonId) => {
      const option = buttonOptions[buttonId];
      if (option.key && option.key === event.key) {
        option.button.click();
        keyHandled = true;
      }
    });
    console.log("key handled: ", keyHandled);
    if (!keyHandled) {
      switch (event.code) {
        case "Home" : {
          ctx.internalApi.moveFeatures(1);
          break;
        }
        case "End" : {
          ctx.internalApi.moveFeatures(-1);
          break;
        }
        case "Delete": {
          if (ctx.mode === Constants.modes.SELECT) {
            if (ctx.selectStore.hasSelection()) {
              ctx.selectStore.clearSelection();
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
    const dropdownGroup = jQuery('.geohub-dropdown-group');
    if (dropdownGroup.css('display') === 'none') {
      dropdownGroup.show();
    } else {
      dropdownGroup.hide();
    }
  }

  function getFeaturesForSave() {
    if (ctx.selectStore.hasSelection()) {
      return turf.featureCollection(ctx.selectStore.getFeatures());
    } else {
      return turf.featureCollection(ctx.featuresStore.getColdFeatures());
    }
  }

  function handleSaveAsGistButton() {
    gistApi.saveGist(getFeaturesForSave(), (gistUrl) => {
      const gistModal = jQuery("#gistModal");
      const inputField = jQuery("#gistUrl");
      jQuery("#gistModalLabel").text("Als Gist gespeichert");
      gistModal.on("shown.bs.modal", () => {
        inputField.focus().val(gistUrl);
      });
      gistModal.find(".btn-primary").hide();
      gistModal.modal();
    });
  }

  function handleSaveAsGeojsonButton() {
    exportFile.asGeojson(getFeaturesForSave());
  }

  function handleSaveAsKmlButton() {
    exportFile.asKml(getFeaturesForSave());
  }

  function handleExpandEditorButton() {
    const editorContainer = jQuery('#editor');
    if (editorContainer.hasClass('expanded')) {
      editorContainer.removeClass('expanded');
      editorContainer.hide();
      ctx.editor.hideEditor();
    } else {
      editorContainer.addClass('expanded');
      editorContainer.show();
      ctx.editor.renderEditor();
    }
    ctx.map.resize();
  }

  function handleLoadDataButton() {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('multiple', 'multiple');
    input.addEventListener('change', handleSelection, false);
    input.click();

    function handleSelection(event) {
      const files = [];
      for (let x = 0; x < event.target.files.length; x++) {
        files.push(event.target.files[x]);
      }
      ctx.fileUtils.processFiles(files, ctx.api.addUserData);
    }
  }

  function handleLoadFromGist() {
    const gistModal = jQuery("#gistModal");
    const inputField = jQuery("#gistUrl");
    jQuery("#gistModalLabel").text("Von Gist laden");
    gistModal.on("shown.bs.modal", () => {
      inputField.focus();
    });
    gistModal.on("hide.bs.modal", () => {
      gistModal.find(".btn-primary").off("click");
    });
    gistModal.find(".btn-primary").show().text("Laden").on("click", () => {
      const urlMatcher = new RegExp(".*://gist.github.com/(.*/)?(.*)", "i").exec(inputField.val());
      if (urlMatcher) {
        const gistId = urlMatcher[2];
        gistApi.loadGist(gistId, (content) => {
          ctx.api.addUserData(content);
          gistModal.modal('hide');
          ctx.internalApi.zoomInFeatures();
        });
      } else {
        ctx.snackbar("Gist URL ungültig");
        gistModal.modal('hide');
      }
    });
    gistModal.modal();
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

  function deleteUserData() {
    // finish current mode
    ctx.featuresStore.deleteFeatures();
    ctx.hotFeature = null;
    ctx.snapFeature = null;
    ctx.selectStore.clearSelection();
    ctx.lastClick = null;
    ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
    ctx.map.getSource(Constants.sources.HOT).setData(turf.featureCollection([]));
  }

  function addSelectedFeaturesToSnapGrid() {
    if (ctx.selectStore.hasSelection()) {
      ctx.internalApi.addFeaturesToMesh(ctx.selectStore.getFeatures());
    }
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
    handleSaveButton,
    handleSaveAsGistButton,
    handleSaveAsGeojsonButton,
    handleSaveAsKmlButton,
    handleExpandEditorButton,
    handleLoadDataButton,
    deleteUserData,
    addSelectedFeaturesToSnapGrid,
    handleLoadFromGist
  };
};
