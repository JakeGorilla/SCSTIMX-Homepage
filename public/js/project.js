// important vars
var fbaseUser = undefined; // Firebase current user
var fbaseData = undefined; // Firebase database ref
var databaseUserData = { // For sync with database. Need to initalize, cannot be undefined any moment or vue can't got it
  name: '',
  affiliation: '',
  icon: '',
  info: '',
  email: '',
  posts: ''
};
// DOM, Vue, functions
var panels = {}; // contains names and Vue instances for tab contents
var tabHashes = []; // names of available tabs (their #hashvalue)
var stateManager = {}; // Vue instances state managers
var drawer = {}; // all vues in drawer
var dialogs = {}; // all dialogs, lot's of display related things
var keyFunctions = {}; // key functions and their Vue inst
var singleFunctions = {
  dimOn: function () {
    document.getElementById('dim').style.display = 'block';
  },
  dimOff: function (event) {
    if (event && event.target.id != 'dim') return;
    document.getElementById('dim').style.display = 'none';
  },
  authNotification: {
    bar: document.querySelector('#infoToast'),
    show: function (message, time) {
      this.bar.MaterialSnackbar.showSnackbar({
        message: message,
        timeout: time,
        actionHandler: singleFunctions.authNotification.hide,
        actionText: 'X'
      });
    },
    hide: function () {
      singleFunctions.authNotification.bar.classList.remove('mdl-snackbar--active');
    }
  }
};

// for querySelectorAll
// forEach, could be shipped as part of an Object Literal/Module
// Usage: optionally change the scope as final parameter too, like ECMA5
var forEach = function (array, callback, scope) {
  for (var i = 0; i < array.length; i++) {
    callback.call(scope, array[i], i); // passes back stuff we need
  }
};

//  init Vue instance for panels
forEach(document.querySelectorAll('.mdl-layout__tab-panel'), function (element, index) {
  tabHashes.push(element.id);
  panels[element.id] = new Vue({
    data: {
      el: element,
      activeFlag: false
    },
    watch: {
      activeFlag: function () {
        // show content panel when activated first time
        if (this.activeFlag) {
          this.el.classList.add('is-active');
          if (this.el.querySelector('.wait-tabs')) {
            this.el.querySelector('.wait-tabs').classList.remove('wait-tabs');
            // console.log('removed');
          }
        } else {
          this.el.classList.remove('is-active');
          this.el.getElementsByClassName('page-content')[0].scrollIntoView();
        }
      }
    }
  });
});

//  init Vue instance for tabs
var tabs = {};
forEach(document.querySelectorAll('.mdl-layout__tab'), function (element, index) {
  // function to decide the first tab to use
  function aornot() {
    if (!location.hash && index == 0) {
      panels[hashtag].activeFlag = true;
      // panels[hashtag].el.querySelector('.wait-tabs').classList.remove('wait-tabs');
      return true;
    } else if (location.hash == '#' + hashtag) {
      panels[hashtag].activeFlag = true;
      // panels[hashtag].el.querySelector('.wait-tabs').classList.remove('wait-tabs');
      return true;
    } else {
      return false;
    }
  }
  var hashtag = element.getAttribute('href').slice(1);
  tabs[hashtag] = new Vue({
    el: element,
    data: {
      activeFlag: aornot(),
      hashtag: hashtag
    },
    methods: {
      setHash: function () {
        // console.log(hashtag);
        location.hash = hashtag;
      }
    }
  });
});

// if there is no hashtag or illegal, jump to first panel
if (location.hash == '' || tabHashes.indexOf(location.hash.slice(1)) == -1) {
  var to = location.toString().split('#')[0] + '#' + tabHashes[0];
  location.replace(to);
}

