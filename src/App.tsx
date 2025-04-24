import { useEffect, useState } from 'react';
import {
    ThemeProvider,
    CssBaseline,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Switch,
    Box,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import CanvasStarfield from './components/CanvasStarfield';
import config from './config/config.ts';
import { darkTheme, lightTheme } from './common/theme.ts';
import Sidebar from './components/Sidebar.tsx';
import { Route, Routes } from 'react-router-dom';
import UrlsPage from './pages/UrlsPage.tsx';
import DemoPage from './pages/DemoPage.tsx';

export default function App() {
    const [darkMode, setDarkMode] = useState(
        !localStorage.getItem(config.darkModeKey) ||
            localStorage.getItem(config.darkModeKey) === 'true',
    );

    useEffect(() => {
        localStorage.setItem(config.darkModeKey, darkMode ? 'true' : 'false');
    }, [darkMode]);

    return (
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <CssBaseline />

            <Box
                sx={{
                    position: 'relative',
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    overflow: 'hidden',
                    display: 'flex',
                }}
            >
                <CanvasStarfield
                    countFar={4000}
                    countNear={8000}
                    parallaxFar={2}
                    parallaxNear={4}
                    dark={darkMode}
                />

                <Sidebar />

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 0,
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <AppBar position="static" elevation={0} style={{ borderLeft: 'none' }}>
                        <Toolbar>
                            <Typography variant="h5" sx={{ flexGrow: 1 }}>
                                Shortener Dashboard
                            </Typography>
                            <IconButton onClick={() => setDarkMode((v) => !v)} color="inherit">
                                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                            <Switch
                                checked={darkMode}
                                onChange={() => setDarkMode((v) => !v)}
                                color="secondary"
                            />
                        </Toolbar>
                    </AppBar>

                    <Box
                        sx={{
                            px: 3,
                        }}
                    >
                        <Routes>
                            <Route path={'/urls'} element={<UrlsPage />} />
                            <Route path={'/demo'} element={<DemoPage />} />
                        </Routes>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
