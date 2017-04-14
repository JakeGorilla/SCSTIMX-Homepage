let url = new Vue({
  el: window.location.href
})

let app = new Vue({
  el: '#app',
  data: {
    message: url.data
  }
})