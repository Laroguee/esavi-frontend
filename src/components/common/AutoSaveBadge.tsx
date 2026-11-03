import { Chip, CircularProgress, Tooltip } from '@mui/material';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

interface AutoSaveBadgeProps {
  isSaving: boolean;
  lastSavedAt: Date | null;
}

/**
 * Indicador visual discreto del estado del autoguardado en IndexedDB (Dexie).
 * Informa al médico que su progreso está a salvo localmente ante cortes de energía o red.
 */
export default function AutoSaveBadge({ isSaving, lastSavedAt }: AutoSaveBadgeProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (isSaving) {
    return (
      <Tooltip title="Persistiendo cambios en la base de datos local del navegador (IndexedDB)">
        <Chip
          icon={<CircularProgress size={14} color="inherit" />}
          label="Guardando borrador..."
          size="small"
          color="info"
          variant="outlined"
          sx={{
            fontWeight: 500,
            fontSize: '0.75rem',
            bgcolor: 'info.50'
          }}
        />
      </Tooltip>
    );
  }

  if (lastSavedAt) {
    return (
      <Tooltip title={`Tus cambios se han respaldado en este equipo a las ${formatTime(lastSavedAt)}. No se perderán si se cierra la pestaña.`}>
        <Chip
          icon={<CheckCircleOutlinedIcon sx={{ fontSize: 16 }} />}
          label={`Borrador local (${formatTime(lastSavedAt)})`}
          size="small"
          color="success"
          variant="outlined"
          sx={{
            fontWeight: 500,
            fontSize: '0.75rem',
            bgcolor: 'success.50'
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Autoguardado continuo habilitado con Dexie/IndexedDB">
      <Chip
        icon={<CloudQueueIcon sx={{ fontSize: 16 }} />}
        label="Autoguardado activo"
        size="small"
        variant="outlined"
        sx={{
          fontWeight: 400,
          fontSize: '0.75rem',
          color: 'text.secondary',
          borderColor: 'divider'
        }}
      />
    </Tooltip>
  );
}
