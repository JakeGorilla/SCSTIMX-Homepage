// important vars
var panels = {}; // contains names and Vue instances for tab contents
var tabHashes = []; // names available tabs
var keyFunctions = {}; // key functions and their Vue inst 
var fbaseUser = undefined; // firebase
var fbaseData = undefined; // firebase
var userPublicData = undefined;
var loginBtn = document.querySelector('#login');
var logoutBtn = document.querySelector('#logout');
var whoareyou = document.querySelector('#who');
var simplemde = new SimpleMDE({
  element: document.getElementById('a'),
  autosave: {
    enabled: true,
    uniqueId: "testingpage",
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
  storageBucket: 'scstimx-b5bb8.appspot.com',
  messagingSenderId: '322690969915'
};
firebase.initializeApp(config);
fbaseData = firebase.database();
firebase.auth().onAuthStateChanged(function (user) {
  // detect firebase login status
  if (user) {
    // User is signed in.
    fbaseUser = user;
    document.getElementById('firebaseui-auth-container').classList.add('hide');
    if (ui) ui.reset();
    loginBtn.classList.add('hide');
    logoutBtn.classList.remove('hide');
    whoareyou.innerText = 'You\'re: ' + fbaseUser.email;
    fbaseData.ref('/users/' + fbaseUser.uid).on('value', function (dataSnapshot) {
      userPublicData = dataSnapshot.val();
    });
  } else {
    fbaseUser = undefined;
    if (userPublicData) fbaseData.ref('/users/' + fbaseUser.uid).off();
    userPublicData = undefined;
    whoareyou.innerText = '';
    logoutBtn.classList.add('hide');
    loginBtn.classList.remove('hide');
    ui.start('#firebaseui-auth-container', uiConfig);
  }
});

function preview() {
  var raw = JSON.stringify(simplemde.value());
  var title = document.querySelector('#title');
  var content = simplemde.options.previewRender(JSON.parse(raw)); // actually use marked too
  var st = '';
  if (userPublicData) st = 'Author: ' + userPublicData.name;
  document.getElementById('p').innerHTML =
    '<div class="article-card mdl-card mdl-shadow--2dp">\
          <div class="mdl-card__title mdl-card--border">\
            <h2 class="mdl-card__title-text">' + title.value + '</h2>' + '\
            <h3 class="mdl-card__subtitle-text">' + st + '</h3>\
          </div>\
          <div class="mdl-card__supporting-text mdl-card--expand">' + content + '</div>\
          <div class="mdl-card__actions mdl-card--border">\
            <a onclick="expand(event)" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">\
              Read full content\
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
  var postContent = JSON.stringify(simplemde.value());
  var newPostId = fbaseData.ref('/publicPosts').push().key;
  var updates = {};
  fbaseData.ref('/users/' + fbaseUser.uid + '/posts/' + newPostId).set(true).then(function () {
    fbaseData.ref('/publicPosts/' + newPostId).set(postData);
    fbaseData.ref('/content/' + newPostId).set(postContent);
  }).then(function () {
    document.getElementById('p').innerHTML = '';
  }).catch(function (error) {
    console.log(error);
  });
}

function expand(event) {
  // console.log(event.currentTarget.parentElement);
  event.currentTarget.parentElement.parentElement.classList.toggle('expand');
}

function deletePost(event) {
  if (!fbaseUser) {
    alert('Login to delete post');
    return
  }
  if (confirm('確定要刪除文章嗎？')) {
    // console.log(event.currentTarget.parentElement);
    var pid = event.currentTarget.parentElement.id;
    if (latestPostData[pid].authorId != fbaseUser.uid) {
      alert('作者是別人');
      return
    }
    fbaseData.ref('/content/' + pid).remove().then(
      fbaseData.ref('/publicPosts/' + pid).remove().then(
        fbaseData.ref('/users/' + fbaseUser.uid + '/posts/' + pid).remove()
      )
    );
  }
}

// FirebaseUI config.
var uiConfig = {
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInFlow: 'popup',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  signInSuccessUrl: '#'
};
// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

function logout() {
  firebase.auth().signOut().then(function () {
    // Sign-out successful.
  }).catch(function (error) {
    // An error happened.
    console.log(error.message);
  });
}

var content = new Vue({
  el: '#oldPosts',
  data: {
    content: ''
  }
});

var latestPostData;
fbaseData.ref('/publicPosts').limitToLast(6).on('value', function (dataSnapshot) {
  var newContent = '';
  var articleList = dataSnapshot.val();
  function show(pidList) {
    var pid;
    if (pidList.length > 0) pid = pidList.pop();
    else {
      content.content = newContent;
      componentHandler.upgradeDom();
      return;
    }
    var title = articleList[pid].title;
    var authorId = articleList[pid].authorId;
    fbaseData.ref('/users/' + authorId).once('value').then(function (dataSnapshot) {
      var authorInfo = dataSnapshot.val();
      console.log(title);
      console.log(pid);
      console.log(authorInfo.name);
      fbaseData.ref('/content/' + pid).once('value').then(function (dataSnapshot) {
        var raw = dataSnapshot.val();
        var content = simplemde.options.previewRender(JSON.parse(raw)); // actually use marked too
        var st = 'Author: ' + authorInfo.name;
        newContent +=
          '<div id="' + pid + '" class="article-card mdl-card mdl-shadow--2dp">\
            <div class="mdl-card__title mdl-card--border">\
              <h2 class="mdl-card__title-text">' + title + '</h2>' + '\
              <h3 class="mdl-card__subtitle-text">' + st + '</h3>\
            </div>\
            <div class="mdl-card__supporting-text mdl-card--expand">' + content + '</div>\
            <div class="mdl-card__actions mdl-card--border">\
              <a onclick="expand(event)" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">\
                Read full content\
              </a>\
            </div>\
            <div onclick="deletePost(event)" class="mdl-card__menu">\
              <a href="#"><i class="material-icons">clear</i></a>\
            </div>\
          </div>';
        show(pidList);
      });
    });
  }
  console.log(Object.keys(articleList));
  if (JSON.stringify(latestPostData) === JSON.stringify(articleList)) {
    console.log('repeat');
    return;
  } else {
    latestPostData = articleList;
    show(Object.keys(articleList));
  }
});

var vuePosts = new Vue({
  el: '#vuePosts',
  data: {
    posts: [], // {order:bigger front,id,title,content,uname,ufrom,}
    rawPosts: []
  },
  watch: {
    rawPosts: function () {
      if (this.rawPosts.length = 0) return;
      var rawPost = this.rawPosts.shift;
      vuePosts.posts.push({ id: 'a', title: 'SCS', authorName: 'ccc', authorAffiliation: '', content: 'XXX' });
    }
  },
  components: {
    'post-card': {
      props: ['post'],
      template: '\
        <div :id="'+ 'post.id' + '" class="article-card mdl-card mdl-shadow--2dp">\
          <div class="mdl-card__title mdl-card--border">\
            <h2 class="mdl-card__title-text">'+ '{{post.title}}' + '</h2>\
            <h3 class="mdl-card__subtitle-text">Author: '+ '{{post.authorName}}' + '</h3>' + '{{post.authorAffiliation}}' + '\
          </div>\
          <div class="mdl-card__supporting-text mdl-card--expand">'+ '{{post.content}}' + '</div>\
          <div class="mdl-card__actions mdl-card--border">\
            <a onclick="expand(event)" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">\
              Read full content\
            </a>\
          </div>\
          <div onclick="deletePost(event)" class="mdl-card__menu">\
            <a href="#"><i class="material-icons">clear</i></a>\
          </div>\
        </div>'
    }
  }
});

