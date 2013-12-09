"use strict";

var Lib = Lib || {},
debug = Lib.debug("debug"); // product | debug

(function() {
  Lib.getWinConf(function(config) {
    console.log(config);
  })
})();

$(document).ready(function() {
  var listBox = $('#listBox'),
  gConf = {},
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
    showSpinner();
    listBox.empty();
    var i, len=gConf.keywords.length;
    // TODO : implement the max list count in config
    gConf.max_list_cnt = 50;
    gConf.hl = 'en';
    gConf.gl = 'us';

    gConf.list_cnt = Math.ceil(gConf.max_list_cnt/len);
    for(i=0; i<len; i++) {
      fetchNews(i);
    }
    hideSpinner();
  }

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

  function fetchNews(kidx) {     
    var keyword = gConf.keywords[kidx], 
    rssUrl = "http://news.google.com/news?hl=" + gConf.hl + "&gl=" + gConf.gl + "&newwindow=1&safe=off&q=" + encodeURI(keyword) + "&um=1&ie=UTF-8&output=rss",
    apiUrl = "https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=" + gConf.list_cnt + "&q=" + encodeURIComponent(rssUrl),
    xhr = Lib.xhr("GET", apiUrl, function(req) {
      var json = JSON.parse(req.responseText),
      entries = json.responseData.feed.entries,
      divNews, divBtnInner, divBtnTxt, divSpan, idx, title, txtTitle, link, keyInfo, desc, date, datetime, pubDate, txtDate, thumbnail, regExp, arrImg, imgUrl;

      for(idx in entries) {
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
  $('#menu_news').click(function() {
    gConf.selMenu = "news";
    loadList();
  });

  $('#menu_tweets').click(function() {
    gConf.selMenu = "tweets";
    loadList();
  });

  $('#menu_youtube').click(function() {
    gConf.selMenu = "youtube";
    loadList();
  });


  $('#link_options').click(function() {
    var i, len=gConf.keywords.length,
    input_keyword,
    div_lang_picker = $('#lang_picker'),
    lang_picker,
    lang_option,
    keyword_list = $('#keyword_list'),
    li_keyword = function(keyword) {
      return $('<li class="ui-li ui-li-static ui-btn-up-a ui-last-child"><div class="ui-grid-a"><div class="ui-block-a"><input type="text" name="keyword" data-inline="true" data-mini="true" value="' + keyword +'"></div><div class="ui-block-b"><a data-role="button" data-icon="delete" data-iconpos="notext"></a></div></div></li>');
    };

    if(div_lang_picker.find("select").length == 0) {
      lang_picker = $('<select name="select-choice-1" id="select-choice-1" data-mini="true"></select>');
      $.getJSON( "data/lang.json", function(data) {
        $.each(data, function(idx, option) {
           lang_option = $('<option value="' + option.value + '">' + option.name + '</optoin>'); 
           lang_picker.append(lang_option);
        });
      });
      div_lang_picker.append(lang_picker);
    }

    if(keyword_list.find("li").length == 0) {
      for(i=0; i<len; i++) {
        input_keyword =  li_keyword(gConf.keywords[i]);
        keyword_list.append(input_keyword);
      }
      keyword_list.trigger('create');
    }

    // prevent the event duplication 
    $('#btn_add_keyword').unbind("click");
    $('#btn_add_keyword').click(function() {
      var keyword_list = $('#keyword_list');
      keyword_list.find("li.ui-last-child").removeClass('ui-last-child');
      var input_keyword = li_keyword('');
      keyword_list.append(input_keyword);
      var moveScrollHeight = keyword_list[0].scrollHeight;
      keyword_list.scrollTop(moveScrollHeight);
      keyword_list.trigger('create');
      input_keyword.find("input[type=text]").focus();

      // prevent the event duplication 
      $('#keyword_list .ui-icon-delete').unbind("click");
      $('#keyword_list .ui-icon-delete').click(function() {
        $(this).trigger("remove_li", [$(this)]);
      });
    });
    
    // prevent the event duplication 
    $('#keyword_list .ui-icon-delete').unbind("click");
    $('#keyword_list .ui-icon-delete').click(function() {
        $(this).trigger("remove_li", [$(this)]);
    });

    $('#keyword_list').on("remove_li", function(event, button) {
        var li = button.parentsUntil($("li")).parent();
        if(li.hasClass('ui-last-child')) {
          li.prev().addClass('ui-last-child');
        }
        li.remove();    
    });

    // prevent the event duplication 
    $('#btn_save').unbind("click");
    $('#btn_save').click(function() {
      var keywords = $('input[name=keyword]'),
      kw_val, arr_kw = [], chk_dup = {};

      keywords.each(function(idx) {
        kw_val = $.trim($(this).val());
        if(kw_val != "" && chk_dup[kw_val] != "") {
          arr_kw.push(kw_val);
          chk_dup[kw_val] = "";
        }
      });

      var config= {
        keywords: arr_kw
      };

      Lib.setConf(config, function(config) {
        gConf = config;
        $.mobile.navigate("#list_page");
        loadList();
      });
    }); 
  });
});