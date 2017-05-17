// important vars
var panels = {}; // contains names and Vue instances for tab contents
var tabHashes = []; // names available tabs
var keyFunctions = {}; // key functions and their Vue inst 
var fbaseUser = undefined; // firebase
var fbaseData = undefined; // firebase
var databaseUserData = { // For sync with database. Need to initalize, cannot be undefined any moment or vue can't got it
  name: '',
  affiliation: '',
  icon: '',
  info: '',
  email: '',
  posts: ''
};
var whoareyou = document.querySelector('#who');
var simplemde = new SimpleMDE({
  element: document.getElementById('a'),
  autosave: {
    enabled: true,
    uniqueId: "newsPosts",
    delay: 1000,
  },
  forceSync: true,
  status: ["autosave", "lines", "words", "cursor"], // Optional usage
});

// Initialize Firebase
var config = {
  apiKey: 'AIzaSyBSHtV-JlfcQ-PyronfInW25bLHxB65ftY',
  authDomain: 'scstimx-b5bb8.firebaseapp.com',
  databaseURL: 'https://scstimx-b5bb8.firebaseio.com',
  projectId: 'scstimx-b5bb8',
  storageBucket: 'scstimx-b5bb8.appspot.com'
};
firebase.initializeApp(config);
fbaseData = firebase.database();
// detect firebase login status
var uid;
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    uid = user.uid;
    fbaseData = firebase.database();
    fbaseUser = user;
    whoareyou.innerText = 'You\'re: ' + fbaseUser.email;
    databaseUserData.name = fbaseUser.displayName;
    databaseUserData.email = fbaseUser.email;
    databaseUserData.icon = fbaseUser.photoURL;
  } else {
    // unset one by one for databind
    fbaseData.ref('/users/' + uid).off();
    fbaseData.ref('/privilegedUsers/' + uid).off();
    Object.keys(databaseUserData).forEach(function (key) {
      databaseUserData[key] = '';
    });
    postPrivilege = false;
    uid = undefined;
    fbaseUser = undefined;
    fbaseData = firebase.database();
    whoareyou.innerText = '';
  }
});

// SHOW
var newsPosts = new Vue({
  el: '#newsPosts',
  data: {
    posts: [], // {order:bigger front,id,title,content,uname,ufrom,}
    postKeys: [],
    rawPosts: [],
    mostShow: 6,
    refToPosts: fbaseData.ref('/news'),
    refToContents: fbaseData.ref('/newsContent')
  },
  computed: {
    showMessage: function () {
      if (this.posts.length === 0) return true;
      else return false;
    },
    message: function () {
      if (this.posts.length === 0) return 'No Data';
      else '';
    }
  },
  beforeMount: function () {
    this.refToPosts.limitToLast(this.mostShow).once('value', function (dataSnapshot) {
      var tmp = [];
      dataSnapshot.forEach(function (rawPost) {
        tmp.push(rawPost);
      });
      this.rawPosts = tmp;
    }, this);
    this.refToPosts.limitToLast(this.mostShow).on('child_added', function (dataSnapshot/*, keyOfThePrecedingOne*/) {
      console.log('got add');
      this.rawPosts.push(dataSnapshot);
    }, this);
    this.refToPosts.limitToLast(this.mostShow).on('child_removed', function (dataSnapshot/*, keyOfTheRemovedOne*/) {
      console.log('got removed');
      var index = this.postKeys.indexOf(dataSnapshot.key);
      if (index >= 0) {
        this.posts.splice(index, 1);
        this.postKeys = this.posts.map(function (post) { return post.id; });
      } else {
        for (var i = 0; i < this.rawPosts.length; i++) {
          if (rawPosts[i].key == dataSnapshot.key) {
            this.rawPosts.splice(i, 1);
          }
        }
      }
    }, this);
    this.refToPosts.limitToLast(this.mostShow).on('child_changed', function (dataSnapshot/*, keyOfThePrecedingOne*/) {
      console.log('got changed');
      var index = this.postKeys.indexOf(dataSnapshot.key);
      if (index >= 0) {
        this.posts.splice(index, 1);
      } else {
        for (var i = 0; i < this.rawPosts.length; i++) {
          if (rawPosts[i].key == dataSnapshot.key) {
            this.rawPosts.splice(i, 1);
          }
        }
      }
      this.rawPosts.push(dataSnapshot);
    }, this);
  },
  watch: {
    rawPosts: function () {
      if (this.rawPosts.length == 0) return;
      var rawPost = this.rawPosts.pop();
      var post = {};
      post.id = rawPost.key;
      rawPost = rawPost.val();
      post.time = rawPost.time;
      post.title = rawPost.title;
      post.authorId = rawPost.authorId;
      var refToContents = this.refToContents;
      fbaseData.ref('/users/' + post.authorId).once('value').then(function (dataSnapshot) {
        var authorInfo = dataSnapshot.val();
        post.authorName = authorInfo.name;
        if (authorInfo.affiliation) {
          post.authorAffiliation = authorInfo.affiliation;
        } else post.authorAffiliation = '';
        refToContents.child(post.id).once('value').then(function (dataSnapshot) {
          post.content = simplemde.options.previewRender(JSON.parse(dataSnapshot.val()));
          newsPosts.insert(post);
        });
      });
    }
  },
  methods: {
    trueLocationOf: function (element, sortedBy, compareBy, start, endAt) {
      compareBy = compareBy || sortedBy;
      start = start || 0;
      endAt = endAt || this.posts.length;
      var pivot = parseInt(start + (endAt - start) / 2, 10);
      if (endAt - start <= 1 || this.posts[pivot][compareBy] === element[compareBy]) return [pivot, this.posts[pivot][compareBy] === element[compareBy]];
      if (this.posts[pivot][sortedBy] > element[sortedBy]) {
        return this.trueLocationOf(element, sortedBy, compareBy, pivot, endAt);
      } else {
        return this.trueLocationOf(element, sortedBy, compareBy, start, pivot);
      }
    },
    locationOf: function (element, sortedBy, compareBy, start, endAt) {
      compareBy = compareBy || sortedBy;
      start = start || 0;
      endAt = endAt || this.posts.length;
      return this.trueLocationOf(element, sortedBy, compareBy, start, endAt)[0];
    },
    insert: function (post) {
      if (this.posts.length == 0) this.posts = [post];
      else if (post.id == this.posts[0].id) return;
      else if (post.time > this.posts[0].time) this.posts.unshift(post);
      else if (post.time < this.posts[this.posts.length - 1].time) this.posts.push(post);
      else {
        this.posts.splice((this.locationOf(post, 'time') + 1), 0, post);
      }
      this.postKeys = this.posts.map(function (post) {
        return post.id;
      });
    }
  },
  components: {
    'post-card': {
      props: ['post'],
      methods: {
        expand: function () {
          var card = this.$refs.card;
          card.querySelector('.mdl-card__supporting-text').scrollTop = 0;
          card.classList.toggle('expand');
          var scrolling = setInterval(function () { card.scrollIntoView(); }, 1);
          setTimeout(function () { clearInterval(scrolling); }, 500);
        },
        deletePost: function () {
          if (!fbaseUser) {
            alert('Login to delete post');
            return
          }
          if (confirm('確定要刪除文章嗎？')) {
            // console.log(this.$refs.card);
            var pid = this.post.id;
            var postIndex = this.$parent.postKeys.indexOf(pid);
            var refToPosts = this.$parent.refToPosts;
            var refToContents = this.$parent.refToContents;
            if (this.$parent.posts[postIndex].authorId != fbaseUser.uid) {
              alert('作者是別人');
              return
            }
            refToPosts.child(pid).remove().then(
              refToContents.child(pid).remove().then(
                fbaseData.ref('/users/' + fbaseUser.uid + '/posts/' + pid).remove()
              )
            );
          }
        }
      },
      template: '\
        <div ref="card" :id="'+ 'post.id' + '" class="article-card mdl-card mdl-shadow--2dp">\
          <div class="mdl-card__title mdl-card--border">\
            <h2 class="mdl-card__title-text">'+ '{{post.title}}' + '</h2>\
            <h3 class="mdl-card__subtitle-text">Author: '+ '{{post.authorName}}' + '</h3>\
            <h3 v-show="' + 'post.authorAffiliation' + '" class="mdl-card__subtitle-text">From: ' + '{{post.authorAffiliation}}' + '</h3>\
          </div>\
          <div class="mdl-card__supporting-text mdl-card--expand" v-html="'+ 'post.content' + '"></div>\
          <div class="mdl-card__actions mdl-card--border">\
            <a @click="expand" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">\
              Toggle full content\
            </a>\
          </div>\
          <div @click="deletePost" class="mdl-card__menu">\
            <a><i class="material-icons">clear</i></a>\
          </div>\
        </div>'
    }
  }
});

