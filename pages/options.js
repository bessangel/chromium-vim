var log;
var Settings = {};
log = console.log.bind(console);

String.prototype.trimAround = function() {
  return this.replace(/^(\s+)?(.*\S)?(\s+)?$/g, "$2");
};

Settings.getrc = function() {
  var a = this.rcEl.value.split(/\n|;/).filter(function(e) {
    return e.trim() && /^(\s+)?set\s+\S.*$/.test(e);
  }).map(function(e) {
    return e.trimAround().replace(/(\s+)?".*/, "").replace(/(\s+)?=(\s+)?/, "=").split(/\s+/).slice(1);
  });
  return a;
};

Settings.parserc = function(values) {
  var config, isEnabled;
  var sValues = Object.keys(this.settings).map(function(e) { return e.toLowerCase(); });
  for (var i = 0, l = values.length; i < l; ++i) {
    config = values[i];
    if (config.length !== 1) continue;
    config = config[0];
    if (!/=/.test(config)) {
      isEnabled = true;
      if (sValues.indexOf(config) === -1) {
        config = config.replace(/^no/, "");
        isEnabled = false;
        if (sValues.indexOf(config) === -1) {
          continue;
        }
      }
      this.settings[config] = isEnabled;
    } else if (/=/.test(config)) {
      config = config.split("=");
      if (config.length === 2) {
        if (sValues.indexOf(config[0]) === -1) {
          continue;
        }
        this.settings[config[0]] = config[1];
      }
    }
  }
};

Settings.loadrc = function () {
  Settings.rcEl.value = this.settings.mappings;
  if (Settings.cssEl) {
    Settings.cssEl.setValue(this.settings.commandBarCSS);
  }
  document.getElementById("blacklists").value = this.settings.blacklists;
  Settings.parserc(Settings.getrc());
};

Settings.resetRelease = function() {
  if (this.resetClicked) {
    chrome.runtime.sendMessage({getDefaults: true});
  }
};

Settings.saveRelease = function() {
  if (this.saveClicked) {
    this.settings.commandBarCSS = this.cssEl.getValue();
    this.settings.blacklists = document.getElementById("blacklists").value;
    this.settings.mappings = Settings.rcEl.value;
    this.saveButton.value = "Saved";
    Settings.parserc(Settings.getrc());
    chrome.runtime.sendMessage({saveSettings: true, settings: Settings.settings, sendSettings: true});
    setTimeout(function () {
      this.saveButton.value = "Save";
    }.bind(this), 3000);
  }
};

Settings.onMouseDown = function(ev) {
  this.saveClicked = false;
  this.resetClicked = false;
  switch (ev.target.id) {
    case "save_button":
      this.saveClicked = true;
      break;
    case "reset_button":
      this.resetClicked = true;
      break;
    case "clearHistory":
      localStorage.search = "";
      localStorage.url    = "";
      localStorage.action = "";
      break;
  }
  this.saveButton.value = "Save";
};

Settings.editMode = function (e) {
  if (this.cssEl) {
    if (e.target.value === "Vim") {
      this.cssEl.setOption("keyMap", "vim");
    } else {
      this.cssEl.setOption("keyMap", "default");
    }
  }
};

Settings.init = function() {

  document.body.spellcheck = false;
  this.initialLoad = true;

  this.saveButton = document.getElementById("save_button");
  this.resetButton = document.getElementById("reset_button");
  this.rcEl = document.getElementById("mappings");
  this.editModeEl = document.getElementById("edit_mode");

  chrome.runtime.sendMessage({getSettings: true});

  document.addEventListener("mousedown", this.onMouseDown.bind(this), false);
  this.editModeEl.addEventListener("change", this.editMode.bind(this), false);
  this.saveButton.addEventListener("mouseup", this.saveRelease.bind(this), false);
  this.resetButton.addEventListener("mouseup", this.resetRelease.bind(this), false);

};

document.addEventListener("DOMContentLoaded", Settings.init.bind(Settings));

chrome.extension.onMessage.addListener(function(request) {
  if (request.action === "sendSettings") {
    Settings.settings = request.settings;
    if (Settings.initialLoad) {
      Settings.cssEl = CodeMirror.fromTextArea(document.getElementById("commandBarCSS"), {lineNumbers: true});
      Settings.initialLoad = false;
    }
    Settings.loadrc();
  }
});
