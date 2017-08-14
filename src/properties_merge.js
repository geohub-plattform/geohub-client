module.exports = function (features) {
  const props = {};
  features.forEach((feature) => {
    Object.assign(props, feature.properties);
  });
  if (props.geoHubId !== undefined) {
    delete props.geoHubId;
  }
  return props;
};
