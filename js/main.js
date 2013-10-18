chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('SmartNews.html', {
    'bounds': {
      'width': 400,
      'height': 500
    }
  });
  alert('hehe');
});