// init state managers
stateManager.containers = {
  managedStates: {
    authContainer: true,
    userInfoContainer: false,
  },
  whichOn: 'authContainer',
  toggle: function (container) {
    if (this.managedStates.hasOwnProperty(container) && !this[container]) {
      this.managedStates[this.whichOn] = false;
      this.managedStates[container] = true;
      this.whichOn = container;
    } else {
      console.log(' * unable to toggle:' + container);
    }
  }
};
stateManager.auth = new Vue({
  data: {
    managedStates: {
      login: false,
      postPrivilege: false
    },
  },
  created: function () {
    if (this.managedStates.login) {
      this.managedStates.login = true;
    }
  }
});

// oldURL,newURL patch for ie9+
if (!window.HashChangeEvent) (function () {
  var lastURL = document.URL;
  window.addEventListener('hashchange', function (event) {
    Object.defineProperty(event, 'oldURL', {
      enumerable: true,
      configurable: true,
      value: lastURL
    });
    Object.defineProperty(event, 'newURL', {
      enumerable: true,
      configurable: true,
      value: document.URL
    });
    lastURL = document.URL;
  });
}());

// handle hashtag change for 4 case
// 1. user change url -> change activeFlag -> jump to new tab
// 2. user clicked tab -> tab had chaned -> update activeFlag
// 3. other changes triggered by <a> (as a button to invoke function, can call by url)
// 4. illegal hashtag change
window.onhashchange = function (e) {
  function trimHead(a) {
    var b = a.split('#');
    b.shift();
    return b.join('#');
  }
  var befor = trimHead(e.oldURL);
  var after = trimHead(e.newURL);
  console.log('* detected hashtag change');
  console.log('from:' + befor + ', to:' + after);
  if (location.hash == '' || tabHashes.indexOf(after) == -1) {
    // check for case 3 & 4
    // location.hash = befor;
    if (keyFunctions[after] && keyFunctions[after].hasOwnProperty('trigger')) {
      // case 3
      keyFunctions[after].trigger();
    }
    // if (singleFunctions[after]) {
    //   singleFunctions[after]();
    // }
    history.back();
    return;
  }
  if (tabHashes.indexOf(befor) == -1) {
    // after case 3 & 4 happened, prevent useless operation
    return;
  } else {
    // for case 1
    // loadingPanel.style.display = 'block';
    tabs[befor].activeFlag = false;
    panels[befor].activeFlag = false;
  }
  // for case 1 & 2
  panels[after].activeFlag = true;
  tabs[after].activeFlag = true;
  // loadingPanel.style.display = 'none';
};


// Initialize Firebase
var fbaseConfig = {
  apiKey: 'AIzaSyBSHtV-JlfcQ-PyronfInW25bLHxB65ftY',
  authDomain: 'scstimx-b5bb8.firebaseapp.com',
  databaseURL: 'https://scstimx-b5bb8.firebaseio.com',
  projectId: 'scstimx-b5bb8',
  storageBucket: 'scstimx-b5bb8.appspot.com'
};
firebase.initializeApp(fbaseConfig);
fbaseData = firebase.database();

// detect firebase login status
var uid;
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    uid = user.uid;
    fbaseData = firebase.database();
    fbaseUser = user;
    databaseUserData.name = fbaseUser.displayName;
    databaseUserData.email = fbaseUser.email;
    databaseUserData.icon = fbaseUser.photoURL;
    stateManager.auth.managedStates.login = true;
    fbaseData.ref('/privilegedUsers/' + fbaseUser.uid).on('value', function (dataSnapshot) {
      stateManager.auth.managedStates.postPrivilege = dataSnapshot.val() ? true : false;
    });
    fbaseData.ref('/users/' + fbaseUser.uid).on('value', function (dataSnapshot) {
      var data = dataSnapshot.val();
      Object.keys(data).forEach(function (key) {
        databaseUserData[key] = data[key];
        if (key == 'name') fbaseUser.updateProfile({ displayName: data[key] });
        else if (key == 'icon') fbaseUser.updateProfile({ photoURL: data[key] });
      });
    });
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
    stateManager.auth.managedStates.login = false;
    stateManager.auth.managedStates.postPrivilege = false;
  }
});

