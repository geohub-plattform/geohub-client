import MeshIndex from "./mesh_index";
import MeshRouting from "./mesh_routing";
import turf from "@turf/turf";
import Constants from "./constants";

module.exports = function (ctx) {

  let meshIndex = null;
  let meshRouting = null;

  const queryMapFeatures = function (lngLat, radiusInKm) {
    if (meshIndex) {
      const radius = turf.distanceToDegrees(radiusInKm);
      const bbox = [
        ctx.map.project([lngLat.lng - radius, lngLat.lat - radius]),
        ctx.map.project([lngLat.lng + radius, lngLat.lat + radius])
      ];
      const filter = {layers: [Constants.layers.BASE]}; //, "geohub-line-cold", "geohub-line-hot"
      const features = ctx.map.queryRenderedFeatures(bbox, filter);
      return meshIndex.getFeaturesFromIndex(features);
    } else {
      return null;
    }
  };

  const queryUserFeatures = function (lngLat) {
    const filter = {
      layers: ["geohub-line-cold", "geohub-fill-cold", "geohub-point-cold",
        "geohub-point-select-helper", "geohub-fill-select", "geohub-line-select"]
    };
    const point = ctx.map.project([lngLat.lng, lngLat.lat]);
    return ctx.map.queryRenderedFeatures(point, filter);
  };

  const updateMeshData = function () {
    meshRouting = new MeshRouting(meshIndex.getMesh());
    const meshedFeatures = turf.featureCollection(meshIndex.getMesh());
    ctx.map.getSource(Constants.sources.BASE).setData(meshedFeatures);
  };

  return {
    addData: function (fc) {
      console.log("Adding data: ", fc.features.length, " features");
      meshIndex = new MeshIndex(fc.features);
      console.log("Updating mesh");
      updateMeshData();
    },
    splitSegmentAtPoint: function (segmentId, pointCoords) {
      meshIndex.splitSegmentAtPoint(segmentId, pointCoords);
      updateMeshData();
    },
    addFeaturesToMesh: function (newFeatures) {
      meshIndex.addNewFeatures(newFeatures);
      updateMeshData();
    },
    featuresAt: function (lnglat, radius) {
      return queryMapFeatures(lnglat, radius);
    },
    userFeaturesAt: function (lnglat) {
      return queryUserFeatures(lnglat);
    },
    getRouteFromTo: function (fromPoint, toPoint) {
      return meshRouting.getRouteFromTo(fromPoint, toPoint);
    }
  };
};
