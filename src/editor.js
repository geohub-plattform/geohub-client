module.exports = function (ctx) {
  const editor = document.getElementById("data-editor");
  const counter = document.getElementById("data-counter");
  let currentTable = null;
  const currentRows = [];

  const deleteHandler = function (row) {
    return () => {
      const index = currentRows.indexOf(row);
      if (index !== -1) {
        currentRows.splice(index, 1);
        currentTable.removeChild(row);
      }

    };
  };

  const renderKeyVal = function (key, val) {
    const row = element("tr");
    const keyColumn = element("td", "editor-label");
    const valueColumn = element("td", "editor-value");
    const actionColumn = element("td", "editor-action");
    const valueField = element("input");
    const labelField = element("input");
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


  function createActionButtons() {
    const generalActions = element("div", "actions");

    const addButton = element("button", null, "+ Hinzufügen");
    addButton.addEventListener("click", () => {
      if (currentTable) {
        currentTable.appendChild(renderKeyVal("", ""));
      }
    });
    const saveButton = element("button", null, "Speichern");

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
      const mergedProperties = ctx.selectStore.getMergedProperties();
      currentTable = element("table");
      const header = element("tr");
      header.appendChild(element("th", "editor-label", "Eigenschaft"));
      header.appendChild(element("th", "editor-value", "Wert"));
      header.appendChild(element("th", "editor-action", "Action"));
      currentTable.appendChild(header);
      Object.keys(mergedProperties).forEach((property) => {
        currentTable.appendChild(renderKeyVal(property, mergedProperties[property]));
      });

      editor.appendChild(currentTable);
      editor.appendChild(createActionButtons());

      // TODO add save button
      // TODO add + button
    } else {
      counter.innerHTML = "Keine Elemente ausgewählt";
      currentTable = null;
    }
  }

  return {
    renderEditor: function () {
      console.log("update selected features");
      updateSelectedFeatures();
      ctx.eventBus.addEventListener("selection_changed", updateSelectedFeatures);
    },
    hideEditor: function () {
      ctx.eventBus.removeEventListener("selection_changed", updateSelectedFeatures);
    }
  };
};
