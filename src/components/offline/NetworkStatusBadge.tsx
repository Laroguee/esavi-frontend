import React, { useState } from 'react';
import { Chip, Tooltip, Badge, Box } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import SyncManagerModal from './SyncManagerModal';

export default function NetworkStatusBadge() {
  const {
    isOnline,
    pendingCount,
    isSyncing,
    triggerManualSync
  } = useNetworkStatus();

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={
          !isOnline 
            ? 'Sin conexión a internet. Los datos se guardan en el dispositivo.' 
            : pendingCount > 0 
              ? `${pendingCount} elementos pendientes de sincronizar. Clic para ver.` 
              : 'Conectado a los servidores de ESAVI.'
        }>
          <span>
            {isSyncing ? (
              <Chip
                icon={<SyncIcon sx={{ animation: 'spin 1.5s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />}
                label="Sincronizando..."
                color="info"
                size="small"
                onClick={() => setModalOpen(true)}
                sx={{ fontWeight: 'bold', color: 'white' }}
              />
            ) : !isOnline ? (
              <Badge badgeContent={pendingCount} color="error" overlap="circular">
                <Chip
                  icon={<WifiOffIcon />}
                  label="Modo Offline"
                  color="warning"
                  size="small"
                  onClick={() => setModalOpen(true)}
                  sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                />
              </Badge>
            ) : pendingCount > 0 ? (
              <Chip
                icon={<CloudQueueIcon />}
                label={`Pendientes (${pendingCount})`}
                color="secondary"
                size="small"
                onClick={() => setModalOpen(true)}
                sx={{ fontWeight: 'bold', cursor: 'pointer' }}
              />
            ) : (
              <Chip
                icon={<WifiIcon sx={{ fontSize: '1rem !important' }} />}
                label="En Línea"
                variant="outlined"
                size="small"
                onClick={() => setModalOpen(true)}
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.4)', 
                  fontWeight: 500,
                  cursor: 'pointer',
                  '& .MuiChip-icon': { color: '#4caf50' }
                }}
              />
            )}
          </span>
        </Tooltip>
      </Box>

      <SyncManagerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onSyncNow={triggerManualSync}
      />
    </>
  );
}
