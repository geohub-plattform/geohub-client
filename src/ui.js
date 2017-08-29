const xtend = require('xtend');
const Constants = require('./constants');

const classTypes = ['mode', 'feature', 'mouse'];

module.exports = function (ctx) {
  const buttonElements = {};
  const buttonOptions = {};
  let activeButton = null;

  let currentMapClasses = {
    mode: null, // e.g. mode-direct_select
    feature: null, // e.g. feature-vertex
    mouse: null // e.g. mouse-move
  };

  let nextMapClasses = {
    mode: null,
    feature: null,
    mouse: null
  };

  function queueMapClasses(options) {
    nextMapClasses = xtend(nextMapClasses, options);
  }

  function updateMapClasses() {
    if (!ctx.container) return;

    const classesToRemove = [];
    const classesToAdd = [];

    classTypes.forEach((type) => {
      if (nextMapClasses[type] === currentMapClasses[type]) return;

      classesToRemove.push(`${type}-${currentMapClasses[type]}`);
      if (nextMapClasses[type] !== null) {
        classesToAdd.push(`${type}-${nextMapClasses[type]}`);
      }
    });

    if (classesToRemove.length > 0) {
      ctx.container.classList.remove(...classesToRemove);
    }

    if (classesToAdd.length > 0) {
      ctx.container.classList.add(...classesToAdd);
    }

    currentMapClasses = xtend(currentMapClasses, nextMapClasses);
  }

  function createTitle(options) {
    return `${options.title}${(options.key ? ` (${options.key})` : "")}`;
  }

  function createBaseButton(id, options) {
    const button = document.createElement('button');
    if (options.title) {
      button.setAttribute('title', createTitle(options));
    }
    options.container.appendChild(button);

    buttonElements[id] = button;
    options["button"] = button;
    buttonOptions[id] = options;

    return button;

  }

  function createControlButton(id, options = {}) {
    const button = createBaseButton(id, options);
    button.className = `${Constants.classes.CONTROL_BUTTON} ${options.className}`;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clickedButton = e.target;
      if (clickedButton === activeButton) {
        deactivateButtons();
        return;
      }

      setActiveButton(id);
      options.onActivate();
    }, true);

    return button;
  }

  function createOptionButton(id, options = {}) {
    const button = createBaseButton(id, options);
    button.className = `${Constants.classes.CONTROL_BUTTON}`;
    if (ctx.options[options.name]) {
      button.classList.add(options.activeClass);
    } else {
      button.classList.add(options.inactiveClass);
    }

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (ctx.options[options.name]) {
        ctx.options[options.name] = false;
        button.classList.remove(options.activeClass);
        button.classList.add(options.inactiveClass);
        if (options.onDeactivate) {
          options.onDeactivate();
        }
      } else {
        ctx.options[options.name] = true;
        button.classList.remove(options.inactiveClass);
        button.classList.add(options.activeClass);
        if (options.onActivate) {
          options.onActivate();
        }
      }
    }, true);
    return button;
  }

  function createActionButton(id, options = {}) {
    const button = createBaseButton(id, options);
    button.className = `${Constants.classes.ACTION_BUTTON} ${options.className}`;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      options.onAction();
    }, true);

    return button;
  }

  function createDivider() {
    const divider = document.createElement('div');
    divider.className = `${Constants.classes.DIVIDER}`;
    return divider;
  }

  function createButtonDropdown() {
    const group = document.createElement('div');
    return group;
  }

  function deactivateButtons() {
    if (!activeButton) return;
    activeButton.classList.remove(Constants.classes.ACTIVE_BUTTON);
    activeButton = null;
  }

  function setActiveButton(id) {
    deactivateButtons();

    const button = buttonElements[id];
    if (!button) return;

    if (button && id !== 'trash') {
      button.classList.add(Constants.classes.ACTIVE_BUTTON);
      activeButton = button;
    }
  }

  function addButtons() {
    const containerGroup = document.createElement('div');
    containerGroup.className = `${Constants.classes.PREDEFINED_CONTROL_BASE} ${Constants.classes.PREDEFINED_CONTROL_GROUP}`;
    const actionGroup = document.createElement('div');
    actionGroup.className = `${Constants.classes.ACTION_GROUP}`;
    const controlGroup = document.createElement('div');
    controlGroup.className = `${Constants.classes.CONTROL_GROUP}`;
    const dropdownGroup = document.createElement('div');
    dropdownGroup.className = `${Constants.classes.DROPDOWN_GROUP}`;
    dropdownGroup.style.display = 'none';

    const action2Group = document.createElement('div');
    action2Group.className = `${Constants.classes.ACTION_GROUP}`;
    const optionsGroup = document.createElement('div');
    optionsGroup.className = `${Constants.classes.ACTION_GROUP}`;

    containerGroup.appendChild(actionGroup);
    containerGroup.appendChild(dropdownGroup);
    containerGroup.appendChild(createDivider());
    containerGroup.appendChild(controlGroup);
    containerGroup.appendChild(createDivider());
    containerGroup.appendChild(optionsGroup);
    containerGroup.appendChild(createDivider());
    containerGroup.appendChild(action2Group);

    createActionButton("downloadWays", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_DOWNLOAD_WAYS,
      key: "w",
      title: `Wege downloaden`,
      onAction: () => ctx.events.handleWaysDownloadButton()
    });
    createActionButton("downloadBuildings", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_DOWNLOAD_BUILDINGS,
      key: "b",
      title: `Wege und Gebäude downloaden`,
      onAction: () => ctx.events.handleBuildingsDownloadButton()
    });
    createActionButton("expandEditor", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_EXPAND_EDITOR,
      key: "e",
      title: `GeoJson Feature Editor öffnen`,
      onAction: () => ctx.events.handleExpandEditorButton()
    });
    createActionButton("loadData", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_LOAD_DATA,
      key: "o",
      title: `Öffnen von GeoJson, KML or GPX Dateien`,
      onAction: () => ctx.events.handleLoadDataButton()
    });
    createActionButton("saveFile", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE,
      title: `Als Gist, GeoJson oder KML speichern`,
      onAction: () => ctx.events.handleSaveButton()
    });
    createActionButton("saveAsGist", {
      container: dropdownGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE_AS_GIST,
      title: `Als Gist speichern`,
      onAction: () => ctx.events.handleSaveAsGistButton()
    });
    createActionButton("saveAsGeojson", {
      container: dropdownGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE_AS_GEOJSON,
      title: `Als Geojson speichern`,
      onAction: () => ctx.events.handleSaveAsGeojsonButton()
    });
    createActionButton("saveAsKML", {
      container: dropdownGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE_AS_KML,
      title: `Als KML speichern`,
      onAction: () => ctx.events.handleSaveAsKmlButton()
    });
    createControlButton("select", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_SELECT,
      key: "s",
      title: `Geodaten auswählen`,
      onActivate: () => ctx.events.changeMode(Constants.modes.SELECT)
    });
    createControlButton("edit", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_EDIT,
      key: "d",
      title: `Zeichnen`,
      onActivate: () => ctx.events.changeMode(Constants.modes.DRAW)
    });
    createControlButton("cut", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_CUT,
      key: "a",
      title: `Geodaten schneiden`,
      onActivate: () => ctx.events.changeMode(Constants.modes.CUT)
    });
    createOptionButton("snap-enabled", {
      container: optionsGroup,
      name: "snapToFeatures",
      title: `Snapping ein- und ausschalten`,
      activeClass: 'geohub-snapping-enabled',
      inactiveClass: 'geohub-snapping-disabled'
    });
    createOptionButton("routing-enabled", {
      container: optionsGroup,
      name: "routing",
      title: `Routing ein- und ausschalten`,
      activeClass: 'geohub-routing-enabled',
      inactiveClass: 'geohub-routing-disabled'
    });
    createActionButton("combine", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_COMBINE_FEATURES,
      title: `Elemente kombinieren`,
      key: '+',
      onAction: () => ctx.internalApi.combineFeatures()
    });
    createActionButton("group-elements", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_GROUP_FEATURES,
      key: "g",
      title: `Elemente groupieren`,
      onAction: () => ctx.internalApi.groupFeatures()
    });
    createActionButton("ungroup-elements", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_UNGROUP_FEATURES,
      key: "G",
      title: `Gruppe auflösen`,
      onAction: () => ctx.internalApi.ungroupFeatures()
    });
    createActionButton("create-polygon", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_CREATE_POLYGON,
      key: 'p',
      title: `Polygon erstellen`,
      onAction: () => ctx.internalApi.createPolygon()
    });
    createActionButton("delete", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_DELETE,
      title: `Geodaten löschen`,
      onAction: () => ctx.events.deleteUserData()
    });
    createActionButton("delete-snap", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_DELETE_SNAP,
      title: `Stützdaten löschen`,
      onAction: () => ctx.internalApi.deleteSnapData()
    });
    createActionButton("zoom-in-features", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_ZOOM_IN_FEATURES,
      key: "x",
      title: `Karte an den Geodaten ausrichten`,
      onAction: () => ctx.internalApi.zoomInFeatures()
    });
    createActionButton("hide-selected", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_HIDE_SELECTED,
      title: `Ausgewählte Elemente verstecken`,
      onAction: () => ctx.selectStore.hideFeatures()
    });
    createActionButton("add-feature-to-grid", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_ADD_FEATURE_TO_GRID,
      title: `Ausgewählte Element zur Stützdaten hinzufügen`,
      onAction: () => ctx.events.addSelectedFeaturesToSnapGrid()
    });
    return containerGroup;
  }

  function removeButtons() {
    Object.keys(buttonElements).forEach(buttonId => {
      const button = buttonElements[buttonId];
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
      delete buttonElements[buttonId];
      delete buttonOptions[buttonId];
    });
  }

  function getButtonOptions() {
    return buttonOptions;
  }

  return {
    setActiveButton,
    queueMapClasses,
    updateMapClasses,
    addButtons,
    removeButtons,
    getButtonOptions
  };
};
