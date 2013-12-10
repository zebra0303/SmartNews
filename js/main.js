"use strict";

var Lib = Lib || {},
debug = Lib.debug("product"); // product | debug

$(document).ready(function() {
  var listBox = $('#listBox'),
  gConf = {},
  chkUniq,
  resizeListBox = function resizeListBox() {
    var listHeight = $( window ).height() - $('header').height() - $('footer').height() - 3;
    listBox.height(listHeight);
  };
  resizeListBox();

  Lib.getConf(function (config) {
    gConf = config;
    loadList();
  });

  $(window).resize(function() {
    resizeListBox();
  });
 
  function loadList() {
    chkUniq = {};
    showSpinner();
    listBox.empty();
    var i, len=gConf.keywords.length;

    for(i=0; i<len; i++) {
      fetchNews(i);
    }
    hideSpinner();
  }

  function sortAdd(node, id) {
    var arrNode = $('#listBox li'),
    i, len=arrNode.length, chkNode,
    isAdded = false;
    for(i=len; i>=0; i--) {
      chkNode = arrNode[i];
      if($(chkNode).data('datetime') > $(node).data('datetime')) {
        $(node).insertAfter($(chkNode));
        isAdded = true;
        break;
      }
    }

    if(isAdded === false) {
      if(len > 0) {
        $(node).insertBefore($(arrNode.first()))
      }
      else {
        listBox.append($(node));
      }
    }
  }

  function fetchNews(kidx) {     
    var keyword = gConf.keywords[kidx], 
    rssUrl = "http://news.google.com/news?hl=" + gConf.langCode + "&newwindow=1&safe=on&q=" + encodeURI(keyword) + "&um=1&ie=UTF-8&output=rss",
    apiUrl = "https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=" + gConf.listCnt + "&q=" + encodeURIComponent(rssUrl),
    xhr = Lib.xhr("GET", apiUrl, function(req) {
      var json = JSON.parse(req.responseText),
      entries = json.responseData.feed.entries,
      chkKey, divNews, divBtnInner, divBtnTxt, divSpan, idx, title, txtTitle, link, keyInfo, desc, date, datetime, pubDate, txtDate, thumbnail, regExp, arrImg, imgUrl;

      for(idx in entries) {
        // check duplicate article
        chkKey = entries[idx].title + entries[idx].publishedDate;
        if(chkUniq[chkKey] == "") {
          continue;
        }
        chkUniq[chkKey] = "";

        divNews = $('<li data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="a" class="ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-btn-up-a"></li>');
        
        divBtnInner = $('<article class="ui-btn-inner ui-li"></article>');
        divBtnTxt = $('<div class="ui-btn-text"></div>');
        divSpan = $('<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>');

        date = new Date(entries[idx].publishedDate);
        datetime = date.getTime();
        divNews[0].dataset.datetime = datetime;

        pubDate = $('<p class="ui-li-aside ui-li-desc"></p>');
        txtDate = document.createTextNode(date.toLocaleDateString());
        pubDate.append(txtDate);

        title = $('<h3 class="ui-li-heading"></h3>');
        txtTitle = document.createTextNode(entries[idx].title);
        title.append(txtTitle);
        title.attr('title', entries[idx].title + " [keyword : " + keyword + "]");

        link = $('<a href="' + entries[idx].link + '" class="ui-link-inherit" target=_new></a>');

        desc = $('<p class="ui-li-desc"><strong></strong></p>');
        desc.html(entries[idx].contentSnippet);

        //keyInfo = $('<p class="ui-li-desc"></p>');
        //keyInfo.html("keyword : " + keyword);
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
        //link.append(keyInfo);
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

  function showSpinner(msg) {
    var text = msg ? msg : "Loading...";
    $.mobile.loading( 'show', {
      text: text,
      textVisible: true,
      theme: 'a',
      textonly: false
    });
  }

  function hideSpinner() {
    $.mobile.loading( "hide" );
  }  

  // menu events
  $('#menuNews').click(function() {
    gConf.selMenu = "news";
    loadList();
  });
  
  /*
  $('#menuTweets').click(function() {
    gConf.selMenu = "tweets";
    loadList();
  });

  $('#menuYoutube').click(function() {
    gConf.selMenu = "youtube";
    loadList();
  });
  */

  $('#linkOptions').click(function() {
    var i, j, len=gConf.keywords.length,
    inputKeyword,
    divLangPicker = $('#langPicker'),
    selLangCode,
    lang_option,
    selected,
    div_cntPicker = $('#cntPicker'),
    selListCnt,
    cntOption,
    keywordList = $('#keywordList'),
    li_keyword = function(keyword) {
      return $('<li class="ui-li ui-li-static ui-btn-up-a ui-last-child"><div class="ui-grid-a"><div class="ui-block-a"><input type="text" name="keyword" data-inline="true" data-mini="true" value="' + keyword +'"></div><div class="ui-block-b"><a data-role="button" data-icon="delete" data-iconpos="notext"></a></div></div></li>');
    };

    if(divLangPicker.find("select").length == 0) {
      $.getJSON( "data/lang.json", function(data) {
        selLangCode = $('<select id="langCode" name="langCode" data-mini="true"></select>');
        $.each(data, function(idx, option) {
           selected = (gConf.langCode == option.value) ? " selected" : "";
           lang_option = $('<option value="' + option.value + '"' + selected + '>' + option.name + '</optoin>'); 
           selLangCode.append(lang_option);
        });
        divLangPicker.append(selLangCode);
        divLangPicker.trigger('create');
      });
    }

    if(div_cntPicker.find("select").length == 0) {
      selListCnt = $('<select id="listCnt" name="listCnt"  data-mini="true"></select>');
      for(i=10; i>0; i--) {
        selected = (gConf.listCnt == i) ? " selected" : "";
        cntOption = $('<option' + selected + '>' + i + '</optoin>'); 
        selListCnt.append(cntOption);
      }
      div_cntPicker.append(selListCnt);
      div_cntPicker.trigger('create');
    }

    if(keywordList.find("li").length == 0) {
      for(j=0; j<len; j++) {
        inputKeyword =  li_keyword(gConf.keywords[j]);
        keywordList.append(inputKeyword);
      }
      keywordList.trigger('create');
    }

    // prevent the event duplication 
    $('#btn_add_keyword').unbind("click");
    $('#btn_add_keyword').click(function() {
      var keywordList = $('#keywordList');
      keywordList.find("li.ui-last-child").removeClass('ui-last-child');
      var inputKeyword = li_keyword('');
      keywordList.append(inputKeyword);
      var moveScrollHeight = keywordList[0].scrollHeight;
      keywordList.scrollTop(moveScrollHeight);
      keywordList.trigger('create');
      inputKeyword.find("input[type=text]").focus();

      // prevent the event duplication 
      $('#keywordList .ui-icon-delete').unbind("click");
      $('#keywordList .ui-icon-delete').click(function() {
        $(this).trigger("remove_li", [$(this)]);
      });
    });
    
    // prevent the event duplication 
    $('#keywordList .ui-icon-delete').unbind("click");
    $('#keywordList .ui-icon-delete').click(function() {
        $(this).trigger("remove_li", [$(this)]);
    });

    $('#keywordList').on("remove_li", function(event, button) {
        var li = button.parentsUntil($("li")).parent();
        if(li.hasClass('ui-last-child')) {
          li.prev().addClass('ui-last-child');
        }
        li.remove();    
    });

    // prevent the event duplication 
    $('#btn_save').unbind("click");
    $('#btn_save').click(function() {
      var listCnt = $('select#listCnt').val(),
      langCode = $('select#langCode').val(),
      keywords = $('input[name=keyword]'),
      kwVal, arrKeyword = [], chk_dup = {};

      keywords.each(function(idx) {
        kwVal = $.trim($(this).val());
        if(kwVal != "" && chk_dup[kwVal] != "") {
          arrKeyword.push(kwVal);
          chk_dup[kwVal] = "";
        }
      });

      var config= {
        listCnt: listCnt,
        langCode: langCode,
        keywords: arrKeyword
      };

      Lib.setConf(config, function(config) {
        gConf = config;
        $.mobile.navigate("#listPage");
        loadList();
      });
    }); 
  });
});