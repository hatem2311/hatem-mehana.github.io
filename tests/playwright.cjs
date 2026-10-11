const path = require('node:path');
try { module.exports = require('playwright'); }
catch { module.exports = require(path.resolve(path.dirname(process.execPath), '../node_modules/playwright')); }
