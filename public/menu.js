;(function () {
  const checkbox = document.getElementById('jq-menutoggle')
  checkbox.addEventListener('change', function () {
    if (this.checked) {
      document.body.classList.add('overflow-hidden')
      document.body.scrollTop = 0
    } else {
      document.body.classList.remove('overflow-hidden')
    }
  })
})()
