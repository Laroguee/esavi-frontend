/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  TextField,
  type TextFieldProps,
  InputAdornment,
  IconButton,
  Tooltip,
  Box,
  Typography,
  keyframes,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffOutlinedIcon from '@mui/icons-material/MicOffOutlined';
import { useSpeechToText } from '../../hooks/useSpeechToText';

// Animación de pulso cuando está grabando
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7);
  }
  70% {
    transform: scale(1.15);
    box-shadow: 0 0 0 8px rgba(211, 47, 47, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
  }
`;

export interface VoiceTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onVoiceTranscript?: (finalTranscript: string) => void;
  enableVoice?: boolean;
  voiceLanguage?: string;
}

export const VoiceTextField: React.FC<VoiceTextFieldProps> = ({
  value = '',
  onChange,
  onVoiceTranscript,
  enableVoice = true,
  voiceLanguage = 'es-SV',
  InputProps,
  helperText,
  slotProps,
  ...restProps
}) => {
  const [prevValue, setPrevValue] = useState<string>(value);
  const [internalValue, setInternalValue] = useState<string>(value);
  const [liveInterim, setLiveInterim] = useState<string>('');

  // Sincronización idéntica recomendada por React docs para props derivadas sin efectos secundarios en cascada
  if (value !== prevValue) {
    setPrevValue(value);
    setInternalValue(value);
  }

  const {
    isListening,
    isSupported,
    error: speechError,
    toggleListening,
  } = useSpeechToText({
    lang: voiceLanguage,
    continuous: true,
    interimResults: true,
    autoPunctuation: true,
    onResult: (text: string, isFinal: boolean) => {
      if (isFinal) {
        setLiveInterim('');
        // Anexar texto nuevo preservando espacios
        const current = internalValue || '';
        const separator = current && !current.endsWith(' ') && !current.endsWith('\n') ? ' ' : '';
        const updatedValue = current + separator + text;

        setInternalValue(updatedValue);
        onVoiceTranscript?.(text);

        if (onChange) {
          const syntheticEvent = {
            target: {
              name: restProps.name || '',
              value: updatedValue,
            },
          } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
          onChange(syntheticEvent);
        }
      } else {
        setLiveInterim(text);
      }
    },
  });

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInternalValue(e.target.value);
    onChange?.(e);
  };

  const getTooltipTitle = () => {
    if (!enableVoice) return '';
    if (!isSupported) return 'Dictado por voz no soportado en este navegador (use Google Chrome o Microsoft Edge)';
    if (isListening) return 'Grabando... Clic para detener. Diga "punto", "coma", "punto y aparte"';
    if (speechError) return `Error de micrófono: ${speechError}. Clic para reintentar`;
    return 'Dictar con voz (Español MINSAL)';
  };

  const voiceAdornment = enableVoice ? (
    <InputAdornment
      position="end"
      sx={{
        alignSelf: restProps.multiline ? 'flex-start' : 'center',
        mt: restProps.multiline ? 0.75 : 0,
        ml: 0.5,
      }}
    >
      <Tooltip title={getTooltipTitle()} arrow placement="top">
        <span>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              toggleListening();
            }}
            disabled={!isSupported}
            color={isListening ? 'error' : speechError ? 'warning' : 'primary'}
            sx={{
              p: 0.5,
              border: isListening ? '2px solid #d32f2f' : '1px solid rgba(25, 118, 210, 0.3)',
              backgroundColor: isListening ? 'rgba(211, 47, 47, 0.15)' : 'rgba(25, 118, 210, 0.05)',
              '&:hover': {
                backgroundColor: isListening ? 'rgba(211, 47, 47, 0.25)' : 'rgba(25, 118, 210, 0.15)',
              },
              transition: 'all 0.2s ease-in-out',
              ...(isListening && {
                animation: `${pulseAnimation} 1.5s infinite`,
              }),
            }}
            aria-label="Dictado por voz"
          >
            {!isSupported ? (
              <MicOffOutlinedIcon fontSize="small" sx={{ opacity: 0.5 }} />
            ) : isListening ? (
              <MicIcon fontSize="small" sx={{ color: '#d32f2f' }} />
            ) : (
              <MicIcon fontSize="small" color="primary" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </InputAdornment>
  ) : null;

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <TextField
        {...restProps}
        value={internalValue}
        onChange={handleManualChange}
        helperText={
          liveInterim ? (
            <Typography
              component="span"
              variant="caption"
              sx={{ color: 'primary.main', fontStyle: 'italic', display: 'block', mt: 0.5 }}
            >
              🎙️ Escuchando: "{liveInterim}..."
            </Typography>
          ) : (
            helperText
          )
        }
        // Soporta tanto slotProps (MUI v6+) como InputProps (MUI v5)
        slotProps={{
          ...slotProps,
          input: {
            ...(slotProps as any)?.input,
            endAdornment: (
              <>
                {(slotProps as any)?.input?.endAdornment}
                {voiceAdornment}
              </>
            ),
          },
        }}
        InputProps={{
          ...InputProps,
          endAdornment: (
            <>
              {InputProps?.endAdornment}
              {voiceAdornment}
            </>
          ),
        }}
      />
    </Box>
  );
};
