const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));
const endpoints = [];
for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, details] of Object.entries(methods)) {
        endpoints.push(`${method.toUpperCase()} ${path} - ${details.summary || ''}`);
    }
}
fs.writeFileSync('endpoints.txt', endpoints.join('\n'));
console.log('Done writing endpoints.txt');
