import { createTheme } from '@mui/material/styles';

const sharedTypography = {
    fontFamily: "'Poppins', sans-serif",
    h1: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700 },
    h2: { fontFamily: "'Orbitron', sans-serif", fontWeight: 600 },
    h3: { fontFamily: "'Orbitron', sans-serif", fontWeight: 500 },
    h4: { fontFamily: "'Orbitron', sans-serif", fontWeight: 500 },
    h5: { fontFamily: "'Orbitron', sans-serif", fontWeight: 500 },
    h6: { fontFamily: "'Orbitron', sans-serif", fontWeight: 500 },
    body1: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
    body2: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
};

const PURPLE = '#BF00FF';

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: PURPLE, contrastText: '#FFF' },
        secondary: { main: '#888', contrastText: '#FFF' },
        background: {
            default: '#F4F4F6',
            paper: '#FFFFFF',
        },
        text: { primary: '#212121', secondary: '#555' },
        divider: '#CCC',
    },
    typography: sharedTypography,
    components: {
        MuiAppBar: {
            defaultProps: { color: 'transparent', elevation: 0 },
            styleOverrides: {
                root: {
                    backgroundColor: 'transparent',
                    border: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: ({ theme }) => ({
                    border: `1px solid ${theme.palette.divider}`,
                }),
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    backgroundColor: 'transparent',
                    border: 'none',
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
        background: {
            default: '#050014',
            paper: '#050014',
        },
        text: { primary: '#E0E0E0', secondary: '#888' },
        divider: 'rgba(191, 0, 255, 0.4)',
    },
    typography: sharedTypography,
    components: {
        MuiAppBar: {
            defaultProps: { color: 'transparent', elevation: 0 },
            styleOverrides: {
                root: ({ theme }) => ({
                    backgroundColor: theme.palette.background.default,
                }),
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: 'none',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: ({ theme }) => ({
                    fontWeight: theme.typography.body2.fontWeight,
                    color: theme.palette.text.primary,
                }),
            },
        },
    },
});
