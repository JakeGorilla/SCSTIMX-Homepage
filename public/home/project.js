

window.onhashchange = function (e) {
  console.log('YO');
  console.log(e);
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

var tabs = [];
// console.log(tabs);
document.querySelectorAll('.mdl-layout__tab').forEach(function(element,index) {
  tabs.push(new Vue({
    el: element,
    data: {
      activeFlag: (index == 1) ? true : false
    }
  }));
}, this);

tabs[0].$data['activeFlag'] = true;

// MaterialLayoutTab(document.getElementById('reports'),document.querySelectorAll('.mdl-layout__tab'),document.querySelectorAll('.mdl-layout__tab-panel'),document.getElementsByClassName('mdl-layout'));