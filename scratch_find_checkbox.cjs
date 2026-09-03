const fs = require('fs');
const path = require('path');

const folder = 'c:/Users/luis.ramos/Documents/esavi-frontend/src/features/forms/Fase4_Investigacion';

const files = fs.readdirSync(folder).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(folder, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('<Checkbox')) {
    console.log(file, 'has Checkbox');
  }
}
