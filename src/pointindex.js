import MeshIndex from "./mesh_index";
import MeshRouting from "./mesh_routing";
import turf from "@turf/turf";
import Constants from "./constants";

const overpassApi = require("./overpass_api");

module.exports = function (ctx) {

  let meshIndex = new MeshIndex([]);
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
    const bbox = [[point.x - 5, point.y - 5], [point.x + 5, point.y + 5]];
    const mapFeatures =  ctx.map.queryRenderedFeatures(bbox, filter);
    return ctx.featuresStore.getFeaturesById(mapFeatures.map((element) => {
      return element.properties.geoHubId;
    }));
  };

  const updateMeshData = function () {
    meshRouting = new MeshRouting(meshIndex.getMesh());
    const meshedFeatures = turf.featureCollection(meshIndex.getMesh());
    ctx.map.getSource(Constants.sources.BASE).setData(meshedFeatures);
  };

  return {
    addData: function (fc) {
      meshIndex = new MeshIndex(fc.features);
      meshIndex.addNewFeatures(ctx.featuresStore.getColdFeatures());
      updateMeshData();
    },
    addOverpassData: function (data) {
      const fc = overpassApi.convertFromOverpassToGeojson(data);
      meshIndex = new MeshIndex(fc.features);
      meshIndex.addNewFeatures(ctx.featuresStore.getColdFeatures());
      updateMeshData();
    },
    addUserData: function (data) {
      meshIndex.addNewFeatures(data.features);
      updateMeshData();
    },
    deleteSnapData: function () {
      meshIndex = new MeshIndex([]);
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
