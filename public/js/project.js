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
            this.$nextTick(function () {
              document.body.scrollIntoView();
            });
            // console.log('removed');
          }
        } else {
          this.el.classList.remove('is-active');
          // this.el.getElementsByClassName('page-content')[0].scrollIntoView();
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
      return true;
    } else if (location.hash == '#' + hashtag) {
      panels[hashtag].activeFlag = true;
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
  Vue.nextTick(function () {
    document.body.scrollIntoView();
  });
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

if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

function Check_IE_Version() {
  var rv = -1; // Return value assumes failure.

  if (navigator.appName == 'Microsoft Internet Explorer') {

    var ua = navigator.userAgent,
      re = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");

    if (re.exec(ua) !== null) {
      rv = parseFloat(RegExp.$1);
    }
  }
  else if (navigator.appName == "Netscape") {
    /// in IE 11 the navigator.appVersion says 'trident'
    /// in Edge the navigator.appVersion does not say trident
    if (navigator.appVersion.indexOf('Trident') === -1) rv = 12;
    else rv = 11;
  }

  return rv;
}
var IE = Check_IE_Version();


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
        if (key == 'name') fbaseUser.updateProfile({
          displayName: data[key]
        });
        else if (key == 'icon') fbaseUser.updateProfile({
          photoURL: data[key]
        });
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
    show: function () {
      return stateManager.auth.managedStates.login
    },
    privilege: function () {
      return stateManager.auth.managedStates.postPrivilege
    }
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
    show: function () {
      return stateManager.auth.managedStates.login
    },
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
    s2icon: {
      true: 'cloud_off',
      false: 'account_box'
    },
    s2label: {
      true: 'Logout',
      false: 'Login'
    },
  },
  computed: {
    label: function () {
      return this.s2label[this.managedStates.login];
    },
    icon: function () {
      return this.s2icon[this.managedStates.login];
    }
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
    show: function () {
      return this.managedStates.authContainer
    },
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
              fbaseUser.updateProfile({
                displayName: dialogs.signupDialog.name
              });
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
      if (this.posts.length === 0) return 'No News';
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
    this.refToPosts.limitToLast(this.mostShow).on('child_added', function (dataSnapshot /*, keyOfThePrecedingOne*/) {
      console.log('got add');
      this.rawPosts.push(dataSnapshot);
    }, this);
    this.refToPosts.limitToLast(this.mostShow).on('child_removed', function (dataSnapshot /*, keyOfTheRemovedOne*/) {
      console.log('got removed');
      var index = this.postKeys.indexOf(dataSnapshot.key);
      if (index >= 0) {
        this.posts.splice(index, 1);
        this.postKeys = this.posts.map(function (post) {
          return post.id;
        });
      } else {
        for (var i = 0; i < this.rawPosts.length; i++) {
          if (rawPosts[i].key == dataSnapshot.key) {
            this.rawPosts.splice(i, 1);
          }
        }
      }
    }, this);
    this.refToPosts.limitToLast(this.mostShow).on('child_changed', function (dataSnapshot /*, keyOfThePrecedingOne*/) {
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
      data: function () {
        return {
          mdlBtnColor: true,
          mdlBtnAccent: false,
          showDelete: false,
          toggleText: 'Read'
        }
      },
      methods: {
        scrollto: function () {
          this.$refs.card.scrollIntoView();
        },
        expand: function () {
          var pid = this.post.id;
          var card = this.$refs.card;
          var postIndex = this.$parent.postKeys.indexOf(pid);
          card.querySelector('.mdl-card__supporting-text').scrollTop = 0;
          card.classList.toggle('expand');
          var scrolling = setInterval(function () {
            card.scrollIntoView();
          }, 1);
          setTimeout(function () {
            clearInterval(scrolling);
          }, 500);
          if (card.classList.contains('expand')) {
            this.mdlBtnColor = false;
            this.mdlBtnAccent = true;
            this.toggleText = 'Close';
            if (fbaseUser && this.$parent.posts[postIndex].authorId == fbaseUser.uid) {
              this.showDelete = true;
            }
            document.body.style.overflow = 'hidden';
          } else {
            this.mdlBtnColor = true;
            this.mdlBtnAccent = false;
            this.toggleText = 'Read';
            this.showDelete = false;
            document.body.style.overflow = 'auto';
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
              return;
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
        <div ref="card" :id="' + 'post.id' + '" class="article-card mdl-card mdl-shadow--2dp" @click="scrollto">\
          <div class="mdl-card__title mdl-card--border">\
            <h2 class="mdl-card__title-text">' + '{{post.title}}' + '</h2>\
            <h3 class="mdl-card__subtitle-text">Author: ' + '{{post.authorName}}' + '</h3>\
            <h3 v-show="' + 'post.authorAffiliation' + '" class="mdl-card__subtitle-text">From: ' + '{{post.authorAffiliation}}' + '</h3>\
          </div>\
          <div class="mdl-card__supporting-text mdl-card--expand" v-html="' + 'post.content' + '"></div>\
          <div class="mdl-card__actions mdl-card--border">\
            <a @click="expand" :class="{\'mdl-button--colored\': mdlBtnColor, \'mdl-button--accent\': mdlBtnAccent}" class="mdl-button mdl-button--raised mdl-js-button mdl-js-ripple-effect">\
              {{ toggleText }}\
            </a>\
            <div @click="deletePost" v-show="showDelete" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">\
              Delete\
            </div>\
          </div>\
        </div>'
    }
  }
});

var TTFRI_dataTree = [{
  "name": "OBSERVATION",
  "description": "觀測",
  "children": [{
    "name": "CWB-R",
    "description": "CWB雷達",
    "children": [{
      "name": "Taiwan",
      "description": "全台灣",
      "children": [{
        "name": "Land",
        "description": "無地形",
        "list": "OBSERVATION/CWB-R/Taiwan/Land"
      },
      {
        "name": "Land-N",
        "description": "有地形",
        "list": "OBSERVATION/CWB-R/Taiwan/Land-N"
      }
      ]
    },
    {
      "name": "Chiku",
      "description": "七股",
      "list": "OBSERVATION/CWB-R/Chiku"
    }
    ]
  },
  {
    "name": "CWB-S",
    "description": "CWB衛星",
    "children": [{
      "name": "Taiwan",
      "description": "台灣",
      "children": [{
        "name": "Light",
        "description": "可見光",
        "list": "OBSERVATION/CWB-S/Taiwan/Light"
      },
      {
        "name": "Color",
        "description": "色調強化",
        "list": "OBSERVATION/CWB-S/Taiwan/Color"
      }
      ]
    },
    {
      "name": "East-Asia",
      "description": "東亞",
      "children": [{
        "name": "Light",
        "description": "可見光",
        "list": "OBSERVATION/CWB-S/East-Asia/Light"
      },
      {
        "name": "Color",
        "description": "色調強化",
        "list": "OBSERVATION/CWB-S/East-Asia/Color"
      }
      ]
    },
    {
      "name": "High",
      "description": "高解析",
      "children": [{
        "name": "Light",
        "description": "可見光",
        "list": "OBSERVATION/CWB-S/High/Light"
      },
      {
        "name": "Color",
        "description": "色調強化",
        "list": "OBSERVATION/CWB-S/High/Color"
      }
      ]
    }
    ]
  },
  {
    "name": "CWB-RF",
    "description": "CWB雨量",
    "children": [{
      "name": "Small",
      "description": "小間距",
      "list": "OBSERVATION/CWB-RF/Small"
    },
    {
      "name": "Large",
      "description": "大間距",
      "list": "OBSERVATION/CWB-RF/Large"
    }
    ]
  }
  ]
},
{
  "name": "MODE",
  "description": "模式",
  "children": [{
    "name": "CWB-W",
    "description": "CWB天氣圖",
    "children": [{
      "name": "New-W",
      "description": "最新天氣圖",
      "list": "MODE/CWB-W/New-W"
    },
    {
      "name": "Land-W",
      "description": "地面天氣圖",
      "list": "MODE/CWB-W/Land-W"
    }
    ]
  },
  {
    "name": "CWB-RF",
    "description": "CWB定量降水預報",
    "children": [{
      "name": "I",
      "description": "定量降雨預報(I)",
      "list": "MODE/CWB-RF/I"
    },
    {
      "name": "II",
      "description": "定量降雨預報(II)",
      "list": "MODE/CWB-RF/II"
    }
    ]
  }
  ]
}
];

var TTFRI_dataDayTime = {
  'OBSERVATION/CWB-R/Taiwan/Land': [],
  'OBSERVATION/CWB-R/Taiwan/Land-N': [],
  'OBSERVATION/CWB-R/Chiku': [],
  'OBSERVATION/CWB-S/Taiwan/Light': ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
  'OBSERVATION/CWB-S/Taiwan/Color': ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'],
  'OBSERVATION/CWB-S/East-Asia/Light': ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
  'OBSERVATION/CWB-S/East-Asia/Color': ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'],
  'OBSERVATION/CWB-S/High/Light': ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
  'OBSERVATION/CWB-S/High/Color': ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'],
  'OBSERVATION/CWB-RF/Small': ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'],
  'OBSERVATION/CWB-RF/Large': ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'],
  'MODE/CWB-W/New-W': [],
  'MODE/CWB-W/Land-W': ['02:00', '08:00', '14:00', '20:00'],
  'MODE/CWB-RF/I': ['00:00'],
  'MODE/CWB-RF/II': ['00:00']
};

var operShow = new Vue({
  el: '#operShow',
  data: {
    baseUrl: 'http://140.110.147.101:8080/narlabs/rest/data/',
    type: '',
    date: '',
    time: '',
    availDates: [],
    show: false,
    timePlaceholder: 'Select Type first',
    message: 'Choose a <strong>product</strong> to show.<br><strong>Type</strong> to search <strong>date</strong> and <strong>time</strong>.'
  },
  created: function () {
    var res = new Date();
    if (res.getHours() < 1) res.setDate(res.getDate() - 1);
    var year = res.getFullYear().toString();
    var mon = this.pad(res.getMonth() + 1);
    var day = this.pad(res.getDate());
    res = year + '/' + mon + '/' + day;
    this.date = res;
  },
  computed: {
    availTimes: function () {
      if (this.type && this.date) {
        var res = TTFRI_dataDayTime[this.type.url];
        this.timePlaceholder = 'Select time';
        if (res.indexOf(this.time) == -1) this.time = '';
        if ((new Date(Date.parse(this.date))).toLocaleDateString() === (new Date()).toLocaleDateString()) {
          var thisHour = (new Date()).getHours();
          var thisMinute = (new Date()).getMinutes();
          res = TTFRI_dataDayTime[this.type.url].filter(function (str) { var hour = parseInt(str.split(':')[0]); var minute = parseInt(str.split(':')[1]); return hour < thisHour || hour == thisHour && minute <= thisMinute });
          if (res.indexOf(this.time) == -1) {
            var target = res[res.length - 1];
            var hour = parseInt(target.split(':')[0]);
            var minute = parseInt(target.split(':')[1]);
            this.time = thisHour > hour ? target : thisMinute - minute > 20 ? target : res[res.length - 2];
          }
        }
        return res;
      } else {
        this.timePlaceholder = 'Select Type first';
        this.time = '';
        return [];
      }
    },
    products: function () {
      function flatten(data) {
        var res = [];
        var path = [''];
        var visited = [];
        var node = data; // is onject
        var parentNodes = [];
        while (path.length > 0) {
          // console.log(path.join('/'));
          if (node.list) {
            // leaf node
            if (node.list != 'OBSERVATION/CWB-R/Taiwan/Land' &&
              node.list != 'OBSERVATION/CWB-R/Taiwan/Land-N' &&
              node.list != 'OBSERVATION/CWB-R/Chiku' &&
              node.list != 'OBSERVATION/CWB-S/High/Light' &&
              node.list != 'OBSERVATION/CWB-S/High/Color' &&
              node.list != 'MODE/CWB-W/New-W' &&
              node.list != 'MODE/CWB-RF/I' &&
              node.list != 'MODE/CWB-RF/II') {
              res.push({
                label: path.join('/'),
                url: node.list
              });
            }
            path.pop();
            node = parentNodes.pop();
          } else {
            var index = [];
            var layer = node.children.map(function (child) {
              return child['description'];
            }).filter(function (value, i) {
              path.push(value);
              if (visited.indexOf(path.join('/')) == -1) {
                index.push(i);
                path.pop();
                return true;
              } else {
                path.pop();
                return false;
              }
            });
            // console.log(layer);
            // console.log(index);
            if (layer.length > 0) {
              path.push(layer[0]);
              parentNodes.push(node);
              node = node.children[index[0]];
              visited.push(path.join('/'));
            } else {
              path.pop();
              node = parentNodes.pop();
            }
          }
        }
        return res;
      };
      var res = [];
      for (cat in TTFRI_dataTree) {
        // res.push({
        //   cat: TTFRI_dataTree[cat].description,
        //   types: flatten(TTFRI_dataTree[cat])
        // });
        res = res.concat(flatten(TTFRI_dataTree[cat]));
      }
      return res;
    }
  },
  methods: {
    compDate: function (searchQuery) {
      // update list according to searchQuery;
      if (this.$refs.date.$refs.search.value != searchQuery) return;
      searchQuery.trim();
      var thisHour = new Date();
      var thisYear = thisHour.getFullYear();
      var thisMon = thisHour.getMonth() + 1;
      var thisDay = thisHour.getDate();
      thisHour = thisHour.getHours();
      var searchDate = Date.parse(searchQuery);
      var match = searchQuery.match(/(\d{4})(?:\/?(\d{0,2}))?/);
      if (searchDate && searchQuery.includes('/') && !searchQuery.match(/\/$/)) {
        // console.log('A')
        searchDate = new Date(searchDate);
        var year = searchDate.getFullYear();
        if (year > 2013 && year <= thisYear) {
          // console.log('A1')
          var mon = searchDate.getMonth() + 1;
          var lastDay = new Date(year, mon, 0);
          lastDay = lastDay.getDate();
          if (year < thisYear || mon < thisMon) {
            // console.log('A11')
            this.availDates = new Array(lastDay + 2);
            this.availDates[0] = year.toString() + '/' + this.pad(mon - 1) + '/';
            for (var i = 1; i < this.availDates.length - 1; i++) {
              this.availDates[i] = year.toString() + '/' + this.pad(mon) + '/' + this.pad(i);
            }
            this.availDates[this.availDates.length - 1] = year.toString() + '/' + this.pad(mon + 1) + '/';
          } else if (mon == thisMon) {
            // console.log('A12')
            lastDay = thisDay;
            this.availDates = new Array(lastDay + 1);
            this.availDates[0] = year.toString() + '/' + this.pad(mon - 1) + '/';
            for (var i = 1; i < this.availDates.length; i++) {
              this.availDates[i] = year.toString() + '/' + this.pad(mon) + '/' + this.pad(i);
            }
          }
        }
      } else if (match) {
        // console.log('B')
        var year = parseInt(match[1]);
        var mon;
        var ymGood = false;
        var ymEdge = false;
        if (year > 2013 && year <= thisYear) {
          if (match.length == 3) {
            // console.log('B1')
            mon = parseInt(match[2]);
            if (mon > 0 && mon < 13) {
              ymGood = (year === thisYear ? mon <= thisMon : true);
              ymEdge = (year === thisYear ? mon === thisMon : false);
            }
          }
          if (ymGood) {
            var lastDay = new Date(year, mon, 0);
            lastDay = ymEdge ? thisDay : lastDay.getDate();
            this.availDates = new Array(lastDay);
            for (var i = 0; i < this.availDates.length; i++) {
              this.availDates[i] = year.toString() + '/' + this.pad(mon) + '/' + this.pad(i + 1);
            }
          } else {
            this.availDates = new Array(12);
            for (var i = 0; i < 12; i++) {
              this.availDates[i] = year.toString() + '/' + this.pad(i + 1);
            }
          }
        }
      } else {
        this.availDates = new Array(thisYear - 2013);
        for (var i = 0; i < this.availDates.length; i++) {
          this.availDates[i] = (2014 + i).toString() + '/';
        }
      }
      // highlight date entry according to searchQuery
      this.$nextTick(function () {
        for (var i = 0; i < this.availDates.length; i++) {
          var optDate = this.availDates[i];
          var simpleOpt = optDate.replace(/\D/g, '');
          var simpleQuery = searchQuery.replace(/\D/g, '');
          if (optDate.match(searchQuery) || simpleOpt.match(simpleQuery)) {
            this.$refs.date.pointer = i;
            this.$refs.date.$refs.list.scrollTop = parseInt(this.$refs.date.pointerPosition - (this.$refs.date.visibleElements - 1) * this.$refs.date.optionHeight / 2);
            break;
          }
        }
      });
    },
    syncQuery: function (val, close) {
      val = val ? val : this.date;
      close = close ? close : false;

      this.$refs.date.$refs.search.focus();
      var a = this.$refs.date.$refs.search;
      if (IE < 0 || IE > 11) {
        this.$nextTick(function () {
          var event = new Event('input', {
            'bubbles': true,
            'cancelable': true
          });
          a.value = val;
          a.dispatchEvent(event);
        });
      } else {
        this.$refs.date.updateSearch(val);
      }
      if (close) this.$refs.date.deactivate();
    },
    updateQuery: function (selectedOption) {
      if (selectedOption.match(/\d{4}\/\d\d\/\d\d/)) this.syncQuery(selectedOption, true);
      else this.syncQuery(selectedOption);
    },
    listPosition: function () {
      // highlight time entry according to this.time
      this.$nextTick(function () {
        for (var i = 0; i < this.availTimes.length; i++) {
          var optTime = this.availTimes[i];
          var simpleOpt = optTime.replace(/\D/g, '');
          var simpleQuery = this.time.replace(/\D/g, '');
          if (optTime.match(this.time) || simpleOpt.match(simpleQuery)) {
            this.$refs.time.pointer = i;
            this.$refs.time.$refs.list.scrollTop = parseInt(this.$refs.time.pointerPosition - (this.$refs.time.visibleElements - 1) * this.$refs.time.optionHeight / 2);
            break;
          }
        }
      });
    },
    updateImg: function () {
      if (this.type && this.date && this.time) {
        if (Date.parse(this.date) && !this.date.match(/\/$/) && Date.parse(this.date + ' ' + this.time)) {
          var date = new Date(Date.parse(this.date + ' ' + this.time));
          var year = date.getFullYear().toString();
          var mon = this.pad(date.getMonth() + 1);
          var day = this.pad(date.getDate());
          var hour = this.pad(date.getHours());
          var min = this.pad(date.getMinutes());
          var url = this.baseUrl + this.type.url + '/' + year + '-' + mon + '-' + day + '-' + hour + min + '.jpg';
          this.$refs.img.src = url;
          var me = this;
          me.show = true;
        }
        //  else { this.show = false; this.clearImg() }
      }
      //  else { this.show = false; this.clearImg() }
    },
    pad: function (num) {
      return num < 10 ? '0' + num.toString() : num.toString();
    },
    clearImg: function () { this.$refs.img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; },
    toTop: function () { this.$refs.type.$el.scrollIntoView() }
  },
  watch: {
    type: function () {
      this.updateImg()
    },
    date: function () {
      this.updateImg()
    },
    time: function () {
      if (!this.time && this.time != '') this.time = '';
      this.updateImg()
    }
  },
  components: {
    'prod-type': VueMultiselect.Multiselect,
    'date-time': VueMultiselect.Multiselect,
  },
});


document.body.scrollIntoView();