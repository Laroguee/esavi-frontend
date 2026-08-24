import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configuración del worker de PDF.js usando CDN para evitar problemas de build con Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// =======================================================
// ESQUEMA ESTRICTO DE ZOD
// =======================================================
const notificacionSchema = z.object({
  fechaNotificacion: z.string().min(1, "Campo obligatorio"),
  nombreNotificador: z.string().min(3, "Mínimo 3 caracteres"),
  cargoNotificador: z.string().optional(),
  establecimientoNotificador: z.string().min(1, "Campo obligatorio"),
  telefonoNotificador: z.string().optional(),
  
  pacienteNombres: z.string().min(1, "Campo obligatorio"),
  pacienteApellidos: z.string().min(1, "Campo obligatorio"),
  pacienteSexo: z.string().min(1, "Seleccione el sexo"),
  pacienteFechaNacimiento: z.string().optional(),
  
  // Regla 1: Zod nativo para que coincida con el hook-form.
  pacienteEdad: z.number().min(0, "La edad no puede ser negativa"),
  
  // Regla 2: Formato DUI Salvadoreño o estar vacío
  pacienteDUI: z.string()
    .regex(/^\d{8}-\d{1}$/, "El DUI debe tener el formato 00000000-0")
    .or(z.literal('')),
  
  pacienteDireccion: z.string().optional(),
  pacienteResponsable: z.string().optional(),

  vacunaNombre: z.string().min(1, "Seleccione una vacuna"),
  vacunaFecha: z.string().min(1, "Campo obligatorio"),
  vacunaHora: z.string().optional(),
  vacunaDosis: z.string().optional(),
  vacunaLote: z.string().min(1, "Campo obligatorio"),
  vacunaFabricante: z.string().optional(),
  vacunaCaducidad: z.string().optional(),
  vacunaSitio: z.string().optional(),

  eventoFechaInicio: z.string().min(1, "Campo obligatorio"),
  eventoHoraInicio: z.string().optional(),
  eventoDescripcion: z.string().min(10, "Describa detalladamente (Mín. 10 caracteres)"),
  eventoGravedad: z.string().min(1, "Seleccione la gravedad"),
  eventoCriterioGravedad: z.string().optional(),
  eventoDesenlace: z.string().optional()
});

type NotificacionFormValues = z.infer<typeof notificacionSchema>;

