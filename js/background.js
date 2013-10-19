chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('news_list.html', {
    bounds: {
      width: 400,
      height: 500
    },
    minWidth: 700,
    minHeight: 600,
    resizable: true
  });
});

chrome.runtime.onInstalled.addListener(function() { 
  //chrome.storage.local.set(object items, function callback);
});

chrome.runtime.onSuspend.addListener(function() { 
  // Do some simple clean-up tasks.
});