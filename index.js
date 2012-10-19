var chokidar = require('chokidar')
  , fs = require('fs');

try {
  var debug = require('debug')('patron')
} catch (e) {
  // production
  var debug = function() {}
}

function createWatcher(path) {

  var watcher = chokidar.watch(path, {ignored: /^\./, persistent: true});

  // add modify and delete events
  watcher.on('change', function(path) {
    if (fs.existsSync(path)) {
      debug('change %s', path)
      watcher.emit('modify', path)
    } else {
      debug('delete %s', path)
      watcher.emit('delete', path)
    }
  });

  debug('create watcher for %s', path)
  return watcher
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

    watcher.on('delete', function(path) {
      filesRules[path].forEach(function(ruleName){
        debug('Deleting rule for %s', ruleName)
        proxyTable.emit('remove', ruleName)
      })
    })
  }

module.exports = function(path) {
  var watcher = createWatcher(path)
  return function(e) {return watcherPlugin(watcher, e)}
}
