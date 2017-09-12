const jQuery = require("jquery");

function processGist(gist, success) {
  if (gist.files) {
    const firstFile = Object.keys(gist.files)[0];
    const fileContent = gist.files[firstFile];
    if (!fileContent.truncated) {
      success(JSON.parse(fileContent.content));
    }
  }
}

function loadGist(gistId, success) {
  jQuery('#loading').fadeIn(300);
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `https://api.github.com/gists/${gistId}`, true);
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState === 4) {
      jQuery('#loading').fadeOut(300);
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        processGist(response, success);
      } else {
        console.log(e);
        console.log(xhr.status);
      }
    }
  };
  xhr.send();
}

function saveGist(file, success) {
  jQuery('#loading').fadeIn(300);
  file.features.forEach((element) => {
    delete element.properties.geoHubId;
  }, this);
  const http = new XMLHttpRequest();
  const url = "https://api.github.com/gists";
  const schema = {
    "description": "GeoJson created with GeoHub - https://geohub-plattform.github.io/geohub-client/",
    "public": true,
    "files": {
      "export.geojson": {
        "content": JSON.stringify(file)
      }
    }
  };
  const content = JSON.stringify(schema);
  http.open("POST", url, true);
  http.setRequestHeader("Content-type", "application/json");
  http.onreadystatechange = function (e) {
    if (http.readyState === 4) {
      jQuery('#loading').fadeOut(300);
      if (http.status < 400) {
        const response = JSON.parse(http.responseText);
        success(response.html_url);
      } else {
        console.log(e);
        console.log(http.status);
      }
    }
  };
  http.send(content);
}


module.exports = {loadGist, saveGist};
