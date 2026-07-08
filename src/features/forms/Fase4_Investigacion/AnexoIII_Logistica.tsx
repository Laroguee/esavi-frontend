import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';

const checklistOficial = [
  { id: 'chk_1', text: 'Identifique la zona geográfica y conozca las condiciones ambientales, de acceso o comunicación y los riesgos de seguridad.' },
  { id: 'chk_2', text: 'Establezca un cronograma de actividades.' },
  { id: 'chk_3', text: 'Asegurarse de que el equipo está adecuadamente identificado.' },
  { id: 'chk_4', text: 'Establezca los mecanismos de comunicación durante o después.' },
  { id: 'chk_5', text: 'Coordine medios de transporte para el equipo.' },
  { id: 'chk_6', text: 'Disponga los equipos electrónicos móviles o en papel que se van a requerir.' },
  { id: 'chk_7', text: 'En caso de requerir análisis adicionales (ej. toma de muestras), disponga el material necesario.' }
];

export default function AnexoIII_Logistica() {
  const { id } = useParams();
  const navigate = useNavigate();
const { setLogisticaCompletada } = useAuthStore();
  const { control, handleSubmit } = useForm({
    defaultValues: {
      chk_1: false, chk_2: false, chk_3: false, chk_4: false,
      chk_5: false, chk_6: false, chk_7: false,
      observaciones: ''
    }
  });

  const onSubmit = (data: any) => {
    console.log("Checklist Logístico Guardado:", data);
    alert(`Logística de campo completada para el caso ${id}. Ahora el equipo puede proceder a llenar los Anexos V y VI.`);
    
    setLogisticaCompletada(true);
    
    // Regresa al expediente (Simulando que ya actualizó el flag en BD)
    navigate('/caso/' + id);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 800, margin: 'auto', pb: 8, pt: 2 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Anexo III: Checklist Logístico
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/caso/' + id)}>
          Cancelar
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 4, mb: 4, borderColor: '#e0e0e0', borderTop: '4px solid', borderTopColor: 'primary.main' }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
          <ChecklistRtlIcon /> Preparación para el Trabajo de Campo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Previo al despliegue del Equipo de Respuesta Rápida (ERR), confirme que se han cumplido los siguientes preparativos de logística y seguridad.
        </Typography>

        <FormGroup sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
          {checklistOficial.map((item) => (
            <Controller
              key={item.id}
              name={item.id as any}
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} color="primary" />}
                  label={<Typography variant="body2">{item.text}</Typography>}
                  sx={{ alignItems: 'flex-start', m: 0, p: 1, bgcolor: field.value ? '#e8f5e9' : 'transparent', borderRadius: 1, transition: '0.2s' }}
                />
              )}
            />
          ))}
        </FormGroup>

        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Observaciones de seguridad y transporte</Typography>
        <Controller name="observaciones" control={control} render={({ field }) => (
          <TextField 
            {...field} 
            fullWidth 
            multiline 
            rows={3} 
            size="small" 
            placeholder="Ej. Vehículo asignado placa Nacional-123. Zonas con señal celular intermitente..." 
          />
        )}/>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="contained" color="secondary" type="submit" size="large" startIcon={<SaveIcon />}>
          Guardar Logística de Campo
        </Button>
      </Box>

    </Box>
  );
}