// drawer user information
drawer.userIcon = new Vue({
  el: '#userIcon',
  data: {
    info: databaseUserData,
  },
  computed: {
    show: function () { return stateManager.auth.managedStates.login },
    privilege: function () { return stateManager.auth.managedStates.postPrivilege }
  },
  methods: {
    choseNewIcon: function () {
      // show upload dialog
      console.log('choseNewIcon');
    },
    getPrivilege: function () {
      console.log('getPrivilege');
      // check fbaseUser.emailVerified
      // send request
    }
  }
});

// drawer buttons
keyFunctions.userInfo = new Vue({
  el: '#userInfo',
  computed: {
    show: function () { return stateManager.auth.managedStates.login },
  },
  methods: {
    trigger: function () {
      if (stateManager.auth.managedStates.login) {
        // open dialog then update data
        dialogs.userInfoContainer.show();
        stateManager.containers.toggle('userInfoContainer');
        singleFunctions.dimOn();
      } else {
        // user not logged in, display message
      }
    }
  }
});
// LOGIN button
keyFunctions.auth = new Vue({
  el: '#auth',
  data: {
    managedStates: stateManager.auth.managedStates,
    s2icon: { true: 'cloud_off', false: 'account_box' },
    s2label: { true: 'Logout', false: 'Login' },
  },
  computed: {
    label: function () { return this.s2label[this.managedStates.login]; },
    icon: function () { return this.s2icon[this.managedStates.login]; }
  },
  methods: {
    trigger: function () {
      if (this.managedStates.login) {
        // logout sequence
        firebase.auth().signOut().then(function () {
          // Sign-out successful.
          stateManager.auth.managedStates.login = false;
        }).catch(function (error) {
          // An error happened.
        });
      } else {
        //  login sequence
        stateManager.containers.toggle('authContainer');
        singleFunctions.dimOn();
      }
    }
  }
});

