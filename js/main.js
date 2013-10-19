"use strict";

var Lib = Lib || {},
debug = Lib.debug("debug"); // product | debug

Lib.domready(function() {
  var listBox = $('#listBox');
  listBox.style.height = window.innerHeight + "px";

  Lib.getConf(function (config) {
    var i, len=config.keywords.length;
    for(i=0; i<len; i++) {
      fetchNews(i, config);
    }

    //add event listners
    $('#menuNews').addEventListener('click', function() {
      listBox.innerHTML = "";
      for(i=0; i<len; i++) {
        fetchNews(i, config);
      }
      debug.log('callback - reload ');
    });
  });

  function sortAdd(node, id) {
    var arrNode = $('#listBox div.news'),
    i, len=arrNode.length, chkNode,
    isAdded = false;
    for(i=len-1; i>=0; i--) {
      chkNode = arrNode[i];
      if(chkNode.dataset.datetime > node.dataset.datetime) {
        listBox.insertBefore(node, chkNode.nextSibling);
        isAdded = true;
        break;
      }
    }

    if(isAdded === false) {
      if(len > 0) {
        listBox.insertBefore(node, arrNode[0]);
      }
      else {
        listBox.appendChild(node);
      }
    }
  }

  function fetchNews(kidx, config) {
    var keyword = config.keywords[kidx], 
    rssUrl = "http://news.google.com/news?hl=" + config.hl + "&gl=" + config.gl + "&newwindow=1&safe=off&q=" + encodeURI(keyword) + "&um=1&ie=UTF-8&output=rss",
    apiUrl = "https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&q=" + encodeURIComponent(rssUrl),
    xhr = Lib.xhr("GET", apiUrl, function(req) {
      var json = JSON.parse(req.responseText),
      entries = json.responseData.feed.entries,
      divNews, idx, title, link, desc, date, datetime, pubDate, txtDate, thumbnail, regExp, arrImg, imgUrl;

      for(idx in entries) {
        divNews = document.createElement("div");
        date = new Date(entries[idx].publishedDate);
        datetime = date.getTime();
        divNews.dataset.datetime = datetime;
        divNews.className = "news";

        pubDate = document.createElement("time");
        txtDate = document.createTextNode(date.toLocaleString());
        pubDate.appendChild(txtDate);

        title = document.createTextNode(entries[idx].title);
        link = document.createElement("a");
        link.setAttribute('href', entries[idx].link);
        link.setAttribute('target', "_new");
        link.appendChild(title);

        desc = document.createElement("summary");
        desc.innerHTML = entries[idx].contentSnippet;
        
        divNews.appendChild(link);
        divNews.appendChild(pubDate);
        divNews.appendChild(desc);
        divNews.appendChild(document.createElement("br"));
        sortAdd(divNews);

        // get thumbnail image
        regExp = /<img src="([^"]+)"/g;
        arrImg = regExp.exec(entries[idx].content);
        if(arrImg !== null && arrImg.length == 2) { 
          imgUrl = 'http:' + arrImg[1];
          thumbnail = document.createElement("img");  
          thumbnail.style.display = 'inline';
          thumbnail.setAttribute('id', 'thumbnail' + kidx + idx);
          Lib.loadImage(imgUrl, '#thumbnail'  + kidx + idx, function(tid, blob_uri, requested_uri) {
            $(tid).setAttribute('src', blob_uri);
          });
          divNews.appendChild(document.createElement("br"));
          divNews.appendChild(thumbnail);
        }
      }
    });

    xhr.send(null);
  }
});