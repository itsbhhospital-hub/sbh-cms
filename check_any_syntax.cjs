const fs = require('fs');
const vm = require('vm');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide a file path');
    process.exit(1);
}

try {
    const code = fs.readFileSync(filePath, 'utf8');
    // Basic syntax check using vm.Script
    // Note: This won't handle JSX perfectly, but often catches basic brace mismatches
    new vm.Script(code);
    console.log(`Syntax OK for ${filePath}`);
} catch (e) {
    console.error(`Syntax Error in ${filePath}: ${e.message}`);
    process.exit(1);
}
