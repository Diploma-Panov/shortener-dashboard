import { useState } from 'react';
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
    Container,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { lightTheme, darkTheme } from './common/theme';
import CanvasStarfield from './components/CanvasStarfield';

export default function App() {
    const [darkMode, setDarkMode] = useState(false);
    const theme = darkMode ? darkTheme : lightTheme;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            <Box
                sx={{
                    position: 'relative',
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    overflow: 'hidden',
                }}
            >
                {darkMode && (
                    <CanvasStarfield
                        countFar={1000}
                        countNear={2000}
                        parallaxFar={2}
                        parallaxNear={4}
                    />
                )}

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <AppBar position="static" color="primary" elevation={0}>
                        <Toolbar>
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                Purple Space UI
                            </Typography>
                            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                            <Switch
                                checked={darkMode}
                                onChange={() => setDarkMode(!darkMode)}
                                color="secondary"
                            />
                        </Toolbar>
                    </AppBar>

                    <Container sx={{ py: 4 }}>
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
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
