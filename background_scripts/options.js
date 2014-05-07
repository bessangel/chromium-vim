var storageMethod = "sync",
    Settings = {},
    Options = {};

Object.prototype.flatten = function() {
	var _ret = {};
	for (var key in this) {
		if (this.hasOwnProperty(key)) {
      if (typeof this[key] === "object" && !Array.isArray(this[key])) {
        var _rec = this[key].flatten();
        for (var subKey in _rec) {
          if (!_rec.hasOwnProperty(subKey)) continue;
          
          _ret[subKey] = _rec[subKey];
        }
      } else {
        _ret[key] = this[key];
      }
    }
  }
	return _ret;
};

var settingsDefault = {
  positiveIntegers: {
    searchlimit: 20,
    scrollstep: 75,
  },
  booleans: {
    hud: true,
    regexp: true,
    linkanimations: true,
    ignorecase: true,
    ignorediacritics: true,
    autofocus: true,
    insertmappings: true,
    smoothscroll: true,
  },
  strings: {
    hintcharacters: "asdfgqwertzxcvb",
    mappings: "",
    blacklists: "",
    barposition: "top",
    commandBarCSS: '#cVim-link-container, .cVim-link-hint, #cVim-command-bar, #cVim-command-bar-mode, #cVim-command-bar-input, #cVim-command-bar-search-results, .completion-item, .completion-item .full, .completion-item .left, .completion-item .right, #cVim-hud, #cVim-status-bar {\n font-family: Helvetica, Helvetica Neue, Neue, Sans, Arial;\n font-size: 11pt !important;\n -webkit-font-smoothing: antialiased !important;\n}\n#cVim-link-container {\n position: absolute;\n pointer-events: none;\n width: 100%; left: 0;\n height: 100%; top: 0;\n z-index: 2147483647;\n}\n.cVim-link-hint {\n border-radius: 2px;\n color: #ddd;\n padding: 2px !important;\n font-size: 11pt !important;\n font-weight: 100 !important;\n display: inline-block !important;\n border: 1px solid #ccc;\n vertical-align: middle !important;\n text-align: center !important;\n box-shadow: 2px 2px 1px rgba(0,0,0,0.25) !important;\n position: absolute !important;\n transition: opacity 0.2s ease-out, background 0.2s ease-out;\n background: linear-gradient(to bottom, #636363 0%,#3f3f3f 39%,#3f3f3f 39%,#000000 100%);\n}\n.cVim-link-hint_match {\n color: #888;\n}\n#cVim-command-bar {\n position: fixed !important;\n z-index: 2147483646 !important;\n background-color: #1b1d1e !important;\n color: #bbb !important;\n display: none;\n box-sizing: content-box !important;\n box-shadow: 0 3px 3px rgba(0,0,0,0.4);\n left: 0 !important;\n width: 100% !important;\n height: 20px !important;\n}\n\n#cVim-command-bar-mode {\n display: inline-block;\n vertical-align: middle;\n box-sizing: border-box !important;\n padding-left: 2px !important;\n height: 100% !important;\n width: 10px !important;\n padding-top: 2px !important;\n color: #888 !important;\n}\n#cVim-command-bar-input {\n background-color: #1b1d1e !important;\n color: #bbb !important;\n height: 100% !important;\n right: 0 !important;\n top: 0 !important;\n width: calc(100% - 10px) !important;\n position: absolute !important;\n}\n#cVim-command-bar-search-results {\n position: fixed;\n width: 100% !important;\n overflow: hidden;\n z-index: 2147483647 !important;\n left: 0;\n box-shadow: 0 3px 3px rgba(0,0,0,0.4);\n background-color: rgba(44, 44, 44, 1);\n}\n.completion-item, .completion-item .full, .completion-item .left, .completion-item .right {\n text-overflow: ellipsis;\n padding: 1px;\n display: inline-block;\n box-sizing: border-box;\n vertical-align: middle;\n overflow: hidden;\n white-space: nowrap;\n}\n\n.completion-item {\n width: 100%; left: 0;\n color: #fff;\n}\n.completion-item .full {\n}\n.completion-item .left {\n color: #fff;\n width: 47%;\n}\n.completion-item .right {\n font-style: italic;\n color: #888;\n width: 47%;\n}\n#cVim-hud {\n background-color: rgba(28,28,28,0.9);\n position: fixed !important;\n transition: right 0.2s ease-out;\n z-index: 24724289;\n}\n#cVim-hud span {\n padding: 2px;\n padding-left: 4px;\n padding-right: 4px;\n color: #8f8f8f;\n font-size: 10pt;\n}\n'
  },
};

Options.compressedDefaults = settingsDefault.flatten();

chrome.storage.onChanged.addListener(function(changes) {
  if (changes.settings) {
    Settings = changes.settings.newValue;
  } else {
    Settings = Options.compressedDefaults;
  }
});

Options.refreshSettings = function(callback) {
  for (var key in this.compressedDefaults) {
    if (Settings[key] === undefined) {
      Settings[key] = this.compressedDefaults[key];
    }
  }
  if (callback) {
    callback(Settings);
  }
};

Options.saveSettings = function(settings, sendSettings) {
  Settings = settings;
  this.refreshSettings(function(data) {
    chrome.storage[storageMethod].set({settings: Settings});
    if (sendSettings) {
      Options.sendSettings();
    }
  });
};

Options.sendSettings = function() {
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {action: "refreshSettings"});
    }
  });
};

(function() {
  chrome.storage.sync.get("settings", function(data) {
    if (data.settings) {
      Settings = data.settings.flatten();
    }
    Options.refreshSettings();
  });
})();

chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.getSettings) {
    Options.refreshSettings(function(data) {
      chrome.tabs.sendMessage(sender.tab.id, {action: "sendSettings", settings: Settings});
    });
  } else if (request.saveSettings) {
    Options.saveSettings(request.settings, request.sendSettings);
  } else if (request.getDefaults) {
    chrome.tabs.sendMessage(sender.tab.id, {action: "sendSettings", settings: Options.compressedDefaults});
  }
});
