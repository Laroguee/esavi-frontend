import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificacionInicial from '../forms/Fase1_Notificacion/NotificacionInicial';

export default function EdicionFase1Modal({ open, onClose, casoId, readOnly = false }: { open: boolean, onClose: () => void, casoId: string, readOnly?: boolean }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {readOnly ? 'Ver Notificación Inicial (Fase 1)' : 'Editar Notificación Inicial (Fase 1)'}
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: '#f4f6f8' }}>
        <NotificacionInicial isModal casoIdEdit={casoId} onClose={onClose} readOnly={readOnly} />
      </DialogContent>
    </Dialog>
  );
}
