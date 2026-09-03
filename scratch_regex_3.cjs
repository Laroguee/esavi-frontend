const fs = require('fs');
const path = 'c:/Users/luis.ramos/Documents/esavi-frontend/src/features/forms/Fase4_Investigacion/AnexoIII_Logistica.tsx';

let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<Checkbox \{\.\.\.field\} checked=\{isChecked\} color="primary" \/>/g,
  '<Checkbox name={field.name} checked={isChecked} onChange={(e) => field.onChange(e.target.checked)} color="primary" />'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced Checkbox in AnexoIII');
