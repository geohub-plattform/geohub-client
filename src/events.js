import Constants from "./constants";
import turf from "@turf/turf";
import cheapRuler from "cheap-ruler";


function closestPoints(ruler, coordinates, evtCoords) {
  const result = [];
  const pointIndex = ruler.pointOnLine(coordinates, evtCoords);
  if (pointIndex) {
    const linePoint = {type: "linepoint", coords: pointIndex.point};
    let vertex = null;
    if (pointIndex.index === coordinates.length) {
      vertex = coordinates[pointIndex.index];
    } else {
      const p1 = coordinates[pointIndex.index];
      const p2 = coordinates[pointIndex.index + 1];
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


function findClosestPoint(uniqueFeatures, evtCoords) {

  let closestDistance = null;
  let closestCoord = null;
  let borders;

  uniqueFeatures.forEach((feature) => {
    const type = feature.geometry.type;
    const coords = [];
    const ruler = cheapRuler(feature.geometry.coordinates[0][1]);

    if (type === "LineString") {
      if (feature.geometry.coordinates) {
        closestPoints(ruler, feature.geometry.coordinates, evtCoords).forEach((pointType) => {
          coords.push(pointType);
        });
      } else {
        console.log("no coordinates: ", feature);
      }
    } else if (type === "Point") {
      coords.push({type: "vertex", coords: feature.geometry.coordinates});
    } else if (type === "MultiLineString" || type === "Polygon") {
      feature.geometry.coordinates.forEach((coordinates) => {
        closestPoints(ruler, coordinates, evtCoords).forEach((pointType) => {
          coords.push(pointType);
        });
      });
    }

    if (coords.length === 0) {
      console.log("coords empty for feature: ", feature);
    } else {
      coords.forEach((pointType) => {
        const singleCoords = pointType.coords;
        const dist = ruler.distance(singleCoords, evtCoords);
        //console.log("type: ", pointType.type, " dist: ", dist);
        if (dist !== null) {
          if ((closestDistance === null || ((pointType.type === "vertex" && dist < 0.004) ||
            (dist < closestDistance))) && dist < 0.008) {
            feature.distance = dist;
            closestCoord = singleCoords;
            closestDistance = dist;
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
            //console.log("clostest type: ", pointType.type, " dist: ", dist);
          }
        }
      });
    }
  });

  if (closestDistance !== null) {
    //evt.lngLat.lng = closestCoord[0];
    //evt.lngLat.lat = closestCoord[1];
    //evt.point = ctx.map.project(closestCoord);
    //evt.snap = true;

    return {coords: closestCoord, borders: borders};
  } else {
    return null;
  }
}

module.exports = function (ctx) {

  const mouseMove = function (event) {

    const button = event.originalEvent.buttons !== undefined ? event.originalEvent.buttons : event.originalEvent.which;
    //console.log("move: button:  ", button, " event: ", event);
    if (button === 1) {
      return;
    }

    const evtCoords = [event.lngLat.lng, event.lngLat.lat];
    const nearFeatures = ctx.api.featuresAt(event.lngLat);
    let snapFeature = null;
    if (nearFeatures) {
      //console.log("near features found: ", nearFeatures.length);
      const closestPoint = findClosestPoint(nearFeatures, evtCoords);
      //console.log("closestPoint: ", closestPoint);

      if (closestPoint) {
        ctx.closestPoint = closestPoint;
        if (ctx.lastPoint) {
          const fromPoint = ctx.lastPoint;
          const route = ctx.api.getRouteFromTo(fromPoint, closestPoint);
          if (route) {
            snapFeature = turf.lineString(route);
          } else {
            snapFeature = turf.lineString([fromPoint.coords, closestPoint.coords]);
          }
        } else {
          snapFeature = turf.point(closestPoint.coords);
        }
      } else {
        ctx.closestPoint = null;
        if (ctx.lastPoint) {
          snapFeature = turf.lineString([ctx.lastPoint.coords, evtCoords]);
        }
      }
      /*const button = event.originalEvent.buttons !== undefined ? event.originalEvent.buttons : event.originalEvent.which;
       if (button === 1) {
       return events.mousedrag(event);
       }
       const target = getFeaturesAndSetCursor(event, ctx);
       event.featureTarget = target;
       currentMode.mousemove(event);*/

    } else {
      ctx.closestPoint = null;
      if (ctx.lastPoint) {
        snapFeature = turf.lineString([ctx.lastPoint.coords, evtCoords]);
      }
    }
    ctx.snapFeature = snapFeature;
    if (snapFeature) {
      ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([snapFeature]));
    } else {
      ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
    }
  };

  const mouseClick = function (event) {
    if (ctx.closestPoint) {
      ctx.lastPoint = ctx.closestPoint;
    } else {
      const evtCoords = [event.lngLat.lng, event.lngLat.lat];
      ctx.lastPoint = {coords: evtCoords};
    }
    console.log("mouseClick, last point: ", ctx.lastPoint, "closestPoint: ", ctx.closestPoint);
    if (ctx.lastClick) {
      if (ctx.lastClick.coords[0] === ctx.lastPoint.coords[0] && ctx.lastClick.coords[1] === ctx.lastPoint.coords[1]) {
        // finish draw
        console.log("Finish draw");
        ctx.snapFeature = null;
        ctx.closestPoint = null;
        ctx.lastPoint = null;
        if (ctx.hotFeature) {
          ctx.coldFeatures.push(ctx.hotFeature);
          ctx.hotFeature = null;
          ctx.api.recreateIndices(ctx.coldFeatures);
          ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
          ctx.map.getSource(Constants.sources.HOT).setData(turf.featureCollection([]));
          ctx.map.getSource(Constants.sources.COLD).setData(turf.featureCollection(ctx.coldFeatures));
        }
      }
    }

    let hotFeature = ctx.hotFeature;
    if (ctx.snapFeature && ctx.snapFeature.geometry.type === "LineString") {
      const snapCoords = ctx.snapFeature.geometry.coordinates;
      if (snapCoords.length > 1) {
        if (hotFeature) {
          const hotCoords = hotFeature.geometry.coordinates;
          hotCoords.splice(-1, 1, ...snapCoords);
        } else {
          hotFeature = turf.lineString(snapCoords);
          ctx.hotFeature = hotFeature;
          ctx.api.addFeatureToIndex(ctx.hotFeature);
        }
        ctx.snapFeature = null;
        ctx.map.getSource(Constants.sources.SNAP).setData(turf.featureCollection([]));
        ctx.map.getSource(Constants.sources.HOT).setData(turf.featureCollection([hotFeature]));
      }
    }
    ctx.lastClick = ctx.lastPoint;
  };

  return {
    addEventListeners: function (map) {
      map.on("mousemove", mouseMove);
      map.on('click', mouseClick);
    },
    removeEventListeners: function (map) {
      map.off("mousemove", mouseMove);
      map.off('click', mouseClick);
    }
  };

};
