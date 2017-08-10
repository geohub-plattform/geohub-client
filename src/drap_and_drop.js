module.exports = function (ctx) {
  const dropZone = document.getElementById("nav");

  function extractFiles(dt) {
    const files = [];
    if (dt.items) {
      for (let i = 0; i < dt.items.length; i++) {
        if (dt.items[i].kind === "file") {
          files.push(dt.items[i].getAsFile());
        }
      }
    } else {
      files.push(...dt.files);
    }
    return files;
  }

  if (dropZone) {
    dropZone.addEventListener("drop", event => {
      event.preventDefault();
      dropZone.classList.remove("dragover");
      const files = extractFiles(event.dataTransfer);
      files.forEach((file) => {
        const fileReader = new FileReader();
        fileReader.onloadend = function () {
          if (fileReader.readyState === FileReader.DONE) {
            try {
              ctx.api.addUserData(JSON.parse(fileReader.result));
            } catch (e) {
              ctx.snackbar("JSON Daten ungültig");
            }
          }
        };
        fileReader.readAsText(file);
      });
    });
    dropZone.addEventListener("dragenter", event => {
      event.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", event => {
      event.preventDefault();
      dropZone.classList.remove("dragover");
    });
    dropZone.addEventListener("dragover", event => {
      event.preventDefault();
    });
  }
};
