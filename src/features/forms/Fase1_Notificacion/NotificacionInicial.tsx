import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider, FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useCasesStore } from '../../../store/useCasesStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { guardarEnSheets, crearCarpetaCaso, crearNotificacion } from '../../../services/googleSheetsService';

// Configuración del worker de PDF.js usando CDN para evitar problemas de build con Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// =======================================================
// ESQUEMA ESTRICTO DE ZOD (Actualizado Fase 1 Noti-FACEDRA)
// =======================================================
const notificacionSchema = z.object({
  // A. Notificador
  fechaNotificacion: z.string().min(1, "Campo obligatorio"),
  nombreNotificador: z.string().min(3, "Mínimo 3 caracteres"),
  cargoNotificador: z.string().optional(),
  establecimientoNotificador: z.string().min(1, "Campo obligatorio"),
  telefonoNotificador: z.string().optional(),
  
  // B. Paciente
  nombrePaciente: z.string().min(1, "Campo obligatorio"),
  genero: z.string().min(1, "Seleccione el género"),
  fechaNacimiento: z.string().optional(),
  edad: z.number().min(0, "La edad no puede ser negativa").optional(),
  unidadEdad: z.string().optional(),
  expedienteClinico: z.string().optional(),
  pesoKg: z.number().optional(),
  alturaCm: z.number().optional(),
  padeceOtrasEnfermedades: z.boolean().optional(),
  nombreEnfermedad: z.string().optional(),
  fechaDiagnostico: z.string().optional(),
  pacienteDUI: z.string()
    .regex(/^\d{8}-\d{1}$/, "El DUI debe tener el formato 00000000-0")
    .or(z.literal(''))
    .optional(),
  pacienteDireccion: z.string().optional(),
  pacienteResponsable: z.string().optional(),

  // C. Vacuna / Medicamento
  nombreVacuna: z.string().min(1, "Seleccione una vacuna/medicamento"),
  fechaAdministracion: z.string().min(1, "Campo obligatorio"),
  horaAdministracion: z.string().optional(),
  dosisAdministradas: z.string().optional(),
  lote: z.string().min(1, "Campo obligatorio"),
  fabricante: z.string().optional(),
  fechaCaducidad: z.string().optional(),
  sitioAnatomico: z.string().optional(),
  establecimientoVacunacion: z.string().optional(),
  medidasTomadas: z.string().optional(),

  // D. Reacciones (ESAVI)
  fechaInicioReaccion: z.string().min(1, "Campo obligatorio"),
  horaInicioReaccion: z.string().optional(),
  fechaFinReaccion: z.string().optional(),
  sintomasReaccion: z.string().min(10, "Describa detalladamente (Mín. 10 caracteres)"),
  eventoGravedad: z.string().min(1, "Seleccione la gravedad"),
  criterioGravedad: z.array(z.string()).optional(),
  desenlace: z.string().optional(),
  tratamientoRecibido: z.string().optional(),
  antecedentesMedicosRelevantes: z.string().optional(),
  observacionesAdicionales: z.string().optional(),

  // E. Nuevos campos de FACEDRA
  viaAdministracion: z.string().optional(),
  dosisYPosologia: z.string().optional(),
  correoNotificador: z.string().optional(),
});

type NotificacionFormValues = z.infer<typeof notificacionSchema>;

const CRITERIOS_GRAVEDAD = [
  "Puso en peligro su vida",
  "Causó hospitalización",
  "Prolongó hospitalización",
  "Incapacidad persistente",
  "Mortal",
  "Anomalía congénita",
  "Otro"
];

