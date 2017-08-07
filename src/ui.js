const xtend = require('xtend');
const Constants = require('./constants');

const classTypes = ['mode', 'feature', 'mouse'];

module.exports = function (ctx) {
  const buttonElements = {};
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

  function createControlButton(id, options = {}) {
    const button = document.createElement('button');
    button.className = `${Constants.classes.CONTROL_BUTTON} ${options.className}`;
    button.setAttribute('title', options.title);
    options.container.appendChild(button);

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
    const button = document.createElement('button');
    button.className = `${Constants.classes.CONTROL_BUTTON}`;
    button.setAttribute('title', options.title);
    if (ctx.options[options.name]) {
      button.classList.add(options.activeClass);
    } else {
      button.classList.add(options.inactiveClass);
    }
    options.container.appendChild(button);

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
    const button = document.createElement('button');
    button.className = `${Constants.classes.ACTION_BUTTON} ${options.className}`;
    button.setAttribute('title', options.title);
    options.container.appendChild(button);

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


    buttonElements["downloadWays"] = createActionButton("downloadWays", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_DOWNLOAD,
      title: `Download way lines ${ctx.options.keybindings && '(d)'}`,
      onAction: () => ctx.events.handleWaysDownloadButton()
    });
    buttonElements["downloadBuildings"] = createActionButton("downloadBuildings", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_DOWNLOAD,
      title: `Download building lines ${ctx.options.keybindings && '(d)'}`,
      onAction: () => ctx.events.handleBuildingsDownloadButton()
    });
    buttonElements["loadData"] = createActionButton("loadData", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_LOAD_DATA,
      title: `Upload GeoJson, KML or GPX from PC`,
      onAction: () => ctx.events.handleLoadDataButton()
    });
    buttonElements["saveFile"] = createActionButton("saveFile", {
      container: actionGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE,
      title: `Export as Gist, GeoJson, KML`,
      onAction: () => ctx.events.handleSaveButton()
    });
    buttonElements["saveAsGist"] = createActionButton("saveAsGist", {
      container: dropdownGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE_AS_GIST,
      title: `Export as Gist`,
      onAction: () => ctx.events.handleSaveAsGistButton()
    });
    buttonElements["saveAsGeojson"] = createActionButton("saveAsGeojson", {
      container: dropdownGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE_AS_GEOJSON,
      title: `Export as Geojson`,
      onAction: () => ctx.events.handleSaveAsGeojsonButton()
    });
    buttonElements["saveAsKML"] = createActionButton("saveAsKML", {
      container: dropdownGroup,
      className: Constants.classes.CONTROL_BUTTON_SAVE_AS_KML,
      title: `Export as KML`,
      onAction: () => ctx.events.handleSaveAsKmlButton()
    });
    buttonElements["select"] = createControlButton("select", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_SELECT,
      title: `Select ${ctx.options.keybindings && '(s)'}`,
      onActivate: () => ctx.events.changeMode(Constants.modes.SELECT)
    });
    buttonElements["edit"] = createControlButton("edit", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_EDIT,
      title: `Edit ${ctx.options.keybindings && '(e)'}`,
      onActivate: () => ctx.events.changeMode(Constants.modes.DRAW)
    });
    buttonElements["cut"] = createControlButton("cut", {
      container: controlGroup,
      className: Constants.classes.CONTROL_BUTTON_CUT,
      title: `Cut ${ctx.options.keybindings && '(e)'}`,
      onActivate: () => ctx.events.changeMode(Constants.modes.CUT)
    });
    buttonElements["snap-enabled"] = createOptionButton("snap-enabled", {
      container: optionsGroup,
      name: "snapToFeatures",
      title: `Toggle snapping ${ctx.options.keybindings && '(e)'}`,
      activeClass: 'geohub-snapping-enabled',
      inactiveClass: 'geohub-snapping-disabled'
    });
    buttonElements["routing-enabled"] = createOptionButton("routing-enabled", {
      container: optionsGroup,
      name: "routing",
      title: `Toggle routing ${ctx.options.keybindings && '(e)'}`,
      activeClass: 'geohub-routing-enabled',
      inactiveClass: 'geohub-routing-disabled'
    });
    buttonElements["combine"] = createActionButton("combine", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_COMBINE_FEATURES,
      title: `Combine ${ctx.options.keybindings && '(e)'}`,
      onAction: () => ctx.internalApi.combineFeatures()
    });
    buttonElements["group-elements"] = createActionButton("group-elements", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_GROUP_FEATURES,
      title: `Group ${ctx.options.keybindings && '(e)'}`,
      onAction: () => ctx.internalApi.groupFeatures()
    });
    buttonElements["ungroup-elements"] = createActionButton("ungroup-elements", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_UNGROUP_FEATURES,
      title: `Ungroup ${ctx.options.keybindings && '(e)'}`,
      onAction: () => ctx.internalApi.ungroupFeatures()
    });
    buttonElements["create-polygon"] = createActionButton("create-polygon", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_CREATE_POLYGON,
      title: `Create polygon ${ctx.options.keybindings && '(e)'}`,
      onAction: () => ctx.internalApi.createPolygon()
    });
    buttonElements["delete"] = createActionButton("delete", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_DELETE,
      title: `Delete data ${ctx.options.keybindings && '(e)'}`,
      onAction: () => ctx.events.deleteUserData()
    });
    buttonElements["delete-snap"] = createActionButton("delete-snap", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_DELETE_SNAP,
      title: `Delete snap data ${ctx.options.keybindings && '(e)'}`,
      onAction: () => ctx.internalApi.deleteSnapData()
    });
    buttonElements["zoom-in-features"] = createActionButton("zoom-in-features", {
      container: action2Group,
      className: Constants.classes.CONTROL_BUTTON_ZOOM_IN_FEATURES,
      title: `Zoom in current features ${ctx.options.keybindings && '(e)'}`,
      onAction: () => ctx.internalApi.zoomInFeatures()
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
    });
  }

  return {
    setActiveButton,
    queueMapClasses,
    updateMapClasses,
    addButtons,
    removeButtons
  };
};
