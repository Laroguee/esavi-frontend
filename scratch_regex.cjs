const fs = require('fs');
const path = 'c:/Users/luis.ramos/Documents/esavi-frontend/src/features/forms/Fase4_Investigacion/AnexoVII_Clinico.tsx';

let content = fs.readFileSync(path, 'utf8');

// The original pattern is:
// <Controller name="fuentes_historiaClinica" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} checked={field.value === true || field.value === "true"} />} label={<Typography variant="body2">Historia clínica</Typography>} />} />

// We want to replace it with:
// <Controller name="..." control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" name={field.name} checked={field.value === true || field.value === 'true'} onChange={(e) => field.onChange(e.target.checked)} />} label="..." />} />

content = content.replace(
  /<Checkbox size="small" \{\.\.\.field\} checked=\{field\.value === true \|\| field\.value === "true"\} \/>/g,
  '<Checkbox size="small" name={field.name} checked={field.value === true || field.value === "true" || field.value === "TRUE"} onChange={(e) => field.onChange(e.target.checked)} />'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced all Checkboxes in AnexoVII_Clinico.tsx');
