chrome.app.runtime.onLaunched.addListener(function() {
  var bounds = {}, 
  cfgKey = "snWinConf";
  chrome.storage.local.get(cfgKey, function(data) {
    bounds = data[cfgKey];
    console.log(bounds);
    if(typeof bounds.width == "undefined" || typeof bounds.height == "undefined" || typeof bounds.left == "undefined" || typeof bounds.top == "undefined") {
      bounds = {
        width: 600,
        height: 650,
        left: 0,
        top: 0
      };
    }

    chrome.app.window.create('news_list.html', {
      bounds: {
        width: bounds.width,
        height: bounds.height
      },
      minWidth: 300,
      minHeight: 300,
      resizable: true
    }, function(appWindow) {
      appWindow.setBounds(bounds);
      //save the bounds data when the window close
      appWindow.onClosed.addListener(function() {
        var obj = {};
        obj['snWinConf'] = appWindow.getBounds();
        chrome.storage.local.set(obj);    
      });  
    });
  });

}); 

chrome.runtime.onInstalled.addListener(function() { 
  //chrome.storage.local.set(object items, function callback);
});

chrome.runtime.onSuspend.addListener(function() { 
  // Do some simple clean-up tasks.
});