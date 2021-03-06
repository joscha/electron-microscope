var App = require('app')
var microscope = require('./index.js')

App.on('ready', load)

function load () {
  var scope = microscope({https: false}, function ready (err) {
    scope.loadUrl('http://hoytarboretum.gardenexplorer.org/taxalist.aspx')
    loop()
  })

  function loop () {
    scope.onload(function (err) {
      if (err) return exit(err)
      var data = scope.createEvalStream(clickNextLetter)
      data.on('data', function (d) {
        console.log(JSON.stringify(d.data))
      })
      data.on('error', function (e) {
        console.error("Error:", e)
        scope.window.close()
      })
      data.on('finish', function () {
        scope.onload(function (err) {
          if (err) return exit(err)
          var data = scope.createEvalStream(getSpecies)
          data.on('data', function (d) {
            console.log(d)
          })
          data.on('finish', function () {
            scope.window.webContents.goBack()
            loop()
          })
        })
      })
    })
  }

  // these two functions are executed on the page, .toString() is called on them!
  function getSpecies (stream) {
    var species = document.querySelectorAll('.taxalist a b')
    for (var i = 0; i < species.length; i++) stream.write(species[i].innerText)
    stream.end()
  }

  function clickNextLetter(stream) {
    var links = document.querySelectorAll('.content input[type="button"]')
    var lastClicked = localStorage.getItem('last-clicked')
    if (typeof lastClicked === 'undefined') lastClicked = 0
    else lastClicked = +lastClicked
    var link = links[lastClicked]
    if (!link) return stream.destroy(new Error('clicked all links'))
    localStorage.setItem('last-clicked', ++lastClicked)
    link.click()
    stream.end()
  }

  function exit (err) {
    console.error(err)
    // scope.window.close()
  }
}
