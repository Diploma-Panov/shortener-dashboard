import { useEffect, useState } from 'react';
import {
    ThemeProvider,
    CssBaseline,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Switch,
    Button,
    TextField,
    Card,
    CardContent,
    Box,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import CanvasStarfield from './components/CanvasStarfield';
import config from './config/config.ts';
import { darkTheme, lightTheme } from './common/theme.ts';
import BackgroundCard from './components/BackgroundCard.tsx';
import Sidebar from './components/Sidebar.tsx';

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
                    parallaxFar={4}
                    parallaxNear={8}
                    dark={darkMode}
                />

                <Sidebar />

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 1,
                        px: 3,
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <AppBar position="static" color="primary" elevation={0}>
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

                    <BackgroundCard padding={6}>
                        <Typography variant="h1" gutterBottom>
                            Heading 1
                        </Typography>
                        <Typography variant="h2" gutterBottom>
                            Heading 2
                        </Typography>

                        <Typography variant="body1" paragraph>
                            Sample paragraph in “Inter” font.
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                            <Button variant="contained" color="primary" sx={{ mr: 1 }}>
                                Primary Button
                            </Button>
                            <Button variant="outlined" color="secondary">
                                Secondary Button
                            </Button>
                        </Box>

                        <TextField
                            label="Sample Input"
                            variant="outlined"
                            fullWidth
                            sx={{ maxWidth: 400, mb: 4 }}
                        />

                        <Card>
                            <CardContent>
                                <Typography variant="h5">Card Title</Typography>
                                <Typography variant="body2">
                                    A simple MUI card, using your purple-space paper color.
                                </Typography>
                            </CardContent>
                        </Card>
                    </BackgroundCard>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
