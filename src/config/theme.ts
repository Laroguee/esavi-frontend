import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#231136', // El morado/azul muy oscuro del Header
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#B5A835', // El mostaza/dorado del botón "Buscar"
      contrastText: '#ffffff',
    },
    background: {
      default: '#F4F6F8', // El gris clarito del fondo de la página
      paper: '#ffffff',   // El fondo blanco de las tarjetas
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h6: {
      fontWeight: 700,
    },
  },
});

export default theme;