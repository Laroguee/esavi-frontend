import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';

interface DraftRecoveryModalProps {
  open: boolean;
  draftTimestamp: string | null;
  onRestore: () => void;
  onDiscard: () => void;
  tipoAnexoNombre?: string;
}

/**
 * Diálogo modal para notificar al médico que existe un borrador previo no guardado
 * en su equipo y ofrecerle restaurarlo o descartarlo.
 */
export default function DraftRecoveryModal({
  open,
  draftTimestamp,
  onRestore,
  onDiscard,
  tipoAnexoNombre = 'este formulario'
}: DraftRecoveryModalProps) {
  const formattedDate = draftTimestamp
    ? new Date(draftTimestamp).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'fecha reciente';

  return (
    <Dialog
      open={open}
      aria-labelledby="draft-recovery-title"
      aria-describedby="draft-recovery-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="draft-recovery-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryEduIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          Borrador local detectado
        </Typography>
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="draft-recovery-description" sx={{ color: 'text.primary', mb: 2 }}>
          Se encontró un avance guardado automáticamente en este equipo para <strong>{tipoAnexoNombre}</strong> con fecha:
        </DialogContentText>
        
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'action.hover',
            borderRadius: 1,
            borderLeft: 4,
            borderColor: 'primary.main',
            mb: 2
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
            Último guardado: {formattedDate}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Este borrador contiene información que aún no ha sido oficializada en el servidor central.
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          ¿Deseas restaurar este borrador para continuar trabajando donde lo dejaste, o prefieres descartarlo y usar la versión registrada en el servidor?
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onDiscard}
          color="inherit"
          variant="outlined"
          startIcon={<DeleteOutlinedIcon />}
          size="medium"
        >
          Descartar borrador
        </Button>
        <Button
          onClick={onRestore}
          color="primary"
          variant="contained"
          startIcon={<RestoreIcon />}
          size="medium"
          autoFocus
        >
          Restaurar avance
        </Button>
      </DialogActions>
    </Dialog>
  );
}