export default function NotificacionInicial() {
  const navigate = useNavigate();
  const crearCaso = useCasesStore(state => state.crearCaso);
  const { userEmail } = useAuthStore();

  const { control, handleSubmit, watch, reset, setValue } = useForm<NotificacionFormValues>({
    resolver: zodResolver(notificacionSchema),
    defaultValues: {
      fechaNotificacion: '', nombreNotificador: '', cargoNotificador: '', establecimientoNotificador: '', telefonoNotificador: '', correoNotificador: '',
      nombrePaciente: '', genero: '', fechaNacimiento: '', edad: 0, unidadEdad: 'Años', expedienteClinico: '', 
      pesoKg: 0, alturaCm: 0, padeceOtrasEnfermedades: false, nombreEnfermedad: '', fechaDiagnostico: '', pacienteDUI: '', pacienteDireccion: '', pacienteResponsable: '',
      nombreVacuna: '', fechaAdministracion: '', horaAdministracion: '', dosisAdministradas: '', lote: '', fabricante: '', fechaCaducidad: '', sitioAnatomico: '', establecimientoVacunacion: '', medidasTomadas: '', viaAdministracion: '', dosisYPosologia: '',
      fechaInicioReaccion: '', horaInicioReaccion: '', fechaFinReaccion: '', sintomasReaccion: '', eventoGravedad: '', criterioGravedad: [], desenlace: '', tratamientoRecibido: '', antecedentesMedicosRelevantes: '', observacionesAdicionales: ''
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const padeceOtrasEnfermedades = watch('padeceOtrasEnfermedades');
  const eventoGravedad = watch('eventoGravedad');

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

      // Regex parsing según reglas FACEDRA mejorado
      const pacienteMatch = text.match(/Nombre y Apellidos:\s*(.+?)(?=Nº de Expediente|Sexo|Edad)/is);
      if (pacienteMatch) {
        setValue('nombrePaciente', pacienteMatch[1].replace(/\n/g, ' ').trim());
      }

      const expedienteMatch = text.match(/Nº de Expediente:\s*(.+?)(?=Sexo|Edad|Peso)/is);
      if (expedienteMatch) {
        setValue('expedienteClinico', expedienteMatch[1].replace(/\n/g, ' ').trim());
      }

      const edadMatch = text.match(/Edad:\s*(\d+)/i);
      if (edadMatch) setValue('edad', parseInt(edadMatch[1]));

      const sexoMatch = text.match(/Sexo:\s*(Femenino|Masculino)/i);
      if (sexoMatch) setValue('genero', sexoMatch[1]);

      const pesoMatch = text.match(/Peso\s*\(kg\):\s*([\d,.]+)/i);
      if (pesoMatch) setValue('pesoKg', parseFloat(pesoMatch[1].replace(',', '.')));

      const alturaMatch = text.match(/Altura\s*\(cm\):\s*([\d,.]+)/i);
      if (alturaMatch) setValue('alturaCm', parseFloat(alturaMatch[1].replace(',', '.')));

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
        else mappedVac = vacStr.trim();
        
        setValue('nombreVacuna', mappedVac);
      }

      const loteMatch = text.match(/Lote y fecha de caducidad:\s*(.+?)(?=\n|Motivo|Dosis|-)/is);
      if (loteMatch) {
        const lote = loteMatch[1].replace(/\n/g, ' ').trim();
        if (!lote.includes('NO DATOS')) {
          setValue('lote', lote);
        }
      }

      const viaMatch = text.match(/Vía de administración:\s*(.+?)(?=\n|Medidas)/is);
      if (viaMatch) setValue('viaAdministracion', viaMatch[1].replace(/\n/g, ' ').trim());

      const dosisPosMatch = text.match(/Dosis y posología:\s*(.+?)(?=\n|Vía)/is);
      if (dosisPosMatch) setValue('dosisYPosologia', dosisPosMatch[1].replace(/\n/g, ' ').trim());

      // Fechas (Hay dos en el documento: Vacuna y Evento)
      const fechasMatch = [...text.matchAll(/Fecha [I|i]nicio:\s*(\d{2})\/(\d{2})\/(\d{4})/g)];
      if (fechasMatch.length > 0) {
        // Primera es de Vacunación (Sección Medicamento)
        setValue('fechaAdministracion', `${fechasMatch[0][3]}-${fechasMatch[0][2]}-${fechasMatch[0][1]}`);
        
        if (fechasMatch.length > 1) {
          // Segunda es del Evento (Sección Reacciones)
          setValue('fechaInicioReaccion', `${fechasMatch[1][3]}-${fechasMatch[1][2]}-${fechasMatch[1][1]}`);
        }
      }

      const eventoMatch = text.match(/Reacción adversa:\s*(.+?)(?=Fecha|Desenlace)/is);
      if (eventoMatch) setValue('sintomasReaccion', eventoMatch[1].replace(/\n/g, ' ').trim());

      const observacionesMatch = text.match(/Observaciones adicionales:\s*(.+?)(?=\nNOTIFICADOR|NOTIFICADOR|$)/is);
      if (observacionesMatch) setValue('observacionesAdicionales', observacionesMatch[1].replace(/\n/g, ' ').trim());

      // Detectar gravedad automáticamente
      if (text.toLowerCase().includes('han sido la causa de su hospitalización')) {
        setValue('eventoGravedad', 'Grave');
        setValue('criterioGravedad', ['Causó hospitalización']);
      } else if (text.toLowerCase().includes('puso en peligro su vida')) {
        setValue('eventoGravedad', 'Grave');
        setValue('criterioGravedad', ['Puso en peligro su vida']);
      } else if (text.toLowerCase().includes('mortal') || text.toLowerCase().includes('fallecido')) {
        setValue('eventoGravedad', 'Grave');
        setValue('criterioGravedad', ['Mortal']);
      }

      const desenlaceMatch = text.match(/Desenlace:\s*(.+?)(?=\n|Observaciones)/is);
      if (desenlaceMatch) {
        const desStr = desenlaceMatch[1].trim().toUpperCase();
        let mappedDes = 'Desconocido';
        if (desStr.includes('RECUPERADO') && !desStr.includes('NO')) mappedDes = 'Recuperado';
        else if (desStr.includes('EN RECUPERACIÓN') || desStr.includes('RECUPERANDO')) mappedDes = 'En recuperacion';
        else if (desStr.includes('NO RECUPERADO')) mappedDes = 'No recuperado';
        else if (desStr.includes('FATAL') || desStr.includes('FALLECIDO') || desStr.includes('MUERTE')) mappedDes = 'Mortal';
        
        setValue('desenlace', mappedDes);
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

      const correoMatch = text.match(/Correo electrónico:\s*(.+?)(?=Tipo de centro|Centro de trabajo)/is);
      if (correoMatch) setValue('correoNotificador', correoMatch[1].replace(/\n/g, ' ').trim());

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

  const onSubmit = async (data: NotificacionFormValues) => {
    console.log("Notificación Inicial Registrada:", data);
    
    const idCasoNuevo = `ESAVI-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // 1. Preparar Payload para Google Sheets
    const payload = {
      tabla: 'EXPEDIENTES',
      datos: {
        id_caso: idCasoNuevo,
        id_creador: userEmail || 'desconocido',
        estado_flujo: 'PENDIENTE_OFICIALIZAR', // REGLA DE NEGOCIO ESTRICTA
        fecha_notificacion: new Date().toISOString().split('T')[0],
        identificador_paciente: data.expedienteClinico || '',
        tiene_evidencias: true,
        establecimiento_notificador: data.establecimientoNotificador || '',
        // Nuevos campos de Noti-FACEDRA integrados a la tabla principal
        nombre_paciente: data.nombrePaciente || '',
        edad: data.edad || '',
        sexo: data.genero || '',
        nombre_vacuna: data.nombreVacuna || '',
        fecha_vacunacion: data.fechaAdministracion || '',
        sintomas: data.sintomasReaccion || '',
        criterio_gravedad: data.criterioGravedad && data.criterioGravedad.length > 0 ? data.criterioGravedad.join(', ') : '',
        // Nuevas columnas requeridas para FACEDRA
        peso_kg: data.pesoKg || '',
        altura_cm: data.alturaCm || '',
        via_administracion: data.viaAdministracion || '',
        dosis_posologia: data.dosisYPosologia || '',
        correo_notificador: data.correoNotificador || '',
        observaciones_adicionales: data.observacionesAdicionales || ''
      }
    };

      let urlCarpetaDrive = '';
      
      // 2. Enviar al Backend si la API está activada
      if (import.meta.env.VITE_USE_API === 'true') {
        try {
          // A. Crear estructura de carpetas primero
          console.log("Notificando a la UVS de la SRS y creando repositorio documental...");
          const resCarpeta = await crearCarpetaCaso(idCasoNuevo);
          if (resCarpeta && resCarpeta.data) {
             urlCarpetaDrive = resCarpeta.data.carpeta_principal;
             payload.datos.url_carpeta_drive = urlCarpetaDrive;
          }

          // B. Guardar en tabla
          await guardarEnSheets('EXPEDIENTES', payload.datos);
        } catch (error) {
          console.error("Error al guardar en Google Sheets o Drive:", error);
          alert("Hubo un error al guardar el caso en la base de datos central. Intente nuevamente.");
          return; // Bloqueamos el flujo local si falla
        }
      }
      
      // 3. Guardar en Store Local (Zustand)
    const nuevoCaso = {
      id: idCasoNuevo,
      paciente: data.nombrePaciente,
      establecimiento: data.establecimientoNotificador,
      vacuna: data.nombreVacuna,
      fase: 'Fase 1: Notificación',
      estadoFlujo: 'PENDIENTE_OFICIALIZAR' as const,
      riesgo: 'Sin clasificar',
      fecha: new Date().toISOString(),
      reuniones: [],
      miembrosERR: []
    };

    await crearCaso(nuevoCaso, data);
    
    // 4. Enviar notificación dirigida al SECRETARIADO
    if (import.meta.env.VITE_USE_API === 'true') {
      await crearNotificacion({
        id_caso: idCasoNuevo,
        rol_destino: 'SECRETARIADO',
        texto: `Se ha registrado una nueva Notificación Inicial (Caso ${idCasoNuevo}). Por favor, asigne un número de expediente y oficialice el caso.`
      });
    }

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
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="correoNotificador" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Correo electrónico" type="email" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
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
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller name="nombrePaciente" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Nombre Completo del Paciente" required error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="expedienteClinico" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Nº de Expediente Clínico" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="genero" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Género" required error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </TextField>
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="fechaNacimiento" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de Nacimiento"
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Controller name="edad" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  fullWidth type="number" label="Edad" 
                  error={!!fieldState.error} helperText={fieldState.error?.message} 
                />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Controller name="unidadEdad" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Unidad" error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="Años">Años</MenuItem>
                  <MenuItem value="Meses">Meses</MenuItem>
                  <MenuItem value="Días">Días</MenuItem>
                </TextField>
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller name="pesoKg" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  fullWidth type="number" label="Peso (Kg)" 
                  error={!!fieldState.error} helperText={fieldState.error?.message} 
                />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller name="alturaCm" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  fullWidth type="number" label="Altura (Cm)" 
                  error={!!fieldState.error} helperText={fieldState.error?.message} 
                />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="pacienteDUI" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Identidad (DUI/Pas)" placeholder="Ej: 12345678-9" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller name="padeceOtrasEnfermedades" control={control} render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="¿Padece otras enfermedades relevantes o concomitantes?"
                />
              )}/>
            </Grid>
            {padeceOtrasEnfermedades && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller name="nombreEnfermedad" control={control} render={({ field, fieldState }) => (
                    <TextField {...field} fullWidth label="Nombre de la enfermedad" error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}/>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller name="fechaDiagnostico" control={control} render={({ field, fieldState }) => (
                    <TextField {...field} fullWidth type="date" label="Fecha de diagnóstico" slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}/>
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12, md: 12 }}>
              <Controller name="pacienteDireccion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Dirección de residencia completa" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <Controller name="pacienteResponsable" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Nombre del responsable (si es menor o dependiente)" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* SECCIÓN C: Datos de la Vacuna */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            C. Datos del Medicamento / Vacuna Implicada
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="nombreVacuna" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Nombre de la Vacuna o Medicamento" required error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller name="fechaAdministracion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de administración" required 
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller name="horaAdministracion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="time" label="Hora de administración"
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="dosisAdministradas" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Dosis administradas (Ej. 1a, 2a)" error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="1ra">1ra Dosis</MenuItem>
                  <MenuItem value="2da">2da Dosis</MenuItem>
                  <MenuItem value="3ra">3ra Dosis</MenuItem>
                  <MenuItem value="Refuerzo">Refuerzo</MenuItem>
                  <MenuItem value="Unica">Única</MenuItem>
                </TextField>
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="lote" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Número de Lote" required error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="fabricante" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Nombre del Fabricante" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="fechaCaducidad" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de caducidad"
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller name="sitioAnatomico" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Sitio anatómico de aplicación (Ej. Brazo izquierdo)" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="viaAdministracion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Vía de administración (Ej. Intramuscular)" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="dosisYPosologia" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Dosis y Posología (Ej. 0.5ML)" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller name="establecimientoVacunacion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Establecimiento de vacunación" error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="medidasTomadas" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Medidas tomadas con el fármaco" error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="Retirada del fármaco">Retirada del fármaco</MenuItem>
                  <MenuItem value="Reducción de dosis">Reducción de dosis</MenuItem>
                  <MenuItem value="Sin modificación">Sin modificación</MenuItem>
                  <MenuItem value="Desconocido">Desconocido</MenuItem>
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
            D. Reacciones / Detalles del Evento (ESAVI)
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="fechaInicioReaccion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="date" label="Fecha inicio de reacción" required 
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="horaInicioReaccion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="time" label="Hora inicio de reacción"
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="fechaFinReaccion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth type="date" label="Fecha fin de reacción"
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{ inputLabel: { shrink: true } }} sx={getDateTimeSx(!!field.value)} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="eventoGravedad" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Gravedad del Evento" required error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="No Grave">No Grave</MenuItem>
                  <MenuItem value="Grave">Grave</MenuItem>
                </TextField>
              )}/>
            </Grid>

            {eventoGravedad === 'Grave' && (
              <Grid size={{ xs: 12 }}>
                <Controller name="criterioGravedad" control={control} render={({ field }) => (
                  <FormControl component="fieldset" sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fff3e0' }}>
                    <FormLabel component="legend" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Criterios de Gravedad (Seleccione los que apliquen)</FormLabel>
                    <FormGroup row>
                      {CRITERIOS_GRAVEDAD.map((criterio) => (
                        <FormControlLabel
                          key={criterio}
                          control={
                            <Checkbox
                              checked={field.value?.includes(criterio) || false}
                              onChange={(e) => {
                                const current = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...current, criterio]);
                                } else {
                                  field.onChange(current.filter((c: string) => c !== criterio));
                                }
                              }}
                            />
                          }
                          label={criterio}
                        />
                      ))}
                    </FormGroup>
                  </FormControl>
                )}/>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Controller name="sintomasReaccion" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth multiline rows={4} label="Síntomas / Diagnóstico de la Reacción" placeholder="Describa a detalle los signos, síntomas, texto diagnóstico..." required error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller name="observacionesAdicionales" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth multiline rows={2} label="Observaciones Adicionales" placeholder="Notas extra provenientes de la notificación..." error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller name="antecedentesMedicosRelevantes" control={control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth multiline rows={3} label="Antecedentes médicos relevantes y alergias" placeholder="Detalle alergias a medicamentos u otras condiciones clínicas..." error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}/>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="desenlace" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Desenlace actual" error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="Recuperado">Recuperado</MenuItem>
                  <MenuItem value="En recuperacion">En recuperación</MenuItem>
                  <MenuItem value="No recuperado">No recuperado</MenuItem>
                  <MenuItem value="Mortal">Mortal</MenuItem>
                  <MenuItem value="Desconocido">Desconocido</MenuItem>
                </TextField>
              )}/>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="tratamientoRecibido" control={control} render={({ field, fieldState }) => (
                <TextField {...field} select fullWidth label="Tratamiento recibido por la reacción" error={!!fieldState.error} helperText={fieldState.error?.message}>
                  <MenuItem value="Farmacológico">Farmacológico</MenuItem>
                  <MenuItem value="Quirúrgico">Quirúrgico</MenuItem>
                  <MenuItem value="Sin tratamiento">Sin tratamiento</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </TextField>
              )}/>
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