module.exports = function (ctx) {
  const editor = document.getElementById("data-editor");
  const counter = document.getElementById("data-counter");
  let currentTable = null;
  const currentRows = [];

  function reset() {
    currentRows.splice(0, currentRows.length);
    currentTable = null;
  }

  const deleteHandler = function (row) {
    return () => {
      const index = currentRows.indexOf(row);
      if (index !== -1) {
        const removedRows = currentRows.splice(index, 1);
        removedRows.forEach((removed) => {
          currentTable.removeChild(removed);
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
    const deleteButton = element("button", "delete-button", "Löschen");
    valueColumn.appendChild(valueField);
    valueField.value = val;
    keyColumn.appendChild(labelField);
    labelField.value = key;
    actionColumn.appendChild(deleteButton);
    deleteButton.addEventListener("click", deleteHandler(row));
    row.appendChild(keyColumn);
    row.appendChild(valueColumn);
    row.appendChild(actionColumn);
    currentRows.push(row);
    return row;
  };

  const addHandler = function () {
    if (currentTable) {
      const newRow = renderKeyVal("", "");
      currentTable.appendChild(newRow);
      const labels = newRow.getElementsByClassName("input-label");
      if (labels.length > 0) {
        labels[0].focus();
      }
    }
  };

  const saveHandler = function () {
    const newProperties = {};
    currentRows.forEach((row) => {
      const labelElement = row.getElementsByClassName("input-label")[0];
      const valueElement = row.getElementsByClassName("input-value")[0];
      if (labelElement.value) {
        newProperties[labelElement.value] = valueElement.value;
      }
    });
    ctx.selectStore.updateProperties(newProperties);
  };

  function createActionButtons() {
    const generalActions = element("div", "actions");

    const addButton = element("button", null, "+ Hinzufügen");
    addButton.addEventListener("click", addHandler);
    const saveButton = element("button", null, "Speichern");
    saveButton.addEventListener("click", saveHandler);

    generalActions.appendChild(addButton);
    generalActions.appendChild(saveButton);

    return generalActions;
  }

  function element(tagName, className, html) {
    const element = document.createElement(tagName);
    if (html) {
      element.innerHTML = html;
    }
    if (className) {
      element.classList.add(className);
    }
    return element;
  }

  function updateSelectedFeatures() {
    editor.innerHTML = "";
    if (ctx.selectStore.hasSelection()) {
      console.log("selected elements:", ctx.selectStore.length());
      if (ctx.selectStore.hasSingleSelection()) {
        counter.innerHTML = "Ein Element ausgewählt";
      } else {
        counter.innerHTML = `${ctx.selectStore.length()} Elemente ausgewählt`;
      }
      currentTable = element("table");
      const header = element("tr");
      header.appendChild(element("th", "editor-label", "Eigenschaft"));
      header.appendChild(element("th", "editor-value", "Wert"));
      header.appendChild(element("th", "editor-action", "Action"));
      currentTable.appendChild(header);
      const mergedProperties = ctx.selectStore.getMergedProperties();
      Object.keys(mergedProperties).forEach((property) => {
        currentTable.appendChild(renderKeyVal(property, mergedProperties[property]));
      });

      editor.appendChild(currentTable);
      editor.appendChild(createActionButtons());

    } else {
      counter.innerHTML = "Keine Elemente ausgewählt";
      reset();
    }
  }

  return {
    renderEditor: function () {
      console.log("update selected features");
      updateSelectedFeatures();
      ctx.eventBus.addEventListener("selection_changed", updateSelectedFeatures);
    },
    hideEditor: function () {
      reset();
      ctx.eventBus.removeEventListener("selection_changed", updateSelectedFeatures);
    }
  };
};
