var tags = [];
var currentTab;

chrome.tabs.getSelected(null, function(tab) {
  currentTab = tab;
  $('#pagetitle').text(tab.title);
  populateTags(tab.title);
});

// existingTags

var updateAvailable = function() {
  chrome.extension.sendMessage({
    fn: 'getTags',
    data: {
      tags: tags
    }
  }, function(){
    console.log(arguments)
  });
}

$(document).on('click', '#tags li span', function(){
  var val = $(this).attr('title');
  tags = tags.filter(function(tag){
    return tag !== val;
  });
  renderTags();
});

$(document).on('keyup', '#tagInput', function(e){
  var target = $(this);
  if(e.keyCode === 13) {
    target.val().split(';').forEach(function(tag){
      tags.push(tag.trim());
    });
    target.val('').focus();
    renderTags();
  }
});

var renderTags = function() {
  var tagsHtml = tags.reduce(function(ret, tag){
    return ret + '<li><span title="' + tag + '">&times;</span> ' + tag + '</li>';
  }, '');
  $('#tags').html(tagsHtml);
  chrome.runtime.sendMessage({
    fn: 'save',
    data: {
      tab: currentTab,
      tags: tags
    }
  }, function(response){
    updateAvailable();
  });
}

var closeTimeout = setTimeout(function() {
  window.close();
}, 10000);

$(document).hover(function(){
  clearTimeout(closeTimeout)
})


var populateTags = function(title) {
  var commonWords = ["the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as","you","do","at","this","but","his","by","from","they","we","say","her","she","or","an","will","my","one","all","would","there","their","what","so","up","out","if","about","who","get","which","go","me","when","make","can","like","time","no","just","him","know","take","people","into","year","your","good","some","could","them","see","other","than","then","now","look","only","come","its","over","think","also","back","after","use","two","how","our","work","first","well","way","even","new","want","because","any","these","give","day","most","us",'this'];
  tags = _.uniq(title.replace(/['";:,.\/?\\-]/g, "").split(' ').filter(function(word){
    return commonWords.indexOf(word.toLowerCase()) === -1 && word.trim();
  }));
  renderTags();
}

var reload = function() {
  chrome.runtime.reload();
}