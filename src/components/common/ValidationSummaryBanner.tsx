import { Alert, AlertTitle, Box, Chip, Collapse, Typography } from '@mui/material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import type { FieldErrors } from 'react-hook-form';

interface ValidationSummaryBannerProps {
  errors: FieldErrors<any>;
  fieldLabels?: Record<string, string>;
  onFieldClick?: (fieldName: string) => void;
}

/**
 * Banner superior de resumen de validaciones Zod.
 * Aparece cuando falla el envío del formulario, indicando cuántos campos
 * tienen errores y permitiendo al médico hacer clic para saltar al campo exacto.
 */
export default function ValidationSummaryBanner({
  errors,
  fieldLabels = {},
  onFieldClick
}: ValidationSummaryBannerProps) {
  const errorEntries = Object.entries(errors);
  const errorCount = errorEntries.length;

  if (errorCount === 0) return null;

  return (
    <Collapse in={errorCount > 0}>
      <Alert
        severity="error"
        icon={<ErrorOutlineOutlinedIcon fontSize="medium" />}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'error.light',
          boxShadow: '0 2px 8px rgba(211, 47, 47, 0.08)'
        }}
      >
        <AlertTitle sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
          Se encontraron {errorCount} {errorCount === 1 ? 'campo pendiente o inválido' : 'campos pendientes o con observaciones'}
        </AlertTitle>
        <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
          Por favor revisa y completa los siguientes datos antes de oficializar o guardar el formulario:
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {errorEntries.map(([fieldKey, errorObj]: [string, any]) => {
            const label = fieldLabels[fieldKey] || fieldKey;
            const message = errorObj?.message || 'Valor inválido o requerido';

            return (
              <Chip
                key={fieldKey}
                label={`${label}: ${message}`}
                size="small"
                color="error"
                variant="outlined"
                clickable={!!onFieldClick}
                onClick={() => onFieldClick && onFieldClick(fieldKey)}
                sx={{
                  bgcolor: 'background.paper',
                  fontWeight: 500,
                  fontSize: '0.78rem',
                  maxWidth: '100%',
                  '&:hover': {
                    bgcolor: 'error.50'
                  }
                }}
              />
            );
          })}
        </Box>
      </Alert>
    </Collapse>
  );
}
