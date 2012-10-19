var chokidar = require('chokidar')
  , fs = require('fs')
  , os = require('os');

try {
  var debug = require('debug')('patron')
} catch (e) {
  // production
  var debug = function() {}
}


function watcherPlugin(watcher, proxyTable) {

    // object to assosiate files and rules
    var filesRules = {};

    watcher.on('add', function(path) {
      var newProxyRules = require(path)
      // copy properties from newProxyRules to proxyTable
      for (var ruleName in newProxyRules) {
        debug('Adding rule for %s', ruleName)
        var rule = {}
        rule[ruleName] = newProxyRules[ruleName]
        proxyTable.emit('add', rule)

        if (!filesRules[path]) {
          filesRules[path] = [ruleName]
        } else {
          filesRules[path].push(ruleName)
        }
      }
    })

    watcher.on('change', function(path){
      filesRules[path].forEach(function(ruleName) {
        debug('Deleting rule for %s', ruleName)
        proxyTable.emit('remove', ruleName)
      })
      debug('Deleting filesRules %s', filesRules[path])
      delete filesRules[path]

      debug('Invalidating cache for %s', require.cache[require.resolve(path)])
      delete require.cache[require.resolve(path)]

      debug('Emiting add event')
      watcher.emit('add', path)
    })

    watcher.on('unlink', function(path) {
      filesRules[path].forEach(function(ruleName){
        debug('Deleting rule for %s', ruleName)
        proxyTable.emit('remove', ruleName)
      })
    })
  }

module.exports = function(path) {
  var watcher = chokidar.watch(path, {ignored: /^\./, persistent: true});
  debug('create watcher for %s', path)
  return function(e) {return watcherPlugin(watcher, e)}
}
