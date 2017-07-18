module.exports = {
  enable(map) {
    setTimeout(() => {
      if (!map || !map.doubleClickZoom) return;
      map.doubleClickZoom.enable();
    }, 0);
  },
  disable(map) {
    setTimeout(() => {
      if (!map || !map.doubleClickZoom) return;
      map.doubleClickZoom.disable();
    }, 0);
  }
};