// login dialogs
keyFunctions.authContainer = new Vue({
  // NEED TO FIX SOMETIME => merge sign in/up flow to one vue
  // el: '#authContainer',
  data: {
    el: document.querySelector('#authContainer'),
    managedStates: stateManager.containers.managedStates,
  },
  computed: {
    show: function () { return this.managedStates.authContainer },
  },
  watch: {
    show: function () {
      this.el.classList.toggle('inactive');
    }
  }
});
// login intro
dialogs.loginIntro = new Vue({
  el: '#loginIntro',
  data: {
    show: true,
  },
  methods: {
    goLogin: function () {
      this.show = false;
      dialogs.loginDialog.show = true;
    },
    goSignup: function () {
      this.show = false;
      dialogs.signupDialog.show = true;
    }
  }
});
// login dialog
dialogs.loginDialog = new Vue({
  el: '#loginDialog',
  data: {
    show: false,
    loading: false,
    email: '',
    pass: '',
  },
  methods: {
    checkData: function () {
      var res = true;
      var emailRE = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!emailRE.test(this.email)) {
        this.$el.querySelector('#loginEmail').parentElement.classList.add('is-invalid');
        res = false;
      }
      if (this.pass == '') {
        this.$el.querySelector('#loginPass').parentElement.classList.add('is-invalid');
        res = false;
      }
      return res;
    },
    login: function () {
      // log in to firebase
      if (this.checkData()) {
        this.loading = true;
        firebase.auth().signInWithEmailAndPassword(this.email, this.pass).then(function () {
          singleFunctions.dimOff();
          dialogs.loginDialog.close();
        }).catch(function (error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          dialogs.loginDialog.loading = false;
          singleFunctions.authNotification.show(errorMessage, 5000);
        });
      }
    },
    close: function () {
      // clear fields and back to intro
      this.loading = false;
      this.show = false;
      dialogs.loginIntro.show = true;
      this.pass = '';
      this.email = '';
      this.$el.querySelector('form').reset();
      forEach(this.$el.querySelectorAll('.mdl-textfield'), function (element) {
        element.classList.remove('is-focused', 'is-dirty', 'is-invalid');
      });
    }
  }
});
// signup dialog
dialogs.signupDialog = new Vue({
  el: '#signupDialog',
  data: {
    show: false,
    dim: false,
    name: '',
    email: '',
    pass: '',
    confirmPass: '',
  },
  methods: {
    checkData: function () {
      var res = true;
      if (this.name == '') {
        this.$el.querySelector('#signupName').parentElement.classList.add('is-invalid');
        res = false;
      }
      var emailRE = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!emailRE.test(this.email)) {
        this.$el.querySelector('#signupEmail').parentElement.classList.add('is-invalid');
        res = false;
      }
      if (this.pass == '') {
        this.$el.querySelector('#signupPass').parentElement.classList.add('is-invalid');
        res = false;
      }
      if (this.pass.length < 6) {
        this.$el.querySelector('#signupPass').parentElement.classList.add('is-invalid');
        var h = function () { };
        singleFunctions.authNotification.show('Password need 6 chars at least', 5000);
        res = false;
      }
      if (this.confirmPass != this.pass) {
        this.$el.querySelector('#signupPassConfirm').parentElement.classList.add('is-invalid');
        res = false;
      }
      return res;
    },
    confirmSignup: function () {
      if (this.checkData()) {
        this.dim = true;
        dialogs.signupConfirm.show = true;
      }
    },
    close: function () {
      // clear fields and back to intro
      this.pass = '';
      this.email = '';
      this.name = '';
      this.confirmPass = '';
      this.$el.querySelector('form').reset();
      forEach(this.$el.querySelectorAll('.mdl-textfield'), function (element) {
        element.classList.remove('is-focused', 'is-dirty', 'is-invalid');
      });
      this.show = false;
      dialogs.loginIntro.show = true;
    }
  }
});
// signup confirm
dialogs.signupConfirm = new Vue({
  el: '#signupConfirm',
  data: {
    show: false,
    loading: false,
  },
  methods: {
    signup: function () {
      // sign up to firebase
      this.loading = true;
      firebase.auth().createUserWithEmailAndPassword(dialogs.signupDialog.email, dialogs.signupDialog.pass).then(function () {
        var wait = setInterval(function () {
          // wait for auto login
          if (stateManager.auth.managedStates.login) {
            // loged in
            clearInterval(wait);
            fbaseData.ref('/users/' + fbaseUser.uid + '/name').set(dialogs.signupDialog.name).then(function () {
              ;
              fbaseUser.updateProfile({ displayName: dialogs.signupDialog.name });
              // succeeded update user name
              dialogs.signupConfirm.close();
              dialogs.signupDialog.close();
              dialogs.loginIntro.show = false;
              // send verify email
              fbaseUser.sendEmailVerification().then(function () {
                // Email sent.
                dialogs.verifyEmailSent.open(
                  'Success!',
                  'Signup succeed.<br>\
                  We had sent a <strong>VERIFY EMAIL</strong> to you.<br>\
                  Please check your mail box.<br><br>\
                  And please fill this form to get the privilege for posting things on website.<br>\
                  You can also find the form in the control panel later.'
                );
              }, function (error) {
                // Sent Verify Email FAILED
                dialogs.verifyEmailSent.open(
                  'Oops',
                  'Singup succeed, but we failed to send a verify email to you.<br>' +
                  'Here is the error message:<br>' +
                  error.message +
                  '<br>Please manualy do it again.'
                );
              });
            }, function (error) {
              // Update display name FAILED while Create User SUCCESS
            });
          }
        }, 10);
      }).catch(function (error) {
        // Create User failed
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode + ':' + errorMessage);
        dialogs.signupConfirm.loading = false;
        singleFunctions.authNotification.show(errorMessage, 5000);
      });
    },
    close: function () {
      // hide and un-dim signupDialog
      this.show = false;
      this.loading = false;
      dialogs.signupDialog.dim = false;
    }
  }
});
// varify email message
dialogs.verifyEmailSent = new Vue({
  el: '#verifyEmailSent',
  data: {
    show: false,
    title: '',
    message: '',
    OK: false
  },
  methods: {
    open: function (title, message) {
      this.title = title;
      this.message = message;
      this.show = true;
    },
    close: function () {
      if (!this.OK) return;
      this.show = false;
      singleFunctions.dimOff();
      dialogs.loginIntro.show = true;
      this.title = '';
      this.message = '';
      this.OK = false;
    }
  },
  watch: {
    OK: function () {
      var close = this.$el.querySelector('#closeVEDialog');
      var input = this.$el.querySelector('#verifyConfirmBox');
      this.OK ? close.removeAttribute('disabled') : close.setAttribute('disabled', '');
      this.OK ? input.parentElement.classList.add('is-checked') : input.parentElement.classList.remove('is-checked');
    }
  }
});


