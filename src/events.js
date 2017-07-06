import Constants from "./constants";
import turf from "@turf/turf";
import doubleClickZoom from "./double_click_zoom";
import utils from "./utils";
const overpassApi = require("./overpass_api");
const closestPoints = require("./closest_points");

module.exports = function (ctx) {

  const mouseMove = function (event) {
    if (ctx.mode === Constants.modes.DRAW) {


//    console.log("crtl: ", event.originalEvent.ctrlKey, " shift: ", event.originalEvent.shiftKey, " alt: "+event.originalEvent.altKey);
      const button = event.originalEvent.buttons !== undefined ? event.originalEvent.buttons : event.originalEvent.which;
      //console.log("move: button:  ", button, " event: ", event);
      if (button === 1) {
        return;
      }

      const createLineToCurrentMouseMove = function (evtCoords) {
        ctx.closestPoint = null;
        if (ctx.lastPoint) {
          return turf.lineString([ctx.lastPoint.coords, evtCoords]);
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
            if (ctx.lastPoint) {
              const lastPointDistance = turf.distance(turf.point(evtCoords), turf.point(ctx.lastPoint.coords));
              if (utils.isPointEqual(ctx.lastPoint.coords, closestPoint.coords) && lastPointDistance > 0.002) {
                snapFeature = createLineToCurrentMouseMove(evtCoords);
              } else {
                const fromPoint = ctx.lastPoint;
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
    }
  };

  const addClickSegementsToMesh = function () {
    const meshFeatures = [];
    if (ctx.closestPoint && ctx.closestPoint.borders && ctx.closestPoint.geoHubId !== undefined) {
      console.log("adding mesh features");
      ctx.api.splitSegmentAtPoint(ctx.closestPoint.geoHubId, ctx.closestPoint.coords);
    }
    if (ctx.snapFeature && ctx.snapFeature.geometry.type === "LineString") {
      meshFeatures.push(ctx.snapFeature);
    } else {
      console.log("known mesh feature: ", JSON.stringify(ctx.snapFeature));
    }
    console.log("meshFeatures: ", JSON.stringify(meshFeatures));
    if (meshFeatures.length > 0) {
      ctx.api.addFeaturesToMesh(meshFeatures);
    }
  };

  const mouseClick = function (event) {
    if (ctx.mode === Constants.modes.DRAW) {
      if (ctx.closestPoint) {
        ctx.lastPoint = ctx.closestPoint;
      } else {
        doubleClickZoom.disable(ctx);
        const evtCoords = [event.lngLat.lng, event.lngLat.lat];
        ctx.lastPoint = {coords: evtCoords};
      }
      addClickSegementsToMesh();
      console.log("mouseClick, last point: ", ctx.lastPoint, "closestPoint: ", ctx.closestPoint);
      if (ctx.lastClick) {
        if (ctx.lastClick.coords[0] === ctx.lastPoint.coords[0] && ctx.lastClick.coords[1] === ctx.lastPoint.coords[1]) {
          // finish draw
          console.log("Finish draw");
          doubleClickZoom.enable(ctx);
          ctx.snapFeature = null;
          ctx.lastPoint = null;
          if (ctx.hotFeature) {
            if (utils.isPolygon(ctx.hotFeature)) {
              console.log("Convert to polygon");
              ctx.hotFeature.geometry.type = "Polygon";
              ctx.hotFeature.geometry.coordinates = [ctx.hotFeature.geometry.coordinates];
            }
            ctx.coldFeatures.push(ctx.hotFeature);
            ctx.hotFeature = null;
          } else {
            const hotFeature = turf.point(ctx.lastClick.coords);
            ctx.coldFeatures.push(hotFeature);
          }
          ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
          ctx.map.getSource(Constants.sources.HOT).setData(turf.featureCollection([]));
          ctx.map.getSource(Constants.sources.COLD).setData(turf.featureCollection(ctx.coldFeatures));
        }
      }

      let hotFeature = ctx.hotFeature;
      if (ctx.snapFeature && ctx.snapFeature.geometry.type === "LineString") {
        const snapCoords = ctx.snapFeature.geometry.coordinates;
        console.log("current snap: ", snapCoords);
        if (snapCoords.length > 1) {
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
      ctx.lastClick = ctx.lastPoint;
    } else if (ctx.mode === Constants.modes.SELECT) {
      const nearFeatures = ctx.api.userFeaturesAt(event.lngLat);
      console.log("nearFeatures: ", nearFeatures.length);
      nearFeatures.forEach((feature) => {
        console.log("feature: ", feature.geometry.type);
      });

    }
  };

  const KEY_D = 100;
  const KEY_P = 112;

  const keypress = function (event) {
    console.log("keycode: ", event.keyCode);
    switch (event.keyCode) {
      case KEY_D : {
        if (ctx.debug) {
          console.log("Debug: ", JSON.stringify(ctx.debug));
        }
        break;
      }
      case KEY_P : {
        if (ctx.coldFeatures) {
          console.log("coldFeatures: ", JSON.stringify(ctx.coldFeatures));
        }
        break;
      }
    }
  };

  function handleDownloadButton() {
    console.log("Downloading ", ctx.map.getBounds());

    overpassApi.loadWays(ctx.map.getBounds(), (result) => {
      console.log("Data downloaded");
      const geojson = overpassApi.convertFromOverpassToGeojson(result);
      console.log("Data adding to map");
      ctx.api.addData(geojson);
    });
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

  return {
    addEventListeners: function (map) {
      map.on("mousemove", mouseMove);
      map.on('click', mouseClick);
      const container = map.getContainer();
      container.addEventListener('keypress', keypress);

    },
    removeEventListeners: function (map) {
      map.off("mousemove", mouseMove);
      map.off('click', mouseClick);
      const container = map.getContainer();
      container.removeEventListener('keypress', keypress);

    },
    handleDownloadButton,
    changeMode
  };
};
