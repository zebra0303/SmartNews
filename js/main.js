"use strict";

var Lib = Lib || {},
debug = Lib.debug("product"); // product | debug

$(document).ready(function() {
  var listPage = $('#list-page'), 
  listBox = listPage.find('#list-box'),
  aPage = $('#analysis'),
  aSection = aPage.find('section'),
  adjLB = 3,
  adjAN = 32,
  gConf = {},
  chkUniq,
  resizeBox = function (page, box, adjust) {
    // TODO : need to remove the adjust argument - figure out why I should use?
    var heightHeader = page.find('header').height(),
    heightFooter = page.find('footer').height();

    if(heightHeader == null) {
      heightHeader = 0;
    }

    if(heightFooter == null) {
      heightHeader = 0;
    }

    var listHeight = $(window).height() - heightHeader - heightFooter - adjust;
    box.height(listHeight);
  },
  showSpinner = function (msg) {
    var text = msg ? msg : "Loading...";
    $.mobile.loading( 'show', {
      text: text,
      textVisible: true,
      textonly: false
    });
  },
  hideSpinner = function () {
    $.mobile.loading( "hide" );
  },
  alertMessage = function(message) {
    return $('<div class="alert"><h3>' + message + '<h3></div>');
  },
  i18n = function(node, msgId, type) {
    if(type == "link") {
      node = node.find('.ui-btn-text')
    }
    node.html(chrome.i18n.getMessage(msgId));
  };  

  resizeBox(listPage, listBox, adjLB);

  // i18n
  i18n($('#list-page #link-analysis'), 'btn_analysis', 'link');
  i18n($('#list-page #link-options'), 'btn_options', 'link');
  i18n($('#list-page #btn-reload'), 'btn_reload', 'link');
  // before rendering
  i18n($('#analysis #btn-back'), 'btn_back'); 
  i18n($('#options #btn-cancel'), 'btn_cancel');
  i18n($('#options #btn-save'), 'btn_save');
  i18n($('#options #btn-add-keyword'), 'btn_add_keyword');
  i18n($('#options #label-select-language'), 'label_select_language');
  i18n($('#options #label-list-count'), 'label_list_count');

  Lib.getConf(function (config) {
    gConf = config;
    loadList();
  });

  $(window).resize(function() {
    resizeBox(listPage, listBox, adjLB);
    resizeBox(aPage, aSection, adjAN);
  });

  function loadList() {
    chkUniq = {};
    showSpinner();
    listBox.empty();
    var i, len=gConf.keywords.length, isLast, firstInfo, blankMessage;

    if(len == 0) {
      blankMessage = alertMessage(chrome.i18n.getMessage('message_first_info'));
      listBox.append(blankMessage);
      hideSpinner();
    }

    for(i=0; i<len; i++) {
      isLast = (i == len-1) ? true : false;
      fetchNews(i, isLast);
    }
  }
 
  function sortAdd(node, id) {
    var arrNode = $('#list-box li'),
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

  var convUrl = function(url, keyword) {
    return 'http://tucan.cafe24.com/snews/?keyword=' + encodeURI(keyword) + '&lang=' + gConf.langCode + '&url=' + url;
  }

  var getRelNews = function(arrRelNews, keyword) {
    var rtnCode = "", relNews, i, len=arrRelNews.length, url, title,
    maxLen = (len > 3) ? 3 : len;

    for(i=0; i<maxLen; i++) {
      relNews = arrRelNews[i];
      url = convUrl(relNews.unescapedUrl, keyword);
      title = relNews.titleNoFormatting + " - " + relNews.publisher;
      rtnCode += '<a href="' + url + '" class="ui-link-inherit" target=_new title="' + title + '">• ' + title + '</a>\n';
    }

    return rtnCode;
  }

  function fetchNews(kidx, isLast) {    
    var keyword = gConf.keywords[kidx], apiUrl, xhr;
    apiUrl = "https://ajax.googleapis.com/ajax/services/search/news?v=1.0&rsz=" + gConf.listCnt + "&ned=" + gConf.langCode + "&q=" + encodeURI(keyword);
    xhr = Lib.xhr("GET", apiUrl, function(req) {
      var json = JSON.parse(req.responseText),
      results = json.responseData.results,
      newsItem, chkKey, divNews, divBtnInner, divBtnTxt, idx, title, link, keyInfo, desc, relNewsTxt, relNews, 
      dateOptions = {
        year: "numeric", month: "short",
        day: "numeric", hour: "2-digit", minute: "2-digit"
      },
      date, datetime, pubDate, txtDate, thumbnail, tbImg, regExp, arrImg, imgUrl, rdLink;

      for(idx in results) {
        newsItem = results[idx];
        // check duplicate article
        chkKey = newsItem.titleNoFormatting + newsItem.publishedDate;
        if(chkUniq[chkKey] == "") {
          continue;
        }
        chkUniq[chkKey] = "";

        divNews = $('<li data-corners="false" data-shadow="false" data-wrapperels="div" class="ui-li ui-btn ui-btn-up-a"></li>');
        
        divBtnInner = $('<article class="ui-btn-inner ui-li"></article>');
        divBtnTxt = $('<div class="ui-btn-text"></div>');

        date = new Date(newsItem.publishedDate);
        datetime = date.getTime();
        divNews[0].dataset.datetime = datetime;

        pubDate = $('<p class="ui-li-aside ui-li-desc"></p>');
        txtDate = document.createTextNode(date.toLocaleDateString('en-US', dateOptions));
        pubDate.append(txtDate);

        title = $('<h3 class="ui-li-heading"></h3>');
        title.html(newsItem.titleNoFormatting + ' - ' + newsItem.publisher);

        rdLink = convUrl(newsItem.url, keyword);
        link = $('<a href="' + rdLink + '" class="ui-link-inherit" target=_new></a>');
        link.append(title);

        desc = $('<p class="ui-li-desc"><strong></strong></p>');
        desc.html(newsItem.content);
        //desc.attr('title', newsItem.contentSnippet);

        // get thumbnail image
        if(typeof newsItem.image != "undefined") { 
          tbImg = newsItem.image;
          imgUrl = tbImg.tbUrl;
          thumbnail = $('<img src="./img/blank.png" width="' + tbImg.tbWidth + '" height="' + tbImg.tbHeight + '" class="ui-li-thumb">');
          thumbnail.attr('id', 'thumbnail' + kidx + idx);
          thumbnail.css('display', 'none');
          Lib.loadImage(imgUrl, '#thumbnail'  + kidx + idx, function(tid, blob_uri, requested_uri) {
            $(tid).parents('li.ui-li').addClass('ui-li-has-thumb');
            $(tid).attr('src', blob_uri);
            $(tid).css('display', '');
          });
          divBtnTxt.append(thumbnail);
        }

        divBtnTxt.append(link);
        divBtnTxt.append(desc);

        // related news
        if(typeof newsItem.relatedStories != "undefined") {
          relNewsTxt = getRelNews(newsItem.relatedStories, keyword);
          relNews = $('<p class="ui-li-desc rel-news">' + relNewsTxt + '</p>');
          divBtnTxt.append(relNews); 
        }

        divBtnTxt.append(pubDate);
        keyInfo = $('<p class="ui-li-desc keyword">[ keyword : ' + keyword + ' ]</p>');
        divBtnTxt.append(keyInfo);
        //divBtnTxt.append(link);
        divBtnInner.append(divBtnTxt);
        divNews.append(divBtnInner);
        sortAdd(divNews);

        // add click count for analysis
        link.unbind("click");
        link.click(function() {
          Lib.getData("sync", "snCnt", function (data) {
            var cntData = (typeof data == "undefined") ? {} : data ;
            if(typeof cntData[keyword] != "undefined") {
              cntData[keyword].cnt++;
            }
            else {
              cntData[keyword] = {};
              cntData[keyword].cnt = 1;
            }
            cntData[keyword].time = $.now();
            Lib.setData("sync", "snCnt", cntData);
          });
        });
      }

      if(isLast == true) {
        listBox.children().first().addClass('ui-first-child');
        listBox.children().last().addClass('ui-lasts-child');
        hideSpinner();
      }
    });

    xhr.send(null);
  }

  // menu events
  $('#btn-reload').click(function() {
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
  $('#link-analysis').click(function() {
    var sortData = function(data) {
      var sortedData = {}, 
      keywords = gConf.keywords,
      len = keywords.length,
      i, cnt, kw, maxCnt = 0,
      getScore = function (cnt, time) {
        var rtnVal,
        powNum = 0.905723664264,
        //86400000 = 24*60*60*1000
        dateGap = (typeof time == "undefined") ? 70 :  ($.now() - time)/86400000;
        rtnVal = (maxCnt == 0) ? 0 : Math.round(cnt/maxCnt*Math.pow(powNum, dateGap)*100);

        return rtnVal;
      }

      // get max cnt
      for(i=0; i<len; i++) {
        kw = keywords[i];
        if(typeof data[kw] == "undefined") {
          data[kw] = {};
          data[kw].cnt = 0;
        }     
        cnt = data[kw].cnt;
        if(cnt > maxCnt) {
          maxCnt = cnt;
        } 
      }

      if(len == 1) {
        data[keywords[0]].score = getScore(data[keywords[0]].cnt, data[keywords[0]].time);
      }

      keywords.sort(function(akw, bkw) {
        if(typeof data[akw].score == "undefined") {
          data[akw].score = getScore(data[akw].cnt, data[akw].time);
        }

        if(typeof data[bkw].score == "undefined") {
          data[bkw].score  = getScore(data[bkw].cnt, data[bkw].time);
        }

        return data[bkw].score  - data[akw].score;
      });

      sortedData.keywords = keywords;

      return sortedData;
    };

    // get analysis data
    Lib.getData("sync", "snCnt", function(cntData) {
      var sData, keywords, kw, len, i, cnt, 
      tblSort = $('#analysis #tbl-sort'),
      tbody, rank, tr, stick, stickWidth,
      date, score=0, dateOptions,
      thRank, tdKeyword, tdStick, tdCnt, tdDate, tdScore, 
      totalScore = 0, maxScore, maxWidth = 200, percentage;
      if(typeof cntData == "undefined") {
        cntData = {};
      }
      tbody = tblSort.find('tbody');
      tbody.empty();
      // draw chart
      sData = sortData(cntData);
      keywords = sData.keywords;
      len = keywords.length;
      if(len > 0) {
        dateOptions = {
            year: "numeric", month: "short",
            day: "numeric", hour: "2-digit", hour12: false, minute: "2-digit"
        };
        // get totalScore
        for(i=0; i<len; i++) {
          kw = keywords[i];
          totalScore += cntData[kw].score;
        }
        maxScore = cntData[keywords[0]].score;
        for(i=0; i<len; i++) {
          kw = keywords[i];
          rank = i+1;
          cnt =  cntData[kw].cnt;
          score = cntData[kw].score;
          date = (typeof cntData[kw].time == "undefined") ? '-' : new Date(cntData[kw].time).toLocaleTimeString('en-US', dateOptions);
          // calculate score
          stick = $('<div class="stick"></div>');
          stickWidth = (maxScore > 0) ? (score/maxScore)*maxWidth : 0;
          stick.css('width', stickWidth + 'px');
          
          percentage = (totalScore > 0) ? Math.round((score/totalScore)*10000)/100 : 0;
          thRank = $('<th class="al-right">' + rank + '</th>');
          tdKeyword = $('<td>' + kw + '</td>');
          tdStick = $('<td></td>');
          tdCnt = $('<td class="al-right">' + cnt + '</td>');
          tdDate = $('<td>' + date + '</td>');
          tdScore = $('<td class="al-right">' + score + '</td>');
          stick.append($('<span>' + percentage + '%</span>'));
          tdStick.append(stick);

          tr = $('<tr></tr>');
          tr.append(thRank);
          tr.append(tdKeyword);
          tr.append(tdStick);
          tr.append(tdCnt);
          tr.append(tdDate);
          tr.append(tdScore);
          tbody.append(tr);
        }
        tblSort.trigger('create');
      }
      resizeBox(aPage, aSection, adjAN + 43);
    });

    // prevent the event duplication 
    $('#btn-back').unbind('click');
    $('#btn-back').click(function() {
      resizeBox(listPage, listBox, adjLB + 37);
    });
  });

  $('#link-options').click(function() {
    var i, j, len=gConf.keywords.length,
    inputKeyword,
    divLangPicker = $('#lang-picker'),
    selLangCode,
    lang_option,
    selected,
    divCntPicker = $('#cnt-picker'),
    selListCnt,
    cntOption,
    keywordList = $('#keyword-list'),
    li_keyword = function(keyword) {
      return $('<li class="ui-li ui-li-static ui-btn-up-a ui-last-child"><div class="ui-grid-a"><div class="ui-block-a"><input type="text" name="keyword" data-inline="true" data-mini="true" value="' + keyword +'"></div><div class="ui-block-b"><a data-role="button" data-icon="delete" data-iconpos="notext" title="' + chrome.i18n.getMessage('delete') + '"></a></div></div></li>');
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

    if(divCntPicker.find("select").length == 0) {
      selListCnt = $('<select id="listCnt" name="listCnt"  data-mini="true"></select>');
      for(i=8; i>0; i--) {
        selected = (gConf.listCnt == i) ? " selected" : "";
        cntOption = $('<option' + selected + '>' + i + '</optoin>'); 
        selListCnt.append(cntOption);
      }
      divCntPicker.append(selListCnt);
      divCntPicker.trigger('create');
    }

    if(keywordList.find("li").length == 0) {
      for(j=0; j<len; j++) {
        inputKeyword =  li_keyword(gConf.keywords[j]);
        keywordList.append(inputKeyword);
      }
      keywordList.trigger('create');
    }

    // prevent the event duplication 
    $('#btn-add-keyword').unbind("click");
    $('#btn-add-keyword').click(function() {
      var keywordList = $('#keyword-list');
      keywordList.find("li.ui-last-child").removeClass('ui-last-child');
      var inputKeyword = li_keyword('');
      keywordList.append(inputKeyword);
      var moveScrollHeight = keywordList[0].scrollHeight;
      keywordList.scrollTop(moveScrollHeight);
      keywordList.trigger('create');
      inputKeyword.find("input[type=text]").focus();

      // prevent the event duplication 
      $('#keyword-list .ui-icon-delete').unbind("click");
      $('#keyword-list .ui-icon-delete').click(function() {
        $(this).trigger("remove_li", [$(this)]);
      });
    });
    
    $(document).unbind("keypress");
    $(document).keypress(function(e) {
        if(e.which == 13) {
          var focused = $(':focus');
          focused.trigger('click');
        }
    });
    
    // prevent the event duplication 
    $('#keyword-list .ui-icon-delete').unbind("click");
    $('#keyword-list .ui-icon-delete').click(function() {
        $(this).trigger("remove_li", [$(this)]);
    });

    $('#keyword-list').on("remove_li", function(event, button) {
        var li = button.parentsUntil($("li")).parent();
        if(li.hasClass('ui-last-child')) {
          li.prev().addClass('ui-last-child');
        }
        li.remove();    
    });

    // prevent the event duplication 
    $('#btn-save').unbind("click");
    $('#btn-save').click(function() {
      $(document).unbind("keypress");
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

      $('#btn-cancel').unbind('click');
      $('#btn-cancel').click(function() {
        $(document).unbind("keypress");
      });      

      var config= {
        listCnt: listCnt,
        langCode: langCode,
        keywords: arrKeyword
      };

      Lib.setConf(config, function(config) {
        gConf = config;
        $.mobile.navigate("#list-page");
        loadList();
      });
    }); 
  });
});