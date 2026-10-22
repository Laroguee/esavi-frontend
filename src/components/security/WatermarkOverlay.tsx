import React, { useEffect, useState, useMemo } from 'react';
import { Box } from '@mui/material';
import { useAuthStore } from '../../store/useAuthStore';

interface WatermarkOverlayProps {
  opacity?: number;
  customText?: string;
}

export default function WatermarkOverlay({ opacity = 0.055, customText }: WatermarkOverlayProps) {
  const { userName, currentRole, userEmail } = useAuthStore();
  const [timestamp, setTimestamp] = useState<string>('');

  // Actualizar la estampa de tiempo cada minuto para trazabilidad forense
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('es-SV', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) + ' ' + now.toLocaleTimeString('es-SV', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setTimestamp(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Construir la cadena de texto con datos de auditoría
  const watermarkText = useMemo(() => {
    if (customText) return customText;
    const user = userName || userEmail?.split('@')[0] || 'USUARIO';
    const role = currentRole || 'ESAVI';
    return `${user.toUpperCase()} • ${role} • CONFIDENCIAL • ${timestamp}`;
  }, [customText, userName, userEmail, currentRole, timestamp]);

  // Generar un patrón SVG repetitivo en Base64
  const svgDataUri = useMemo(() => {
    // Escapar caracteres para SVG
    const safeText = watermarkText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="450" height="250">
        <text 
          x="50%" 
          y="50%" 
          text-anchor="middle" 
          dominant-baseline="middle" 
          transform="rotate(-25, 225, 125)" 
          fill="#000000" 
          font-family="Roboto, Arial, sans-serif" 
          font-weight="bold" 
          font-size="14" 
          letter-spacing="1.5"
        >
          ${safeText}
        </text>
      </svg>
    `;

    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, [watermarkText]);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Crucial: No interfiere con clics, selección o interacción de formularios
        zIndex: 9998,
        opacity: opacity,
        backgroundImage: svgDataUri,
        backgroundRepeat: 'repeat',
        userSelect: 'none',
        mixBlendMode: 'multiply',
        '@media print': {
          opacity: 0.12, // Mayor contraste al imprimirse
          position: 'fixed',
          zIndex: 99999
        }
      }}
    />
  );
}
