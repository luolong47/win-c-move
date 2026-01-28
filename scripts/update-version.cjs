const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '../package.json');
const pkg = require(packagePath);

const now = new Date();
const yy = String(now.getFullYear()).slice(2);
const MM = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const HH = String(now.getHours()).padStart(2, '0');
const mm = String(now.getMinutes()).padStart(2, '0');

// Format: yy.MMdd.HHmm (e.g. 26.0128.0958)
const newVersion = `${yy}.${MM}${dd}.${HH}${mm}`;

console.log(`Updating version from ${pkg.version} to ${newVersion}`);

pkg.version = newVersion;

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
