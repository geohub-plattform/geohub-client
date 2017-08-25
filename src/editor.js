const turf = require("@turf/turf");
const jQuery = require("jquery");

module.exports = function (ctx) {
  const globalProperties = ["color", "description", "name", "label", "city", "street", "population"];
  const editor = document.getElementById("data-editor");
  const counter = document.getElementById("data-counter");
  let tableBody = null;
  let knownPropertyNames = null;
  const currentRows = [];

  function reset() {
    currentRows.splice(0, currentRows.length);
    tableBody = null;
    knownPropertyNames = null;
  }

  const deleteHandler = function (row) {
    return () => {
      const index = currentRows.indexOf(row);
      if (index !== -1) {
        const removedRows = currentRows.splice(index, 1);
        removedRows.forEach((removed) => {
          tableBody.removeChild(removed);
        });
      }
    };
  };

  const renderKeyVal = function (key, val) {
    const row = element("tr");
    const keyColumn = element("td", "editor-label");
    const valueColumn = element("td", "editor-value");
    const actionColumn = element("td", "editor-action");
    const valueField = element("input", "input-value");
    const labelField = element("input", "input-label");
    const deleteButton = element("button", "btn btn-warning", "Löschen");
    valueColumn.appendChild(valueField);
    if (val.length === 0) {
      valueField.value = "";
    } else if (val.length === 1) {
      valueField.value = val[0];
    } else {
      valueField.value = "";
      valueField.placeholder = `(${val.join(", ")})`;
    }
    keyColumn.appendChild(labelField);
    labelField.value = key;
    actionColumn.appendChild(deleteButton);
    deleteButton.addEventListener("click", deleteHandler(row));
    row.appendChild(keyColumn);
    row.appendChild(valueColumn);
    row.appendChild(actionColumn);
    currentRows.push(row);
    if (knownPropertyNames) {
      jQuery(labelField).typeahead({source: knownPropertyNames});
    }
    return row;
  };

  const addHandler = function () {
    if (tableBody) {
      const newRow = renderKeyVal("", [""]);
      tableBody.appendChild(newRow);
      const labels = newRow.getElementsByClassName("input-label");
      if (labels.length > 0) {
        labels[0].focus();
      }
    }
  };

  const saveHandler = function () {
    const newProperties = {};
    const propertiesToKeep = [];
    console.log("rows to save: ", currentRows);
    currentRows.forEach((row) => {
      const labelElement = row.getElementsByClassName("input-label")[0];
      const valueElement = row.getElementsByClassName("input-value")[0];
      console.log("label: ", labelElement.value, "value: ", valueElement.value, "placeholder: ", valueElement.placeholder);
      if (labelElement.value) {
        if (valueElement.value) {
          newProperties[labelElement.value] = valueElement.value;
        } else if (valueElement.placeholder) {
          propertiesToKeep.push(labelElement.value);
        }
      }
    });
    console.log("newProperties: ", newProperties);
    console.log("keepProperties: ", propertiesToKeep);
    ctx.selectStore.updateProperties(newProperties, propertiesToKeep);
    ctx.snackbar("Gespeichert");
  };

  function createActionButtons() {
    const generalActions = element("div", "actions");

    const addButton = element("button", "btn btn-info", "+ Hinzufügen");
    addButton.addEventListener("click", addHandler);
    const saveButton = element("button", "btn btn-primary", "Speichern");
    saveButton.addEventListener("click", saveHandler);

    generalActions.appendChild(addButton);
    generalActions.appendChild(saveButton);

    return generalActions;
  }

  function element(tagName, className, html) {
    const element = document.createElement(tagName);
    if (tagName === "button") {
      element.setAttribute("type", "button");
    }
    if (html) {
      element.innerHTML = html;
    }
    if (className) {
      element.classList.add(...className.split(" "));
    }
    return element;
  }


  function updateViewPort() {
    const bbox = ctx.selectStore.getSelectedFeaturesBbox();
    if (bbox) {
      const bboxPolygon = turf.bboxPolygon(bbox);
      const mapBounds = ctx.map.getBounds();
      const mapPolygon = turf.polygon([[[mapBounds.getWest(), mapBounds.getNorth()],
        [mapBounds.getEast(), mapBounds.getNorth()],
        [mapBounds.getEast(), mapBounds.getSouth()], [mapBounds.getWest(), mapBounds.getSouth()],
        [mapBounds.getWest(), mapBounds.getNorth()]]]);

      if (!turf.booleanContains(mapPolygon, bboxPolygon)) {
        ctx.map.fitBounds(bbox, {maxZoom: ctx.map.getZoom()});
      }
    }
  }

  function createPropertyNameList() {
    const knownNames = new Set(globalProperties);
    ctx.selectStore.getPropertyNames().forEach((name) => {
      knownNames.add(name);
    });
    knownPropertyNames = [...knownNames.values()];
  }

  function updateSelectedFeatures() {
    editor.innerHTML = "";
    reset();
    if (ctx.selectStore.hasSelection()) {
      if (ctx.selectStore.hasSingleSelection()) {
        counter.innerHTML = "Ein Element ausgewählt";
      } else {
        counter.innerHTML = `${ctx.selectStore.length()} Elemente ausgewählt`;
      }
      createPropertyNameList();
      const currentTable = element("table", "table table-bordered");
      const header = element("thead");
      const headerRow = element("tr");
      headerRow.appendChild(element("th", "editor-label", "Eigenschaft"));
      headerRow.appendChild(element("th", "editor-value", "Wert"));
      headerRow.appendChild(element("th", "editor-action", "Action"));
      header.appendChild(headerRow);
      currentTable.appendChild(header);
      tableBody = element("tbody");
      const mergedProperties = ctx.selectStore.getMergedPropertiesForEditor();
      Object.keys(mergedProperties).forEach((property) => {
        tableBody.appendChild(renderKeyVal(property, mergedProperties[property]));
      });
      currentTable.appendChild(tableBody);
      editor.appendChild(currentTable);
      editor.appendChild(createActionButtons());
    } else {
      counter.innerHTML = "Keine Elemente ausgewählt";
    }
  }

  return {
    renderEditor: function () {
      updateSelectedFeatures();
      setTimeout(() => {
        updateViewPort();
      }, 500);
      ctx.eventBus.addEventListener("selection_changed", updateSelectedFeatures);
    },
    hideEditor: function () {
      reset();
      ctx.eventBus.removeEventListener("selection_changed", updateSelectedFeatures);
    }
  };
};
