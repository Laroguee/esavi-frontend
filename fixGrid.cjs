const fs = require('fs');
['src/features/forms/Fase1_Notificacion/NotificacionInicial.tsx', 'src/features/cases/CaseDetail.tsx'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/<Grid item xs={([^}]+)} md={([^}]+)} sm={([^}]+)}>/g, '<Grid size={{ xs: $1, sm: $3, md: $2 }}>');
  c = c.replace(/<Grid item xs={([^}]+)} md={([^}]+)}>/g, '<Grid size={{ xs: $1, md: $2 }}>');
  c = c.replace(/<Grid item xs={([^}]+)} sm={([^}]+)}>/g, '<Grid size={{ xs: $1, sm: $2 }}>');
  c = c.replace(/<Grid item xs={([^}]+)}>/g, '<Grid size={{ xs: $1 }}>');
  c = c.replace(/<Grid item>/g, '<Grid>');
  fs.writeFileSync(f, c);
});
