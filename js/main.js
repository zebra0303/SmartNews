"use strict";

var Lib = Lib || {},
debug = Lib.debug("debug"); // product | debug

Lib.domready(function() {
  var listBox = $('#listBox'),
  resizeListBox = function resizeListBox() {
    var listHeight = $( window ).height() - $('header').height() - $('footer').height() - 3;
    listBox.height(listHeight);
  };

  resizeListBox();
  Lib.getConf(function (config) {
    var i, len=config.keywords.length;
    for(i=0; i<len; i++) {
      fetchNews(i, config);
    }
  });

  $(window).resize(function() {
    resizeListBox();
    // save width & height
  });


  function sortAdd(node, id) {
    var arrNode = $('#listBox li'),
    i, len=arrNode.length, chkNode,
    isAdded = false;
    for(i=0; i<len; i++) {
      chkNode = arrNode[i];
      if($(chkNode).data('datetime') < $(node).data('datetime')) {
        $(node).insertBefore($(chkNode));
        isAdded = true;
        break;
      }
    }

    if(isAdded === false) {
      if(len > 0) {
        $(node).insertAfter($(arrNode.last()))
      }
      else {
        listBox.append($(node));
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
      divNews, divBtnInner, divBtnTxt, divSpan, idx, title, txtTitle, link, desc, date, datetime, pubDate, txtDate, thumbnail, regExp, arrImg, imgUrl;

      for(idx in entries) {
        divNews = $('<li data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="a" class="ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-btn-up-a"></li>');
        
        divBtnInner = $('<article class="ui-btn-inner ui-li"></article>');
        divBtnTxt = $('<div class="ui-btn-text"></div>');
        divSpan = $('<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>');

        date = new Date(entries[idx].publishedDate);
        datetime = date.getTime();
        divNews[0].dataset.datetime = datetime;

        pubDate = $('<p class="ui-li-aside ui-li-desc"></p>');
        txtDate = document.createTextNode(date.toLocaleString());
        pubDate.append(txtDate);

        title = $('<h3 class="ui-li-heading"></h3>');
        txtTitle = document.createTextNode(entries[idx].title);
        title.append(txtTitle);

        link = $('<a href="' + entries[idx].link + '" class="ui-link-inherit" target=_new></a>');

        desc = $('<p class="ui-li-desc"></p>');
        desc.html(entries[idx].contentSnippet);
        // get thumbnail image
        regExp = /<img src="([^"]+)"/g;
        arrImg = regExp.exec(entries[idx].content);
        if(arrImg !== null && arrImg.length == 2) { 
          imgUrl = 'http:' + arrImg[1];
          thumbnail = $('<img src="./img/blank.png" class="ui-li-thumb">');
          thumbnail.attr('id', 'thumbnail' + kidx + idx);
          Lib.loadImage(imgUrl, '#thumbnail'  + kidx + idx, function(tid, blob_uri, requested_uri) {
            $(tid).parents('li.ui-li').addClass('ui-li-has-thumb');
            $(tid).attr('src', blob_uri);
          });
          link.append(thumbnail);
        }

        link.append(pubDate);
        link.append(title);
        link.append(desc);
        divBtnTxt.append(link);
        divBtnInner.append(divBtnTxt);
        divBtnInner.append(divSpan);
        divNews.append(divBtnInner);

        sortAdd(divNews);
      }
      listBox.children().first().addClass('ui-first-child');
      listBox.children().last().addClass('ui-lasts-child');
    });

    xhr.send(null);
  }
});