const Constants = require("./constants");
const turf = require("@turf/turf");
const utils = require("./utils");
const closestPoints = require("./closest_points");

module.exports = function (ctx) {

  this.canHandle = function (modeName) {
    return Constants.modes.DRAW === modeName;
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

  this.handleMove = function (event) {
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
    const snapToPoint = !event.originalEvent.shiftKey;
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

  };

  this.handleClick = function (event) {
    console.log("click!");
    let lastPoint = null;
    if (ctx.closestPoint) {
      lastPoint = ctx.closestPoint;
    } else {
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

  };

  this.activate = function () {
    ctx.container.classList.add("mouse-pointer");
  };

  this.deactivate = function () {
    // TODO finish draw
  };
};