function expand(event) {
  // console.log(event.currentTarget.parentElement);
  event.currentTarget.parentElement.parentElement.querySelector('.mdl-card__supporting-text').scrollTop = 0;
  event.currentTarget.parentElement.parentElement.classList.toggle('expand');
}
function preview() {
  var raw = JSON.stringify(simplemde.value());
  var title = document.querySelector('#title').value;
  var content = simplemde.options.previewRender(JSON.parse(raw)); // actually use marked too
  var sn = '';
  var sf = '';
  if (databaseUserData) {
    sn = '<h3 class="mdl-card__subtitle-text">Author: ' + databaseUserData.name + '</h3>';
    if (databaseUserData.affiliation) sf = '<h3 class="mdl-card__subtitle-text">Author: ' + databaseUserData.affiliation + '</h3>';
  }
  document.getElementById('p').innerHTML = '\
    <div class="article-card mdl-card mdl-shadow--2dp">\
      <div class="mdl-card__title mdl-card--border">\
        <h2 class="mdl-card__title-text">'+ title + '</h2>' + sn + sf + '\
      </div>\
      <div class="mdl-card__supporting-text mdl-card--expand">'+ content + '</div>\
      <div class="mdl-card__actions mdl-card--border">\
        <a onclick="expand(event)" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">\
          Toggle full content\
        </a>\
      </div>\
    </div>';
  componentHandler.upgradeDom();
}
function post() {
  if (!fbaseUser) {
    alert("Login to post");
    return;
  }
  var postData = {
    time: firebase.database.ServerValue.TIMESTAMP,
    title: document.querySelector('#title').value,
    authorId: fbaseUser.uid
  };
  if (!postData.title) {
    alert("Need a TITLE");
    document.querySelector('#title').focus();
    return;
  }
  if (!postData.authorId) {
    console.log('error');
    return;
  }
  var postContent = JSON.stringify(simplemde.value());
  var refToPosts = newsPosts.refToPosts;
  var refToContents = newsPosts.refToContents;
  var newPostId = refToPosts.push().key;
  var updates = {};
  fbaseData.ref('/users/' + fbaseUser.uid + '/posts/' + newPostId).set({ type: 'news', public: true }).then(function () {
    refToPosts.child(newPostId).set(postData);
    refToContents.child(newPostId).set(postContent);
  }).then(function () {
    document.getElementById('p').innerHTML = '';
  }).catch(function (error) {
    console.log(error);
  });
}