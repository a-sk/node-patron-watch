# Patron-watch

[node-patron][1] watch plugin.

# Install
`npm install patron-watch`

# Example

```javascript
var createProxyServer = require('patron')
  , watcher = require('patron-watch');

var proxy = createProxyServer(proxyTable);

proxy.use(watcher('path/to/dir/or/file'))
proxy.listen(80)

```

[1]: http://github.com/a-sk/node-patron
