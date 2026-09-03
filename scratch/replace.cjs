const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(process.argv[2], 'src'));
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('googleSheetsService')) {
        content = content.replace(/googleSheetsService/g, 'firebaseService');
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
