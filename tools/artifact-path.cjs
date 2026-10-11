const fs = require('node:fs');
const path = require('node:path');

module.exports = function artifactPath(filename) {
  const directory = path.resolve(__dirname, '../artifacts');
  fs.mkdirSync(directory, { recursive: true });
  return path.join(directory, filename);
};
