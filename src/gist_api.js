const jQuery = require("jquery");

function processGist(gist, success) {
  if (gist.files) {
    const firstFile = Object.keys(gist.files)[0];
    const fileContent = gist.files[firstFile];
    if (!fileContent.truncated) {
      success(fileContent.content);
    }
  }
}

function loadGist(gistId, success) {
  jQuery('#loading').fadeIn(300);
  const xhr = new XMLHttpRequest();
  xhr.open('GET', "https://api.github.com/gists/" + gistId, true);
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState === 4) {
      jQuery('#loading').fadeOut(300);
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        success(response);
      } else {
        console.log(e);
        console.log(xhr.status);
      }
    }
  };
  xhr.send();
}

module.exports = {loadGist};
