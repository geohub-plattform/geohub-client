import Constants from "./constants";
import turf from "@turf/turf";
import cheapRuler from "cheap-ruler";
import doubleClickZoom from "./double_click_zoom";
import utils from "./utils";
const overpassApi = require("./overpass_api");

function closestPoints(ruler, coordinates, evtCoords) {
  const result = [];
  const pointOnLine = ruler.pointOnLine(coordinates, evtCoords);
  if (pointOnLine) {
    const pointCoords = pointOnLine.point;
    const pointIndex = pointOnLine.index;
    const linePoint = {type: "linepoint", coords: pointCoords};
    let vertex = null;
    if (pointIndex === coordinates.length) {
      vertex = coordinates[pointIndex];
    } else {
      const p1 = coordinates[pointIndex];
      const p2 = coordinates[pointIndex + 1];
      const distance1 = ruler.distance(p1, evtCoords);
      const distance2 = ruler.distance(p2, evtCoords);
      vertex = distance1 < distance2 ? p1 : p2;
      linePoint.border1 = p1;
      linePoint.distance1 = distance1;
      linePoint.border2 = p2;
      linePoint.distance2 = distance2;
    }
    result.push(linePoint);
    result.push({type: "vertex", coords: vertex});
  }
  return result;
}

function calculatePointsOnLine(uniqueFeatures, evtCoords) {
  const coords = [];
  const knownIds = {};

  uniqueFeatures.forEach((feature) => {
    const geoHubId = feature.properties.geoHubId;
    if (knownIds[geoHubId] === undefined) {
      knownIds[geoHubId] = true;
      const type = feature.geometry.type;
      const ruler = cheapRuler(feature.geometry.coordinates[0][1]);
      if (type === "LineString") {
        if (feature.geometry.coordinates) {
          closestPoints(ruler, feature.geometry.coordinates, evtCoords).forEach((pointType) => {
            pointType.geoHubId = geoHubId;
            pointType.dist = ruler.distance(pointType.coords, evtCoords);
            coords.push(pointType);
          });
        } else {
          console.log("no coordinates: ", feature);
        }
      } else if (type === "Point") {
        const pointType = {type: "vertex", coords: feature.geometry.coordinates};
        pointType.dist = ruler.distance(pointType.coords, evtCoords);
        coords.push(pointType);
      }
    }
  });
  return coords;
}

function findClosestPoint(uniqueFeatures, evtCoords, radius) {
  const coords = calculatePointsOnLine(uniqueFeatures, evtCoords);

  let closestVertex = null;
  let closestLinepoint = null;
  let borders;

  coords.forEach((pointType) => {
    const dist = pointType.dist;
    if (dist !== null) {
      if (pointType.type === "vertex") {
        if (closestVertex === null || closestVertex.dist > pointType.dist) {
          closestVertex = pointType;
        }
      } else if (dist < radius) {
        if (closestLinepoint !== null && dist === closestLinepoint.dist && closestLinepoint.geoHubId !== pointType.geoHubId) {
          // dies ist für den fall, dass zwei linien übereinander liegen.
          // finde dann die linie, deren endpunkte am nächsten zum mauszeiger liegen
          if (closestLinepoint.type === "linepoint") {
            if ((pointType.distance1 <= closestLinepoint.distance1 && pointType.distance2 <= closestLinepoint.distance2) ||
              (pointType.distance2 <= closestLinepoint.distance1 && pointType.distance1 <= closestLinepoint.distance2)) {
              console.log("switch closest points");
              closestLinepoint = pointType;
            }
          }
        }
        if (closestLinepoint === null || dist < closestLinepoint.dist) {
          closestLinepoint = pointType;
          if (pointType.border1 && pointType.border2) {
            borders = {
              border1: pointType.border1,
              border2: pointType.border2,
              distance1: pointType.distance1,
              distance2: pointType.distance2
            };
          } else {
            borders = null;
          }
        }
      }
    }
  });

  if (closestVertex !== null) {
    if (closestLinepoint !== null) {
      if (closestVertex.dist < radius) {
        return {coords: closestVertex.coords, borders: null, geoHubId: null};
      } else {
        return {coords: closestLinepoint.coords, borders: borders, geoHubId: closestLinepoint.geoHubId};
      }
    } else {
      return {coords: closestVertex.coords, borders: null, geoHubId: null};
    }
  } else if (closestLinepoint !== null) {
    return {coords: closestLinepoint.coords, borders: borders, geoHubId: closestLinepoint.geoHubId};
  } else {
    return null;
  }
}

module.exports = function (ctx) {

  const mouseMove = function (event) {
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
      const radius = Math.max(0.005, calculatedRadius);
      const nearFeatures = ctx.api.featuresAt(event.lngLat, radius);
      if (nearFeatures) {
        const closestPoint = findClosestPoint(nearFeatures, evtCoords, radius);
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
        // ctx.closestPoint = null;
        ctx.lastPoint = null;
        if (ctx.hotFeature) {
          ctx.coldFeatures.push(ctx.hotFeature);
          ctx.hotFeature = null;
          ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
          ctx.map.getSource(Constants.sources.HOT).setData(turf.featureCollection([]));
          ctx.map.getSource(Constants.sources.COLD).setData(turf.featureCollection(ctx.coldFeatures));
        }
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
    handleDownloadButton
  };
};
