var saved = {};

var fns = {
  save : function(request, smCallback){
    var that = this;
    if(request.tab.url.indexOf('http') === -1) {
      if(smCallback)
        return smCallback();
    }
    if(request.tags.length === 0 && typeof saved[request.tab.url] !== 'undefined') {
      delete saved[request.tab.url]
      return smCallback(null);
    }
    var saveItem = {};
    if(saved[request.tab.url]) {
      saveItem = _.extend(saved[request.tab.url], {
        title: request.tab.title,
        tags: request.tags
      });
    } else {
      saveItem = {
        url: request.tab.url,
        title: request.tab.title,
        tags: request.tags
      }
    }
    saved[request.tab.url] = saveItem;
    async.waterfall([function(callback){
      chrome.storage.sync.set({
        bm : saved
      }, callback);
    }, function(callback){
      // if(!saveItem.imgPath) {
      //   $.post('http://localhost:3000/image', {
      //     url: request.tab.url
      //   }, function(resp){
      //     saveItem.imgPath = resp.url;
      //     saved[request.tab.url] = saveItem;
      //     callback();
      //   });
      // } else {
        callback();
      // }
    }], function(){
      smCallback(saveItem);
    })
  },

  getTags: function(request, cb) {
    var tags = _(saved).map(function(data){
      return data.tags;
    }).flatten().uniq().value();
    cb(tags);
  },

  getSaved: function(request, cb) {
    cb(saved);
  },

  populateSaved: function(cb){
    chrome.storage.sync.get('bm', function(response){
      saved = response.bm || {};
      if(cb)
        cb(null, saved);
    });
  },
}

fns.populateSaved();

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
  if(request && request.data && request.fn && fns[request.fn]) {
    fns[request.fn](request.data, sendResponse);
  }
});

/* omnibox */

var setDefault = function() {
  chrome.omnibox.setDefaultSuggestion({
    description : "Manage Markly"
  });
}

chrome.omnibox.onInputStarted.addListener(setDefault);

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    if(text.trim()) {
      var suggestions = _.filter(saved, function(data, url){
        var filtered = data.tags.filter(function(tag){
          return text.toLowerCase().indexOf(tag) > -1
            || tag.toLowerCase().indexOf(text) > -1;
        });
        return filtered.length > 0
          || data.title.toLowerCase().indexOf(text) > -1
          || data.url.toLowerCase().indexOf(text) > -1;
      });
      suggest(suggestions.map(function(suggestion){
        return {
          content: suggestion.url,
          description: suggestion.title + ' ('+ suggestion.url +') #: ' + suggestion.tags.join(', ')
        }
      }));

      chrome.omnibox.setDefaultSuggestion({
        description : "Search Markly for: " + text
      });
      return;
    }
    setDefault();
  }
);

chrome.omnibox.onInputEntered.addListener(function(newURL){
  if(newURL.indexOf(':') === -1)
    newURL = 'index.html#' + newURL;
  chrome.tabs.create({ url: newURL });
});

var clearDb = function() {
  chrome.storage.sync.clear();
  saved = {};
}