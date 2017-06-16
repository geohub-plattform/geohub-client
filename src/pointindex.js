import MeshIndex from "./mesh_index";
import MeshRouting from "./mesh_routing";

module.exports = function (ctx) {

  let meshIndex = null;
  let meshRouting = null;

  const queryMapFeatures = function (lngLat, radius) {
    const bbox = [
      ctx.map.project([lngLat.lng - radius, lngLat.lat - radius]),
      ctx.map.project([lngLat.lng + radius, lngLat.lat + radius])
    ];
    const filter = {layers: ["geohub-snaplayer", "geohub-line-cold", "geohub-line-hot"]};
    const features = ctx.map.queryRenderedFeatures(bbox, filter);
    return ctx.featureIndex.getFeaturesFromIndex(features);
  };

  return {
    addData: function (fc) {
      meshIndex = new MeshIndex(fc.features);
      meshRouting = new MeshRouting(meshIndex.getMesh());
      ctx.featureIndex.addFeatures(fc.features);
      ctx.map.addSource('geohub-snaplayer', {
        type: 'geojson',
        data: fc
      });

      ctx.map.addLayer({
        id: "geohub-snaplayer",
        source: "geohub-snaplayer",
        type: "line",
        paint: {
          "line-color": "#888",
          "line-width": 4,
          "line-opacity": 0.3
        }
      });
    },
    addFeatureToIndex: function (newFeature) {
      ctx.featureIndex.addFeatures([newFeature]);
    },
    addFeatureToMesh: function (newFeature) {
      console.log("addFeatureToMesh: ", JSON.stringify(newFeature));
      meshIndex.addNewFeatures([newFeature]);
      meshRouting = new MeshRouting(meshIndex.getMesh());
    },
    featuresAt: function (lnglat, radius) {
      return queryMapFeatures(lnglat, radius);
    },
    getRouteFromTo: function (fromPoint, toPoint) {
      return meshRouting.getRouteFromTo(fromPoint, toPoint);
    }
  };
};
