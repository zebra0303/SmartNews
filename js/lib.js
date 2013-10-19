"use strict";

function $(qry) {
  var arrNode = document.querySelectorAll(qry);

  return (arrNode.length === 1) ? arrNode[0] : arrNode;
}

var Lib = (function () {
  var _debug = {
    start : 0,
    end : 0,
    getChkTime : function () {
      return (Date.now) ? Date.now() : new Date().getTime();
    },
    getLoadTime : function() {
      return this.end - this.start; 
    },
    log: function (msg) {
      console.log(msg);
    }
  },  
  _debug_dummy = {
    getChkTime : function () {},
    getLoadTime : function() {},
    log: function (msg) {}
  },
  _xhr = function (method, url, callback) {   
    var xhr, i, len, ids;
    xhr = new XMLHttpRequest();

    xhr.onreadystatechange = (function (req) {
      return function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          callback(req);
        }
      };
      
    })(xhr);

    if(method === "") {
      method = "GET";
    } 
    xhr.open(method, url, true);
    return xhr;
  },
  _getData = function (key, callback) {
    chrome.storage.sync.get(key, function(data) {
      callback(data[key]);
    });
  },
  _setData = function(key, val, callback) {
      var obj = {};
      obj[key] = val;
      chrome.storage.sync.set(obj, callback);    
  },  
  _getConf = function (callback) {
    var config = {};
    _getData("snConf", function (data) {
      config = data;

      if(typeof config.keywords === "undefined" || config.keywords.length === 0) {
          var config= {
            keywords: ["우분투", "오픈소스", "행복"]
          };
          _setData("snConf", config, callback(config));
      }
      else {
        callback(config);
      } 
    });
  },
  _loadImage = function (uri, tid, callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = function() {
      callback(tid, window.webkitURL.createObjectURL(xhr.response), uri);
    }
    xhr.open('GET', uri, true);
    xhr.send();
  };

  function _domready(callback) {
    var isReady = false,
    document = window.document,
    chkBody = function () {
      if(!document.body) {
        setTimeout(chkBody, 1);
        return;
      }
      if(typeof callback === "function") {
        callback();  
      }
      
    },
    domContentLoaded = function() {
      if(isReady) {  
        return;
      }

      document.removeEventListener('DOMContentLoaded', domContentLoaded, false);
      document.removeEventListener('load', domContentLoaded, false);

      isReady = true;
      chkBody();
    };

    if(document.readyState !== "loading") {
      chkBody();
    }
    else {
      document.addEventListener('DOMContentLoaded', domContentLoaded, false);
      window.addEventListener('load', domContentLoaded, false);
    }
  }

  return {
    debug: function (mode) {
      return (mode == "debug") ? _debug : _debug_dummy;
    },
    getConf: _getConf,
    xhr: _xhr,
    loadImage: _loadImage,
    domready: _domready
  };

}());