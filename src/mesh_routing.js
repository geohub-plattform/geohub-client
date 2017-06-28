const utils = require("./utils");
const Dijkstras = require("./dijkstras");
const cloneDeep = require("clone-deep");
const turf = require("@turf/turf");

const addVertex = function (startPoint, endPoint, length, data) {
  let startData = data[startPoint];
  if (!startData) {
    startData = {};
    data[startPoint] = startData;
  }
  if (!startData[endPoint]) {
    startData[endPoint] = length;
  }
};

const addVertexPointTwoWay = function (startCoord, endCoords, length, data) {
  const startPoint = startCoord.join("#");
  const endPoint = endCoords.join("#");
  addVertex(startPoint, endPoint, length, data);
  addVertex(endPoint, startPoint, length, data);
};

//  create a GraphData object with addVertexPointTwoWay and addVertex
const MeshRouting = module.exports = function (mesh) {
  this.graphData = {};

  const that = this;
  mesh.forEach((vertex) => {
    const coords = vertex.geometry.coordinates;
    const startPoint = coords[0].join("#");
    const endPoint = coords[coords.length - 1].join("#");
    const length = vertex.properties.length;
    if (length === undefined) {
      throw new Error("Length is missing");
    } else {
      addVertex(startPoint, endPoint, length, that.graphData);
      addVertex(endPoint, startPoint, length, that.graphData);
    }
  });
};

MeshRouting.prototype.getRouteLength = function (route) {
  let length = 0;
  if (route.length > 1) {
    for (let x = 1; x < route.length; x++) {
      const prevNode = route[x - 1].join("#");
      const thisNode = route[x].join("#");

      length += this.graphData[prevNode][thisNode];
    }
  }
  return length;
};

MeshRouting.prototype.getRouteFromTo = function (fromPoint, toPoint) {
  const g = new Dijkstras();
  let graphDataCopy = this.graphData;
  if (fromPoint.borders || toPoint.borders) {
    graphDataCopy = cloneDeep(this.graphData);
    if (utils.sameBorders(fromPoint.borders, toPoint.borders)) {
      const border1 = fromPoint.borders.border1;
      const border2 = fromPoint.borders.border2;
      const point1 = fromPoint.coords;
      const point2 = toPoint.coords;

      const border1ToPoint1 = turf.distance(turf.point(border1), turf.point(point1));
      const border1ToPoint2 = turf.distance(turf.point(border1), turf.point(point2));
      if (border1ToPoint1 < border1ToPoint2) {
        addVertexPointTwoWay(border1, point1, border1ToPoint1, graphDataCopy);
        addVertexPointTwoWay(point2, border2, turf.distance(turf.point(point2), turf.point(border2)), graphDataCopy);
      } else {
        addVertexPointTwoWay(border1, point2, border1ToPoint2, graphDataCopy);
        addVertexPointTwoWay(point1, border2, turf.distance(turf.point(point1), turf.point(border2)), graphDataCopy);
      }
      addVertexPointTwoWay(point1, point2, turf.distance(turf.point(point1), turf.point(point2)), graphDataCopy);
    } else {
      if (fromPoint.borders) {
        const borders = fromPoint.borders;
        const point = fromPoint.coords;
        addVertexPointTwoWay(borders.border1, point, borders.distance1, graphDataCopy);
        addVertexPointTwoWay(borders.border2, point, borders.distance2, graphDataCopy);
      }
      if (toPoint.borders) {
        const borders = toPoint.borders;
        const point = toPoint.coords;
        addVertexPointTwoWay(borders.border1, point, borders.distance1, graphDataCopy);
        addVertexPointTwoWay(borders.border2, point, borders.distance2, graphDataCopy);
      }
    }
  }
  g.setVertices(graphDataCopy);
  const routeFrom = fromPoint.coords.join("#");
  const routeTo = toPoint.coords.join("#");
  const path = g.shortestPath(routeFrom, routeTo).concat([fromPoint.coords.join("#")]).reverse();
  if (path && path.length > 1) {
    const coords = [];
    let length = 0;
    let pair = path[0].split("#");
    coords.push([Number(pair[0]), Number(pair[1])]);

    for (let x = 1; x < path.length; x++) {
      length += graphDataCopy[path[x - 1]][path[x]];
      pair = path[x].split("#");
      coords.push([Number(pair[0]), Number(pair[1])]);
    }
    return {path: coords, length: length};
  } else {
    return null;
  }
}
;