export default function NotificacionInicial() {
  const navigate = useNavigate();

  const { control, handleSubmit, watch, reset, setValue } = useForm<NotificacionFormValues>({
    resolver: zodResolver(notificacionSchema),
    defaultValues: {
      fechaNotificacion: '', nombreNotificador: '', cargoNotificador: '', establecimientoNotificador: '', telefonoNotificador: '',
      pacienteNombres: '', pacienteApellidos: '', pacienteSexo: '', pacienteFechaNacimiento: '', pacienteEdad: 0, pacienteDUI: '', pacienteDireccion: '', pacienteResponsable: '',
      vacunaNombre: '', vacunaFecha: '', vacunaHora: '', vacunaDosis: '', vacunaLote: '', vacunaFabricante: '', vacunaCaducidad: '', vacunaSitio: '',
      eventoFechaInicio: '', eventoHoraInicio: '', eventoDescripcion: '', eventoGravedad: '', eventoCriterioGravedad: '', eventoDesenlace: ''
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const procesarPDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      let text = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let lastY;
        let pageText = '';
        for (const item of textContent.items) {
          if ('transform' in item) {
             const y = item.transform[5];
             if (lastY !== undefined && Math.abs(y - lastY) > 5) {
               pageText += '\n';
             } else if (lastY !== undefined) {
               pageText += ' ';
             }
             pageText += (item as any).str;
             lastY = y;
          }
        }
        text += pageText + '\n';
      }

      console.log("Texto extraído del PDF:", text);

      // Regex parsing según reglas FACEDRA mejorado con multiline (s flag) para saltos de línea
      const pacienteMatch = text.match(/Nombre y Apellidos:\s*(.+?)(?=Nº de Expediente|Sexo|Edad)/is);
      if (pacienteMatch) {
        const full = pacienteMatch[1].replace(/\n/g, ' ').trim();
        const parts = full.split(' ');
        if (parts.length >= 3) {
          setValue('pacienteNombres', parts.slice(0, 2).join(' '));
          setValue('pacienteApellidos', parts.slice(2).join(' '));
        } else if (parts.length === 2) {
          setValue('pacienteNombres', parts[0]);
          setValue('pacienteApellidos', parts[1]);
        } else {
          setValue('pacienteNombres', full);
        }
      }

      const edadMatch = text.match(/Edad:\s*(\d+)/i);
      if (edadMatch) setValue('pacienteEdad', parseInt(edadMatch[1]));

      const sexoMatch = text.match(/Sexo:\s*(Femenino|Masculino)/i);
      if (sexoMatch) setValue('pacienteSexo', sexoMatch[1]);

      // Mapeo inteligente de vacunas
      const vacunaMatch = text.match(/Medicamento:\s*(.+?)(?=Lote y fecha|Motivo|Dosis)/is);
      if (vacunaMatch) {
        const vacStr = vacunaMatch[1].replace(/\n/g, ' ').toUpperCase();
        let mappedVac = 'Otra';
        if (vacStr.includes('NEUMO')) mappedVac = 'Neumococo';
        else if (vacStr.includes('COVID')) mappedVac = 'COVID-19';
        else if (vacStr.includes('ROTA')) mappedVac = 'Rotavirus';
        else if (vacStr.includes('PENTA')) mappedVac = 'Pentavalente';
        else if (vacStr.includes('POLIO')) mappedVac = 'Polio';
        else if (vacStr.includes('HEPATITIS')) mappedVac = 'Hepatitis B';
        else if (vacStr.includes('DPT')) mappedVac = 'DPT';
        else if (vacStr.includes('SRP')) mappedVac = 'SRP';
        else if (vacStr.includes('INFLUENZA')) mappedVac = 'Influenza';
        else if (vacStr.includes('BCG')) mappedVac = 'BCG';
        else if (vacStr.includes('VPH')) mappedVac = 'VPH';
        
        setValue('vacunaNombre', mappedVac);
      }

      const loteMatch = text.match(/Lote y fecha de caducidad:\s*(.+?)(?=\n|Motivo|Dosis|-)/is);
      if (loteMatch) {
        const lote = loteMatch[1].replace(/\n/g, ' ').trim();
        if (!lote.includes('NO DATOS')) {
          setValue('vacunaLote', lote);
        }
      }

      // Fechas (Hay dos en el documento: Vacuna y Evento)
      const fechasMatch = [...text.matchAll(/Fecha [I|i]nicio:\s*(\d{2})\/(\d{2})\/(\d{4})/g)];
      if (fechasMatch.length > 0) {
        // Primera es de Vacunación (Sección Medicamento)
        setValue('vacunaFecha', `${fechasMatch[0][3]}-${fechasMatch[0][2]}-${fechasMatch[0][1]}`);
        
        if (fechasMatch.length > 1) {
          // Segunda es del Evento (Sección Reacciones)
          setValue('eventoFechaInicio', `${fechasMatch[1][3]}-${fechasMatch[1][2]}-${fechasMatch[1][1]}`);
        }
      }

      const eventoMatch = text.match(/Reacción adversa:\s*(.+?)(?=Fecha|Desenlace)/is);
      if (eventoMatch) setValue('eventoDescripcion', eventoMatch[1].replace(/\n/g, ' ').trim());

      const desenlaceMatch = text.match(/Desenlace:\s*(.+?)(?=\n|Observaciones)/is);
      if (desenlaceMatch) {
        const desStr = desenlaceMatch[1].trim().toUpperCase();
        let mappedDes = 'Desconocido';
        if (desStr.includes('RECUPERADO') && !desStr.includes('NO')) mappedDes = 'Recuperado';
        else if (desStr.includes('EN RECUPERACIÓN') || desStr.includes('RECUPERANDO')) mappedDes = 'En recuperacion';
        else if (desStr.includes('NO RECUPERADO')) mappedDes = 'No recuperado';
        else if (desStr.includes('FATAL') || desStr.includes('FALLECIDO') || desStr.includes('MUERTE')) mappedDes = 'Fallecido';
        
        setValue('eventoDesenlace', mappedDes);
      }

      // Sección Notificador
      const todasLasPersonas = [...text.matchAll(/Nombre y Apellidos:\s*(.+?)(?=Profesión|Especialidad|Correo)/igs)];
      if (todasLasPersonas.length > 1) {
         setValue('nombreNotificador', todasLasPersonas[todasLasPersonas.length - 1][1].replace(/\n/g, ' ').trim());
      } else {
         const matchNotif = text.match(/NOTIFICADOR[\s\S]*?Nombre y Apellidos:\s*(.+?)(?=Profesión|Especialidad)/is);
         if (matchNotif) setValue('nombreNotificador', matchNotif[1].replace(/\n/g, ' ').trim());
      }

      const profesionMatch = text.match(/Profesión:\s*(.+?)(?=Especialidad|Correo)/is);
      if (profesionMatch) setValue('cargoNotificador', profesionMatch[1].replace(/\n/g, ' ').trim());

      const centroMatch = text.match(/Centro de trabajo:\s*(.+?)(?=Dirección|Departamento)/is);
      if (centroMatch) setValue('establecimientoNotificador', centroMatch[1].replace(/\n/g, ' ').trim());

      const telefonoMatch = text.match(/Teléfono de contacto:\s*([\d\-\s]+)/i);
      if (telefonoMatch) setValue('telefonoNotificador', telefonoMatch[1].trim());

      const fechaNotifMatch = text.match(/Fecha Notificación:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
      if (fechaNotifMatch) {
        setValue('fechaNotificacion', `${fechaNotifMatch[3]}-${fechaNotifMatch[2]}-${fechaNotifMatch[1]}`);
      }

      alert("PDF importado exitosamente. Los datos detectados han sido autocompletados.");
    } catch (error) {
      console.error("Error al procesar PDF", error);
      alert("Hubo un error al extraer los datos del PDF.");
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const gravedadActual = watch('eventoGravedad');

  const onSubmit = (data: NotificacionFormValues) => {
    console.log("Notificación Inicial Registrada:", data);
    alert("Notificación registrada exitosamente. Pasará a la bandeja de pendientes para su oficialización.");
    navigate('/');
  };

  const handleDescargarPlantilla = () => {
    alert("Descargando plantilla PDF del Anexo II para llenado manual...");
  };

  const getDateTimeSx = (hasValue: boolean) => ({
    '& input::-webkit-datetime-edit': {
      color: hasValue ? 'text.primary' : 'transparent',
    },
    '& input:focus::-webkit-datetime-edit': {
      color: 'text.primary',
    },
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1050, margin: 'auto', pb: 8, pt: 4 }}>
      
      {/* CABECERA */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: '800', mb: 1 }}>
          Formulario de Notificación Inicial ESAVI
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Registro primario de Eventos Supuestamente Atribuibles a la Vacunación o Inmunización.
        </Typography>

        <Box sx={{ mt: 3 }}>
          <input
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={procesarPDF}
          />
          <Button
            variant="contained"
            color="secondary"
            startIcon={<UploadFileIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ fontWeight: 'bold' }}
          >
            Importar PDF de Noti-FACEDRA (Autocompletado)
          </Button>
        </Box>
      </Box>

      {/* SECCIÓN A: Datos del Notificador */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            A. Datos del Notificador (Establecimiento)
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="fechaNotificacion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de notificación" required 
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller name="establecimientoNotificador" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Establecimiento de Salud (SIBASI)" required 
                  error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Controller name="nombreNotificador" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Nombre del notificador" required 
                  error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="cargoNotificador" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Cargo" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller name="telefonoNotificador" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Teléfono de contacto" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* SECCIÓN B: Datos del Paciente */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            B. Datos del Paciente
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="pacienteNombres" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Nombres" required error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="pacienteApellidos" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Apellidos" required error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="pacienteSexo" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Sexo" required sx={{ minWidth: 160 }} error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </TextField>
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Controller name="pacienteFechaNacimiento" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de Nacimiento"
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {/* === SOLUCIÓN DEFINITIVA TS2353 === */}
              <Controller name="pacienteEdad" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  fullWidth type="number" label="Edad" required 
                  error={!!fieldState.error} helperText={fieldState.error?.message} 
                />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="pacienteDUI" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Identidad (DUI/Pas)" placeholder="Ej: 12345678-9" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller name="pacienteResponsable" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Nombre del responsable (si es menor)" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <Controller name="pacienteDireccion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Dirección de residencia completa" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* SECCIÓN C: Datos de la Vacuna */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            C. Datos de la Vacuna Implicada
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="vacunaNombre" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Nombre de la vacuna" required sx={{ minWidth: 160 }} error={!!fieldState.error} helperText={fieldState.error?.message}>
                  {['BCG', 'Hepatitis B', 'Rotavirus', 'Pentavalente', 'Neumococo', 'Polio', 'DPT', 'SRP', 'VPH', 'COVID-19', 'Influenza', 'Otra'].map(vac => (
                    <MenuItem key={vac} value={vac}>{vac}</MenuItem>
                  ))}
                </TextField>
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller name="vacunaFecha" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de vacunación" required 
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller name="vacunaHora" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="time" label="Hora de vacunación"
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="vacunaDosis" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Número de Dosis" sx={{ minWidth: 160 }} error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="1ra">1ra Dosis</MenuItem>
                  <MenuItem value="2da">2da Dosis</MenuItem>
                  <MenuItem value="3ra">3ra Dosis</MenuItem>
                  <MenuItem value="Refuerzo">Refuerzo</MenuItem>
                  <MenuItem value="Unica">Única</MenuItem>
                </TextField>
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="vacunaLote" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Número de Lote" required error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="vacunaFabricante" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Nombre del Fabricante" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="vacunaCaducidad" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de caducidad"
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller name="vacunaSitio" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Sitio anatómico de aplicación" sx={{ minWidth: 160 }} error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="Brazo derecho">Brazo derecho (Deltoides)</MenuItem>
                  <MenuItem value="Brazo izquierdo">Brazo izquierdo (Deltoides)</MenuItem>
                  <MenuItem value="Muslo derecho">Muslo derecho (Vasto externo)</MenuItem>
                  <MenuItem value="Muslo izquierdo">Muslo izquierdo (Vasto externo)</MenuItem>
                  <MenuItem value="Boca">Oral (Boca)</MenuItem>
                </TextField>
              )}/>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* SECCIÓN D: Detalles del Evento */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'secondary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            D. Detalles del Evento (Sintomatología)
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="eventoFechaInicio" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="date" label="Fecha inicio de síntomas" required 
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="eventoHoraInicio" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="time" label="Hora inicio de síntomas"
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="eventoGravedad" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Gravedad del Evento" required sx={{ minWidth: 160 }} error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="No Grave">No Grave</MenuItem>
                  <MenuItem value="Grave">Grave</MenuItem>
                </TextField>
              )}/>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller name="eventoDescripcion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth multiline rows={4} label="Descripción clínica del evento" placeholder="Describa a detalle los signos, síntomas y la evolución del paciente..." required error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>

            <Grid container spacing={3} sx={{ mt: 0, width: '100%' }}>
              {gravedadActual === 'Grave' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller name="eventoCriterioGravedad" control={control} render={({ field, fieldState }) => (
                    <TextField {...field} select fullWidth label="Criterio de Gravedad" sx={{ minWidth: 160, bgcolor: '#fff3e0' }} error={!!fieldState.error} helperText={fieldState.error?.message}>
                      <MenuItem value="Muerte">Muerte</MenuItem>
                      <MenuItem value="Peligro inminente de vida">Peligro inminente de vida</MenuItem>
                      <MenuItem value="Hospitalizacion">Hospitalización</MenuItem>
                      <MenuItem value="Discapacidad">Discapacidad severa</MenuItem>
                      <MenuItem value="Anomalia congenita">Anomalía congénita</MenuItem>
                    </TextField>
                  )}/>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: gravedadActual === 'Grave' ? 6 : 4 }}>
                <Controller name="eventoDesenlace" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} select fullWidth label="Desenlace actual" sx={{ minWidth: 160 }} error={!!fieldState.error} helperText={fieldState.error?.message}>
                    <MenuItem value="Recuperado">Recuperado</MenuItem>
                    <MenuItem value="En recuperacion">En recuperación</MenuItem>
                    <MenuItem value="No recuperado">No recuperado</MenuItem>
                    <MenuItem value="Fallecido">Fallecido</MenuItem>
                    <MenuItem value="Desconocido">Desconocido</MenuItem>
                  </TextField>
                )}/>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* BOTONES */}
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<DownloadIcon />}
          onClick={handleDescargarPlantilla}
        >
          Descargar Plantilla Anexo II (Presentación)
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="inherit" 
            size="large" 
            onClick={() => reset()}
          >
            Limpiar Campos
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            size="large" 
            sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
          >
            Registrar Notificación Inicial
          </Button>
        </Box>
      </Box>

    </Box>
  );
}