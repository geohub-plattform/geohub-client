function simpleMerge(features) {
  const props = {};
  features.forEach((feature) => {
    Object.assign(props, feature.properties);
  });
  if (props.geoHubId !== undefined) {
    delete props.geoHubId;
  }
  return props;
}

function mergeForEditor(features) {
  const props = {};
  features.forEach((feature) => {
    Object.keys(feature.properties).forEach((key) => {
      const value = feature.properties[key];
      let propsArray = props[key];
      if (!propsArray) {
        propsArray = [];
        props[key] = propsArray;
      }
      if (propsArray.indexOf(value) === -1) {
        propsArray.push(value);
      }
    });
  });
  if (props.geoHubId !== undefined) {
    delete props.geoHubId;
  }
  return props;
}

module.exports = {simpleMerge, mergeForEditor};
