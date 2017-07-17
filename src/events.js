import Constants from "./constants";
import turf from "@turf/turf";
import doubleClickZoom from "./double_click_zoom";
import utils from "./utils";
import togeojson from "@mapbox/togeojson";
const overpassApi = require("./overpass_api");
const closestPoints = require("./closest_points");
const exportFile = require("./export_file");

module.exports = function (ctx) {

  const mouseMove = function (event) {
    ctx.lastMouseEvent = event;
    if (ctx.mode === Constants.modes.DRAW) {
      const button = event.originalEvent.buttons !== undefined ? event.originalEvent.buttons : event.originalEvent.which;
      if (button === 1) {
        return;
      }
      const createLineToCurrentMouseMove = function (evtCoords) {
        ctx.closestPoint = null;
        if (ctx.lastClick) {
          return turf.lineString([ctx.lastClick.coords, evtCoords]);
        } else {
          return null;
        }
      };
      const calculateRoute = !event.originalEvent.altKey;
      const snapToPoint = !event.originalEvent.ctrlKey;
      const evtCoords = [event.lngLat.lng, event.lngLat.lat];
      let snapFeature = null;
      const debugFeatures = [];
      if (snapToPoint) {
        const calculatedRadius = 0.005 * Math.pow(2, Math.max(1, 19 - ctx.map.getZoom()));
        const radiusInKm = Math.min(1.0, Math.max(0.005, calculatedRadius));
        const nearFeatures = ctx.api.featuresAt(event.lngLat, radiusInKm);
        if (nearFeatures) {
          const closestPoint = closestPoints.findClosestPoint(nearFeatures, evtCoords, radiusInKm);
          if (closestPoint) {
            //utils.reducePrecision(closestPoint.coords);
            ctx.closestPoint = closestPoint;
            if (closestPoint.borders) {
              debugFeatures.push(turf.lineString([closestPoint.coords, closestPoint.borders.border1]));
              debugFeatures.push(turf.lineString([closestPoint.coords, closestPoint.borders.border2]));
            }
            if (ctx.lastClick) {
              const lastClickDistance = turf.distance(turf.point(evtCoords), turf.point(ctx.lastClick.coords));
              if (utils.isPointEqual(ctx.lastClick.coords, closestPoint.coords) && lastClickDistance > 0.002) {
                snapFeature = createLineToCurrentMouseMove(evtCoords);
              } else {
                const fromPoint = ctx.lastClick;
                if (calculateRoute) {
                  const route = ctx.api.getRouteFromTo(fromPoint, closestPoint);
                  if (route) {
                    ctx.debug = {
                      routeFrom: fromPoint.coords,
                      routeTo: closestPoint.coords,
                      length: route.length,
                      route: route
                    };
                    snapFeature = turf.lineString(route.path);
                  } else {
                    snapFeature = turf.lineString([fromPoint.coords, closestPoint.coords]);
                  }
                } else {
                  snapFeature = turf.lineString([fromPoint.coords, closestPoint.coords]);
                }
              }
            } else {
              snapFeature = turf.point(closestPoint.coords);
            }
          } else {
            snapFeature = createLineToCurrentMouseMove(evtCoords);
          }
        } else {
          snapFeature = createLineToCurrentMouseMove(evtCoords);
        }
      } else {
        snapFeature = createLineToCurrentMouseMove(evtCoords);
      }
      //ctx.map.getSource(Constants.sources.DEBUG).setData(turf.featureCollection(debugFeatures));
      ctx.snapFeature = snapFeature;
      if (snapFeature) {
        ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([snapFeature]));
      } else {
        ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
      }
    } else if (ctx.mode === Constants.modes.SELECT) {
      // highlight possible selects
    }
  };

  const addClickSegementsToMesh = function () {
    const meshFeatures = [];
    if (ctx.closestPoint && ctx.closestPoint.borders && ctx.closestPoint.geoHubId !== undefined) {
      console.log("adding mesh features");
      ctx.api.splitSegmentAtPoint(ctx.closestPoint.geoHubId, ctx.closestPoint.coords);
    }
    if (ctx.snapFeature) {
      if (ctx.snapFeature.geometry.type === "LineString") {
        if (!utils.isEmptyLineString(ctx.snapFeature)) {
          meshFeatures.push(ctx.snapFeature);
        }
      } else if (ctx.snapFeature.geometry.type === "Point") {
        meshFeatures.push(ctx.snapFeature);
      } else {
        console.log("known mesh feature: ", JSON.stringify(ctx.snapFeature));
      }
    }
    console.log("meshFeatures: ", JSON.stringify(meshFeatures));
    if (meshFeatures.length > 0) {
      ctx.api.addFeaturesToMesh(meshFeatures);
    }
  };

  const mouseClick = function (event) {
    if (ctx.mode === Constants.modes.DRAW) {
      let lastPoint = null;
      if (ctx.closestPoint) {
        lastPoint = ctx.closestPoint;
      } else {
        doubleClickZoom.disable(ctx);
        const evtCoords = [event.lngLat.lng, event.lngLat.lat];
        lastPoint = {coords: evtCoords};
      }
      if (!ctx.snapFeature) {
        ctx.snapFeature = turf.point(lastPoint.coords);
      }

      addClickSegementsToMesh();
      console.log("mouseClick, last point: ", lastPoint, "closestPoint: ", ctx.closestPoint);
      if (ctx.lastClick) {
        if (ctx.lastClick.coords[0] === lastPoint.coords[0] && ctx.lastClick.coords[1] === lastPoint.coords[1]) {
          // finish draw
          console.log("Finish draw");
          doubleClickZoom.enable(ctx);
          ctx.snapFeature = null;
          lastPoint = null;
          if (ctx.hotFeature) {
            if (utils.isPolygon(ctx.hotFeature)) {
              console.log("Convert to polygon");
              ctx.hotFeature.geometry.type = "Polygon";
              ctx.hotFeature.geometry.coordinates = [ctx.hotFeature.geometry.coordinates];
            }
            ctx.hotFeature.properties.geoHubId = ctx.geoHubIdCounter++;
            ctx.coldFeatures.push(ctx.hotFeature);
            ctx.hotFeature = null;
          } else {
            const hotFeature = turf.point(ctx.lastClick.coords, {geoHubId: ctx.geoHubIdCounter++});
            ctx.coldFeatures.push(hotFeature);
          }
          ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
          ctx.map.getSource(Constants.sources.HOT).setData(turf.featureCollection([]));
          ctx.map.getSource(Constants.sources.COLD).setData(turf.featureCollection(ctx.coldFeatures));
        }
      }

      if (ctx.snapFeature && ctx.snapFeature.geometry.type === "LineString") {
        const snapCoords = ctx.snapFeature.geometry.coordinates;
        console.log("current snap: ", snapCoords);
        if (snapCoords.length > 1) {
          let hotFeature = ctx.hotFeature;
          if (hotFeature) {
            const hotCoords = hotFeature.geometry.coordinates;
            hotCoords.splice(-1, 1, ...snapCoords);
          } else {
            hotFeature = turf.lineString(snapCoords);
            ctx.hotFeature = hotFeature;
          }
          ctx.snapFeature = null;
          ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
          ctx.map.getSource(Constants.sources.HOT).setData(turf.featureCollection([hotFeature]));
        }
      }
      ctx.lastClick = lastPoint;
    } else if (ctx.mode === Constants.modes.SELECT) {
      const multipleSelect = event.originalEvent.shiftKey;

      const nearFeatures = ctx.api.userFeaturesAt(event.lngLat);
      console.log("nearFeatures: ", nearFeatures.length);

      const deselectCurrentFeature = function () {
        if (ctx.selectedFeatures) {
          ctx.coldFeatures.push(...ctx.selectedFeatures);
          ctx.map.getSource(Constants.sources.COLD).setData(turf.featureCollection(ctx.coldFeatures));
          ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection([]));
          ctx.map.getSource(Constants.sources.SELECT_HELPER).setData(turf.featureCollection([]));
          ctx.selectedFeatures = null;
        }
      };

      const selectFeature = function (selectedFeatureId) {
        if (ctx.lastKnownSelectIds.indexOf(selectedFeatureId) === -1) {
          ctx.lastKnownSelectIds.push(selectedFeatureId);
        }
        if (ctx.selectedFeatures) {
          ctx.selectedFeatures.forEach((feature) => {
            if (selectedFeatureId === feature.properties.geoHubId) {
              // wenn ausgewählt, dann nicht mher hinzufügen oder togglen
            }
          });
        } else {
          ctx.selectedFeatures = [];
        }

        let selectedIdIndex = -1;
        ctx.coldFeatures.forEach((element, index) => {
          if (element.properties.geoHubId === selectedFeatureId) {
            selectedIdIndex = index;
          }
        });
        if (selectedIdIndex !== -1) {
          ctx.selectedFeatures.push(...ctx.coldFeatures.splice(selectedIdIndex, 1));
        }
        const points = [];
        ctx.selectedFeatures.forEach((feature) => {
          turf.coordEach(feature, (pointCoords) => {
            points.push(turf.point(pointCoords, {geoHubId: feature.properties.geoHubId}));
          });
        });
        ctx.map.getSource(Constants.sources.COLD).setData(turf.featureCollection(ctx.coldFeatures));
        ctx.map.getSource(Constants.sources.SELECT).setData(turf.featureCollection(ctx.selectedFeatures));
        ctx.map.getSource(Constants.sources.SELECT_HELPER).setData(turf.featureCollection(points));
      };

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
          deselectCurrentFeature();
        }
        selectFeature(selectedGeoHubId);
      } else if (!multipleSelect) {
        ctx.lastKnownSelectIds = [];
        deselectCurrentFeature();
      }
    }
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

  function changeMode(newMode) {
    // TODO finish current mode
    console.log("New mode", newMode);
    ctx.mode = newMode;
    const classesToRemove = [];
    ctx.container.classList.forEach((className) => {
      if (className.indexOf("mouse-") !== -1) {
        classesToRemove.push(className);
      }
    });
    if (classesToRemove.length > 0) {
      ctx.container.classList.remove(...classesToRemove);
    }

    if (newMode === Constants.modes.SELECT) {
      ctx.container.classList.add("mouse-pointer");
    } else if (newMode === Constants.modes.DRAW) {
      ctx.container.classList.add("mouse-add");
    } else {
      ctx.container.classList.add("mouse-move");

    }
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
