module.exports = function (ctx) {
  const editor = document.getElementById("data-editor");

  function element(tagName, html) {
    const element = document.createElement(tagName);
    if (html) {
      element.innerHTML = html;
    }
    return element;
  }

  const renderKeyVal = function (key, val) {
    const row = element("tr");
    const keyColumn = element("td", key);
    const valueColumn = element("td");
    const inputField = element("input");
    valueColumn.appendChild(inputField);
    inputField.value = val;
    row.appendChild(keyColumn);
    row.appendChild(valueColumn);
    return row;
  };

  function updateSelectedFeatures() {
    editor.innerHTML = "";
    if (ctx.selectStore.hasSelection()) {
      const mergedProperties = ctx.selectStore.getMergedProperties();
      const container = element("table");
      const header = element("tr");
      header.appendChild(element("th", "Eigenschaft"));
      header.appendChild(element("th", "Wert"));
      container.appendChild(header);
      Object.keys(mergedProperties).forEach((property) => {
        container.appendChild(renderKeyVal(property, mergedProperties[property]));
      });
      editor.appendChild(container);

      // TODO add save button
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
