// Handlebars.registerHelper('encodeURL', function(url){
//   return encodeURIComponent(url);
// });

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
   .toString(16)
   .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var parser = document.createElement('a');
Handlebars.registerHelper('makeLink', function(url){
  parser.href = url;
  return '<a tabindex="-1" href="' + url + '">' + parser.host + '</a>';
});

var images = {};
Handlebars.registerHelper('makeImage', function(url){
  if(!images[url]) {
    var newImage = images[url] = new Image;
    newImage.src = "http://localhost:3000/images/" + encodeURIComponent(url) + ".jpg"
  }
  var uuid = guid();
  setTimeout(function(){
    $('#' + uuid).html(images[url]).css({
      'width': '100%',
      'display': 'block',
    });
  },1);
  return '<div id="' + uuid + '" class="imageWrapper" style="display: block; height: 121px;"></div>';
});

var Templates = {};

$('template').each(function(index, template){
  var target = $(template);
  Templates[target.attr('id')] = Handlebars.compile(target.html());
});

var Bookmarks = new (Backbone.Collection.extend({
  model: Backbone.Model.extend({
    idAttribute: 'url'
  }),
  save: function() {
    var data = {};
    this.toJSON().forEach(function(item){
      data[item.url] = item;
    });
    chrome.storage.sync.set({'bm': data});
  }
}));
var Session = new Backbone.Model();

var updateSearchSession = function() {
  Session.set('search', $(this).val().split(';').map(function(text){
    return text.trim();
  }));
}

$('#search').on('keyup', updateSearchSession);
$('#search').on('search', updateSearchSession);

var BookmarkView = new (Backbone.View.extend({
  session: Session,
  events: {
    'keyup .panel' : function(e) {
      if(e.keyCode === 13) {
        $(e.target).focus().trigger('click');
      }
    },
    'click .tags .editTags' : function(e) {
      console.log('editTags');
      var target = $(e.target).parents('.panel');
      target.toggleClass('editing');
      console.log(target);
      e.preventDefault();
      e.stopImmediatePropagation();
      $('#masonry').masonry();
      return false;
    },
    'click .tags li' : function(e) {
      var target = $(e.target).parents('.panel');
      if(target.hasClass('editing')) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
      }
      e.preventDefault();
      return false;
    },
    'click .remove' : function(e) {
      e.preventDefault();
      var target = $(e.target).parents('.panel');
      var url = target.data('url');
      var bookmark = Bookmarks.findWhere({url : url});
      if(bookmark && confirm('Remove ' + bookmark.get('title') + '?')) {
        Bookmarks.remove(bookmark.id);
        Bookmarks.save();
        e.preventDefault();
      }
      return false;
    },
    'keyup [contenteditable].newTag' : function(e) {
      if(e.keyCode === 13) {

      } else if(e.keyCode === 27) {
        console.log('esc')
      }
    },
    'click .panel:not(.editing)' : function(e) {
      var bookmark = this.collection.get($(e.target).data('url'));
      if(bookmark) {
        chrome.tabs.create({
          url: bookmark.get('url'),
          active: false
        })
      }
    },
    'click .newTag' : function(e) {
      var target = $(e.target);
      target.attr('contenteditable', true);
    },
  },
  collection: Bookmarks,
  template: Templates.listChild,
  render: function() {
    var data = this.collection.toJSON();
    var text = this.session.get('search');
    if(text) {
      data = text.map(function(text){
        return data.filter(function(data){
          var filtered = data.tags.filter(function(tag){
            return text.toLowerCase().indexOf(tag) > -1
              || tag.toLowerCase().indexOf(text) > -1;
          });
          return filtered.length > 0
            || data.title.toLowerCase().indexOf(text) > -1
            || data.url.toLowerCase().indexOf(text) > -1;
        });
      });
      data = _.uniq(_.flatten(data));
    }
    this.$el.empty().html(this.template({
      data: data
    }));
    if(text) {
      this.$el.highlight(text)
    }

    $('#masonry').masonry({
      columnWidth: 200,
      itemSelector: '.panel'
    })
  },
  initialize: function() {
    var that = this;
    this.session.on('all', function(){
      that.render();
    });
    this.collection.on('all', function(){
      that.render();
    });
  }
}))({
  el: $('#bookmarks')
});

// var searchFor = window.location.hash;
// if(searchFor) {
//   $('#search').val(searchFor.replace('#','')).trigger('keyup');
// }
setTimeout(function() {
  $('#search').focus();
}, 500);

var populateBookmarks = function() {
  chrome.storage.sync.get('bm', function(response){
    var bookmarks = response.bm || {};
    _.each(bookmarks, function(bookmark){
      Bookmarks.add(bookmark);
    })
  });
};
chrome.storage.onChanged.addListener(populateBookmarks);
populateBookmarks();

