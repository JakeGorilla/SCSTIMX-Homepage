// important vars
var panels = {}; // contains names and Vue instances for tab contents
var tabHashes = []; // names available tabs
var keyFunctions = {}; // key functions and their Vue inst 
var fbaseUser = undefined; // firebase
var singleFunctions = {
  singinSuccess: function () {
    // console.log('in success');
    this.dimOff();
    keyFunctions.drawerAuth.loginState = true;
  },
  dimOff: function () {
    document.getElementById('dim').style.display = 'none';
  },
};

// Initialize Firebase
var config = {
  apiKey: 'AIzaSyBSHtV-JlfcQ-PyronfInW25bLHxB65ftY',
  authDomain: 'scstimx-b5bb8.firebaseapp.com',
  databaseURL: 'https://scstimx-b5bb8.firebaseio.com',
  projectId: 'scstimx-b5bb8',
  storageBucket: 'scstimx-b5bb8.appspot.com'
};
firebase.initializeApp(config);

// for querySelectorAll
// forEach method, could be shipped as part of an Object Literal/Module
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
    el: element,
    data: {
      activeFlag: false
    },
    watch: {
      activeFlag: function () {
        // show content panel when activated first time
        if (this.activeFlag && this.$el.querySelector('.wait-tabs')) {
          this.$el.querySelector('.wait-tabs').classList.remove('wait-tabs');
          // console.log('removed');
        } else {
          this.$el.getElementsByClassName('page-content')[0].scrollIntoView();
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
      panels[hashtag].$data.activeFlag = true;
      // panels[hashtag].$el.querySelector('.wait-tabs').classList.remove('wait-tabs');
      return true;
    } else if (location.hash == '#' + hashtag) {
      panels[hashtag].$data.activeFlag = true;
      // panels[hashtag].$el.querySelector('.wait-tabs').classList.remove('wait-tabs');
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

// init login functions
// drawer login button
keyFunctions.drawerAuth = new Vue({
  el: '#drawerAuth',
  data: {
    loginState: false, // true for logged in, false for not
    message: '',
    s2m: {
      true: 'Logout',
      false: 'Login',
    },
  },
  methods: {
    trigger: function () {
      if (this.loginState) {
        // logout sequence
        // console.log('trigger out');
        firebase.auth().signOut().then(function () {
          // Sign-out successful.
          keyFunctions.drawerAuth.loginState = false;
        }).catch(function (error) {
          // An error happened.
        });
      } else {
        //  login sequence
        // console.log('trigger in');
        document.getElementById('dim').style.display = 'block';
      }
    }
  },
  beforeMount: function () {
    if (fbaseUser) {
      console.log('beforeMount');
      this.loginState = true;
    }
    this.message = this.s2m[this.loginState];
  },
  watch: {
    loginState: function () {
      console.log('dec');
      this.message = this.s2m[this.loginState]
    }
  }
});
// login intro
keyFunctions.loginIntro = new Vue({
  el: '#loginIntro',
  data: {
    show: true,
  },
  methods: {
    goLogin: function () {
      console.log('show login dialog');
      this.show = false;
      keyFunctions.loginDialog.show = true;
    },
    goSignup: function () {
      // TODO: show sign up dialog
      console.log('show signup dialog');
      this.show = false;
      keyFunctions.signupDialog.show = true;
    }
  }
});
// login dialog
keyFunctions.loginDialog = new Vue({
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
        console.log('actual login');
        this.loading = true;
        firebase.auth().signInWithEmailAndPassword(this.email, this.pass).then(function () {
          singleFunctions.dimOff();
          keyFunctions.loginDialog.close();
        }).catch(function (error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          keyFunctions.loginDialog.loading = false;
          var notification = document.querySelector('#infoToast');
          notification.MaterialSnackbar.showSnackbar({
            message: errorMessage
          });
        });
      }
    },
    close: function () {
      // clear fields and back to intro
      this.loading = false;
      this.show = false;
      keyFunctions.loginIntro.show = true;
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
keyFunctions.signupDialog = new Vue({
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
      var notification = document.querySelector('#infoToast');
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
        notification.MaterialSnackbar.showSnackbar({
          message: 'Password need 6 chars at least'
        });
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
        keyFunctions.signupConfirm.show = true;
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
      keyFunctions.loginIntro.show = true;
    }
  }
});
// signup confirm
keyFunctions.signupConfirm = new Vue({
  el: '#signupConfirm',
  data: {
    show: false,
    loading: false,
  },
  methods: {
    signup: function () {
      // sign up to firebase
      console.log('actual signup');
      this.loading = true;
      firebase.auth().createUserWithEmailAndPassword(keyFunctions.signupDialog.email, keyFunctions.signupDialog.pass).then(function () {
        var wait = setInterval(() => {
          // wait for auto login
          if (fbaseUser) {
            // loged in
            clearInterval(wait);
            keyFunctions.signupConfirm.close();
            keyFunctions.signupDialog.close();
            keyFunctions.loginIntro.show = false;
            fbaseUser.updateProfile({
              displayName: keyFunctions.signupDialog.name,
            }).then(() => {
              // succeeded update user name
              // send verify email
              fbaseUser.sendEmailVerification().then(function () {
                // Email sent.
                keyFunctions.verifyEmailSent.open(
                  'Success!',
                  'Signup succeed.<br>\
                  We had sent a <strong>VERIFY EMAIL</strong> to you.<br>\
                  Please check your mail box.<br><br>\
                  And please fill this form to get the privilege for posting things on website.<br>\
                  You can also find the form in the control panel later.'
                );
              }, function (error) {
                // Sent Verify Email FAILED
                keyFunctions.verifyEmailSent.open(
                  'Oops',
                  'Singup succeed, but we failed to send a verify email to you.<br>' +
                  'Here is the error message:<br>' +
                  error.message +
                  ''
                );
              });
            }, (error) => {
              // Auto Login FAILED while Create User SUCCESS
            });
          }
        }, 10);
      }).catch(function (error) {
        // Create User failed
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode + ':' + errorMessage);
        keyFunctions.signupConfirm.loading = false;
        var notification = document.querySelector('#infoToast');
        notification.MaterialSnackbar.showSnackbar({
          message: errorMessage
        });
      });
    },
    close: function () {
      // hide and un-dim signupDialog
      this.show = false;
      this.loading = false;
      keyFunctions.signupDialog.dim = false;
    }
  }
});
// varify email message
keyFunctions.verifyEmailSent = new Vue({
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
      keyFunctions.loginIntro.show = true;
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
// 3. other changes triggered by <a> (as a button to invoke function, not adding to history)
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
  console.log('from:' + befor);
  console.log('chto:' + after);
  if (location.hash == '' || tabHashes.indexOf(after) == -1) {
    // check for case 3 & 4
    // location.hash = befor;
    history.back();
    // if (keyFunctions[after] && keyFunctions[after].hasOwnProperty('trigger')) {
    //   // case 3
    //   keyFunctions[after].trigger();
    // } else 
    if (singleFunctions[after]) {
      singleFunctions[after]();
    }
    return (0);
  }
  if (tabHashes.indexOf(befor) == -1) {
    // after case 3 & 4 happened, prevent useless operation
    return (0);
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

// detect firebase login status
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    fbaseUser = user;
    // var userName = user.displayName;
    // var userEmail = user.email;
    // var userEmailVerified = user.emailVerified;
    // var userPhotoURL = user.photoURL;
    // var userId = user.uid;
    // var userProviderData = user.providerData;
    if (keyFunctions.drawerAuth) {
      keyFunctions.drawerAuth.loginState = true;
    }
  } else {
    fbaseUser = undefined;
    // userName = undefined;
    // userEmail = undefined;
    // userEmailVerified = undefined;
    // userPhotoURL = undefined;
    // userId = undefined;
    // userProviderData = undefined;
    if (keyFunctions.drawerAuth) {
      keyFunctions.drawerAuth.loginState = false;
    }
  }
});