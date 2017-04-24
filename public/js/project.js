// important vars
var panels = {};  // contains names and Vue instances for tab contents
var tabNames = [];  // names available tabs
var keyFunctions = {};  // drawer functions name(hashtag) with Vue inst to sync state
var userName, userEmail, userEmailVerified, userPhotoURL, userId, userProviderData; // firebase
var singleFunctions = {
  singinSuccess: function () {
    // console.log('in success');
    singleFunctions['dimOff']();
    keyFunctions['login'].loginState = true;
  },
  dimOff: function () {
    document.getElementById('dim').style.display = 'none';
  }
};

// Initialize Firebase
var config = {
  apiKey: "AIzaSyBSHtV-JlfcQ-PyronfInW25bLHxB65ftY",
  authDomain: "scstimx-b5bb8.firebaseapp.com",
  databaseURL: "https://scstimx-b5bb8.firebaseio.com",
  projectId: "scstimx-b5bb8",
  storageBucket: "scstimx-b5bb8.appspot.com"
};
firebase.initializeApp(config);
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    var userName = user.displayName;
    var userEmail = user.email;
    var userEmailVerified = user.emailVerified;
    var userPhotoURL = user.photoURL;
    var userId = user.uid;
    var userProviderData = user.providerData;
  } else {
    userName = undefined;
    userEmail = undefined;
    userEmailVerified = undefined;
    userPhotoURL = undefined;
    userId = undefined;
    userProviderData = undefined;
  }
});

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
  tabNames.push(element.id);
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
        }
      }
    }
  });
});

// if there is no hashtag or illegal, give #news
if (location.hash == '' || tabNames.indexOf(location.hash.split('#')[1]) == -1) {
  location.hash = 'news';
}

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
  let hashtag = element.getAttribute('href').split('#')[1];
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

// show all hidden panels when they're ready
// function showContents() {
//   forEach(document.querySelectorAll('.wait-tabs'), function (element) {
//     element.classList.remove('wait-tabs');
//   });
//   // let loadingPanel = document.getElementById('loading-panel');
//   // loadingPanel.style.display = 'none';
// }

// init login functions
// FirebaseUI config.
var uiConfig = {
  signInSuccessUrl: '#singinSuccess',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    // firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  // Terms of service url.
  tosUrl: '#accountTOS',
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInFlow: 'popup',
};
// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());
// The start method will wait until the DOM is loaded.

// login button
keyFunctions['login'] = new Vue({
  el: document.querySelector('.func[href="#login"]'),
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
      // @TODO: Login system
      if (this.loginState) {
        // logout sequence
        // console.log("trigger out");
        firebase.auth().signOut().then(function () {
          // Sign-out successful.
          keyFunctions['login'].loginState = false;
        }).catch(function (error) {
          // An error happened.
        });
      } else {
        //  login sequence
        // console.log("trigger in");
        ui.start('#firebaseui-auth-container', uiConfig);
        document.getElementById('dim').style.display = 'block';
      }
    }
  },
  beforeMount: function () {
    if (userName) {
      console.log("beforeMount");
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

// oldURL,newURL patch for ie9+
if (!window.HashChangeEvent) (function () {
  var lastURL = document.URL;
  window.addEventListener("hashchange", function (event) {
    Object.defineProperty(event, "oldURL", { enumerable: true, configurable: true, value: lastURL });
    Object.defineProperty(event, "newURL", { enumerable: true, configurable: true, value: document.URL });
    lastURL = document.URL;
  });
}());

// handle hashtag change for 4 case
// 1. user change url -> change activeFlag -> jump to new tab
// 2. user clicked tab -> tab had chaned -> update activeFlag
// 3. other changes triggered by <a> (as a button to invoke function, not adding to history)
// 4. illegal hashtag change
window.onhashchange = function (e) {
  let befor = e.oldURL.split('#')[1];
  let after = e.newURL.split('#')[1];
  // console.log('* detected hashtag change');
  // console.log('from:' + befor);
  // console.log('chto:' + after);

  if (location.hash == '' || tabNames.indexOf(after) == -1) {
    // check for case 3 & 4
    // location.hash = befor;
    history.back();
    if (keyFunctions[after] && keyFunctions[after].hasOwnProperty('trigger')) {
      // case 3
      keyFunctions[after].trigger();
    } else if (singleFunctions[after]) {
      singleFunctions[after]();
    }
    return (0);
  }
  if (tabNames.indexOf(befor) == -1) {
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

