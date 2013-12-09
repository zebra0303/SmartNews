chrome.app.runtime.onLaunched.addListener(function() {
  var winBounds = {}, 
  cfgKey = "snWinConf";
  chrome.storage.local.get(cfgKey, function(data) {
    winBounds = data[cfgKey];
    if(typeof winBounds.left == "undefined") {
      winBounds = {
        width: 600,
        height: 650,
        top: 0,
        left: 0
      };
    }
    chrome.app.window.create('newsList.html', {
      bounds: winBounds,
      minWidth: 300,
      minHeight: 300,
      resizable: true
    }, function(appWindow) {
      appWindow.setBounds(winBounds);
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