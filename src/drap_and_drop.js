module.exports = function (ctx) {
  const dropZone = document.getElementById("map");
  const indicatorZone = document.getElementById("nav");

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

  function processFiles(files, handler) {
    files.forEach((file) => {
      const fileReader = new FileReader();
      fileReader.onloadend = function () {
        if (fileReader.readyState === FileReader.DONE) {
          try {
            handler(JSON.parse(fileReader.result));
          } catch (e) {
            ctx.snackbar("JSON Daten ungültig");
          }
        }
      };
      fileReader.readAsText(file);
    });
  }

  function handleDrop(event) {
    event.preventDefault();
    indicatorZone.classList.remove("dragover");
    const files = extractFiles(event.dataTransfer);
    processFiles(files, ctx.api.addUserData);
  }

  function handleDragEnter(event) {
    event.preventDefault();
    indicatorZone.classList.add("dragover");
  }

  function handleDragLeave(event) {
    event.preventDefault();
    indicatorZone.classList.remove("dragover");
  }

  function handleDropOver(event) {
    event.preventDefault();
  }

  if (dropZone) {
    dropZone.addEventListener("drop", handleDrop);
    dropZone.addEventListener("dragenter", handleDragEnter);
    dropZone.addEventListener("dragleave", handleDragLeave);
    dropZone.addEventListener("dragover", handleDropOver);
  }

  if (indicatorZone) {
    indicatorZone.addEventListener("dragover", handleDropOver);
    indicatorZone.addEventListener("drop", handleDropOver);
  }
};
