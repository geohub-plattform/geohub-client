import MeshIndex from "./mesh_index";
import MeshRouting from "./mesh_routing";
import turf from "@turf/turf";
import Constants from "./constants";

module.exports = function (ctx) {

  let meshIndex = null;
  let meshRouting = null;

  const queryMapFeatures = function (lngLat, radius) {
    const bbox = [
      ctx.map.project([lngLat.lng - radius, lngLat.lat - radius]),
      ctx.map.project([lngLat.lng + radius, lngLat.lat + radius])
    ];
    const filter = {layers: [Constants.layers.BASE]}; //, "geohub-line-cold", "geohub-line-hot"
    const features = ctx.map.queryRenderedFeatures(bbox, filter);
    return ctx.featureIndex.getFeaturesFromIndex(features);
  };

  return {
    addData: function (fc) {
      meshIndex = new MeshIndex(fc.features);
      const meshedFeatures = turf.featureCollection(meshIndex.getMesh());
      meshRouting = new MeshRouting(meshIndex.getMesh());
      ctx.featureIndex.addFeatures(meshedFeatures.features);
      console.log("Adding source: ", Constants.sources.BASE);
      ctx.map.getSource(Constants.sources.BASE).setData(meshedFeatures);
    },
    addFeatureToIndex: function (newFeature) {
      //ctx.featureIndex.addFeatures([newFeature]);
    },
    addFeaturesToMesh: function (newFeatures) {
      meshIndex.addNewFeatures(newFeatures);
      meshRouting = new MeshRouting(meshIndex.getMesh());
      const meshedFeatures = turf.featureCollection(meshIndex.getMesh());
      ctx.featureIndex.reset();
      ctx.featureIndex.addFeatures(meshedFeatures.features);
      ctx.map.getSource(Constants.sources.BASE).setData(meshedFeatures);
    },
    featuresAt: function (lnglat, radius) {
      return queryMapFeatures(lnglat, radius);
    },
    getRouteFromTo: function (fromPoint, toPoint) {
      return meshRouting.getRouteFromTo(fromPoint, toPoint);
    }
  };
};
