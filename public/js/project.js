//  init Vue instance for panels
var panels = {};
var tabNames = [];
document.querySelectorAll('.mdl-layout__tab-panel').forEach(function (element, index) {
  tabNames.push(element.id);
  panels[element.id] = new Vue({
    el: element,
    data: {
      activeFlag: false
    }
  });
}, this);

// if there is no hashtag or illegal, give #news
if(location.hash == '' || tabNames.indexOf(location.hash.split('#')[1]) == -1) location.hash = 'news';

//  init Vue instance for tabs
var tabs = {};
document.querySelectorAll('.mdl-layout__tab').forEach(function (element, index) {
  // function to decide the first tab to use
  function aornot() {
    if (!location.hash && index == 1) {
      panels[hashtag].$data.activeFlag = true;
      return true;
    } else if (location.hash == '#' + hashtag) {
      panels[hashtag].$data.activeFlag = true;
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
}, this);

// show all hidden panels when ready
document.querySelectorAll('.wait-tabs').forEach(function (element) {
  element.classList.remove('wait-tabs');
});
let loadingPanel = document.getElementById('loading-panel');
loadingPanel.style.display = 'none';

// handle hashtag change for 2 case
// 1. user change url -> change activeFlag -> jump to new tab
// 2. user clicked tab -> tab had chaned -> update activeFlag
window.onhashchange = function (e) {
  let befor = e.oldURL.split('#')[1],
      after = e.newURL.split('#')[1];
  if (location.hash == '' || tabNames.indexOf(after) == -1) {
    location.hash = befor;
    return(0);
  }
  if (location.hash == '' || tabNames.indexOf(befor) == -1) {
    return(0);
  } else {
    loadingPanel.style.display = 'block';
    tabs[befor].activeFlag = false;
    panels[befor].activeFlag = false;
  }
  panels[after].activeFlag = true;
  tabs[after].activeFlag = true;
  loadingPanel.style.display = 'none';
  // console.log(' * hash change * ');
  // console.log('from:' + befor);
  // console.log('chto:' + after);
};


// Vue.component('tab-entry',{
//   template: '<a v-for="tab in tablist" v-bind:id="tab.id" :href="#" + "tab.id">{{ tab.name }}</a>'
// });

// var tabs = new Vue({
//   el: '#tabs',
//   data: {
//     tablist: [
//       { id: 'news', name: 'NEWS' },
//       { id: 'reports', name: 'Reports' },
//       { id: 'operational', name: 'Operational<br>Products' },
//       { id: 'modelfcst', name: 'Model/Forecast<br>Products' },
//       { id: 'research', name: 'Research<br>Products' },
//       { id: 'missions', name: 'Missions' },
//       { id: 'links', name: 'Links&amp;Tools' }
//     ]
//   }
// });


// tabs[0].$data['activeFlag'] = true;

// MaterialLayoutTab(document.getElementById('reports'),document.querySelectorAll('.mdl-layout__tab'),document.querySelectorAll('.mdl-layout__tab-panel'),document.getElementsByClassName('mdl-layout'));