// userInfo
dialogs.userInfoContainer = new Vue({
  el: '#userInfoContainer',
  data: {
    managedStates: stateManager.containers.managedStates,
    cachedName: '',
    cachedAffiliation: '',
    cachedInfo: '',
    loading: false,
    dirty: false
  },
  computed: {
    login: function () {
      return stateManager.auth.managedStates.login;
    }
  },
  methods: {
    init: function () {
      this.cachedName = databaseUserData.name;
      this.cachedAffiliation = databaseUserData.affiliation;
      this.cachedInfo = databaseUserData.info;
    },
    show: function () {
      if (!this.dirty) {
        this.init();
        this.dirty = true;
      }
      for (var k in this.$refs) {
        if (this.$refs.hasOwnProperty(k)) {
          this.mdlState(this.$refs[k]);
        }
      }
    },
    close: function () {
      // don't restore all fields, just close
      singleFunctions.dimOff();
    },
    cancel: function () {
      // restore all fields, then close
      this.close();
      this.init();
      this.dirty = false;
    },
    mdlState: function (element) {
      setTimeout(function () {
        if (element.value) element.parentElement.classList.add('is-dirty');
        else element.parentElement.classList.remove('is-dirty');
      }, 10);
      setTimeout(function () {
        componentHandler.upgradeDom();
      }, 30);
    },
    update: function () {
      var up = {};
      if (this.cachedName && this.cachedName != databaseUserData.name) up.name = this.cachedName;
      if (this.cachedAffiliation && this.cachedAffiliation != databaseUserData.affiliation) up.affiliation = this.cachedAffiliation;
      if (this.cachedInfo && this.cachedInfo != databaseUserData.info) up.info = this.cachedInfo;
      if (Object.keys(up).length == 0) alert('No new data to update');
      else if (confirm('Updating profile... Are you sure?')) {
        this.loading = true;
        fbaseData.ref('/users/' + fbaseUser.uid).update(up, function () {
          dialogs.userInfoContainer.loading = false;
        });
      }
    }
  },
  watch: {
    login: function () {
      this.init();
    }
  }
});

var simplemde = new SimpleMDE({
  element: document.createElement('div').appendChild(document.createElement('textarea')),
});

var newsPosts = new Vue({
  el: '#newsPosts',
  data: {
    posts: [], // {order:bigger front,id,title,content,uname,ufrom,}
    postKeys: [],
    rawPosts: [],
    mostShow: 6,
    auth: stateManager.auth.managedStates,
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
          this.$refs.card.querySelector('.mdl-card__supporting-text').scrollTop = 0;
          this.$refs.card.classList.toggle('expand');
          if (this.$refs.card.classList.contains('expand')) {
            var card = this.$refs.card;
            var scrolling = setInterval(function () { card.scrollIntoView(); }, 1);
            setTimeout(function() {clearInterval(scrolling);}, 500);
          }
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