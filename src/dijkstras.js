/**
 * Basic priority queue implementation. If a better priority queue is wanted/needed,
 * this code works with the implementation in google's closure library (https://code.google.com/p/closure-library/).
 * Use goog.require('goog.structs.PriorityQueue'); and new goog.structs.PriorityQueue()
 */
function PriorityQueue() {
  this._nodes = [];

  this.enqueue = function (priority, key) {
    this._nodes.push({key: key, priority: priority});
    this.sort();
  };
  this.dequeue = function () {
    return this._nodes.shift().key;
  };
  this.sort = function () {
    this._nodes.sort((a, b) => {
      return a.priority - b.priority;
    });
  };
  this.isEmpty = function () {
    return !this._nodes.length;
  };
}

/**
 * Pathfinding starts here
 */
module.exports = function () {
  var INFINITY = 1 / 0;
  this.vertices = {};

  this.addVertex = function (name, edges) {
    this.vertices[name] = edges;
  };
  this.setVertices = function (graph) {
    this.vertices = graph;
  };
  this.shortestPath = function (start, finish) {
    var nodes = new PriorityQueue(),
      distances = {},
      previous = {},
      path = [],
      smallest, vertex, neighbor, alt;

    for (vertex in this.vertices) {
      if (vertex === start) {
        distances[vertex] = 0;
        nodes.enqueue(0, vertex);
      } else {
        distances[vertex] = INFINITY;
        nodes.enqueue(INFINITY, vertex);
      }

      previous[vertex] = null;
    }

    while (!nodes.isEmpty()) {
      smallest = nodes.dequeue();

      if (smallest === finish) {
        path = [];

        while (previous[smallest]) {
          path.push(smallest);
          smallest = previous[smallest];
        }

        break;
      }

      if (!smallest || distances[smallest] === INFINITY) {
        continue;
      }

      for (neighbor in this.vertices[smallest]) {
        alt = distances[smallest] + this.vertices[smallest][neighbor];

        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = smallest;

          nodes.enqueue(alt, neighbor);
        }
      }
    }

    return path;
  };
};
