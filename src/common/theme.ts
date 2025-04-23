import { createTheme } from '@mui/material/styles';

const sharedTypography = {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700 },
    h2: { fontFamily: "'Orbitron', sans-serif", fontWeight: 600 },
    h3: { fontFamily: "'Orbitron', sans-serif", fontWeight: 500 },
    body1: { fontFamily: "'Inter', sans-serif", fontWeight: 400 },
    body2: { fontFamily: "'Inter', sans-serif", fontWeight: 300 },
};

const PURPLE = '#BF00FF';
const PURPLE_FADE = 'rgba(191,0,255,0.2)';

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: PURPLE, contrastText: '#FFF' },
        secondary: { main: '#888', contrastText: '#FFF' },
        background: { default: '#FAFAFA', paper: '#FFF' },
        text: { primary: '#212121', secondary: '#555' },
        divider: '#DDD',
    },
    typography: sharedTypography,
    components: {
        MuiAppBar: {
            defaultProps: { color: 'transparent', elevation: 0 },
            styleOverrides: {
                root: { backgroundColor: 'transparent' },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                },
                containedPrimary: {
                    backgroundColor: PURPLE,
                    '&:hover': { backgroundColor: '#A100CC' },
                },
                outlinedPrimary: {
                    borderColor: PURPLE,
                    color: PURPLE,
                    '&:hover': { backgroundColor: '#F7E0FF' },
                },
                textPrimary: {
                    color: PURPLE,
                    '&:hover': { backgroundColor: '#F7E0FF' },
                },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    color: PURPLE,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    border: `1px solid ${PURPLE_FADE}`,
                },
            },
        },
    },
});

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: PURPLE, contrastText: '#FFF' },
        secondary: { main: '#777', contrastText: '#FFF' },
        background: { default: '#050014', paper: '#10002E' },
        text: { primary: '#E0E0E0', secondary: '#888' },
        divider: '#333',
    },
    typography: sharedTypography,
    components: {
        MuiAppBar: {
            defaultProps: { color: 'transparent', elevation: 0 },
            styleOverrides: {
                root: { backgroundColor: 'transparent' },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                },
                containedPrimary: {
                    backgroundColor: PURPLE,
                    '&:hover': { backgroundColor: '#A100CC' },
                },
                outlinedPrimary: {
                    borderColor: PURPLE,
                    color: PURPLE,
                    '&:hover': { backgroundColor: '#2B002D' },
                },
                textPrimary: {
                    color: PURPLE,
                    '&:hover': { backgroundColor: '#2B002D' },
                },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    color: PURPLE,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    border: `1px solid ${PURPLE_FADE}`,
                },
            },
        },
    },
});
