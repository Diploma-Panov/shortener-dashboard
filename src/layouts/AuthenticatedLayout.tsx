import Sidebar from '../components/Sidebar';
import { AppBar, Box, IconButton, Switch, Toolbar, Typography } from '@mui/material';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import { Route, Routes } from 'react-router-dom';
import UrlsPage from '../pages/UrlsPage';
import DemoPage from '../pages/DemoPage';
import { Dispatch, SetStateAction } from 'react';
import NotFoundPage from '../pages/NotFoundPage.tsx';

export interface AuthenticatedLayoutProps {
    darkMode: boolean;
    setDarkMode: Dispatch<SetStateAction<boolean>>;
}

const AuthenticatedLayout = ({ darkMode, setDarkMode }: AuthenticatedLayoutProps) => {
    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '100vh',
                bgcolor: 'transparent',
                overflow: 'hidden',
                display: 'flex',
            }}
        >
            <Sidebar />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 0,
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'transparent',
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
                        backgroundColor: 'transparent',
                    }}
                >
                    <Routes>
                        <Route path={'/urls'} element={<UrlsPage />} />
                        <Route path={'/demo'} element={<DemoPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Box>
            </Box>
        </Box>
    );
};

export default AuthenticatedLayout;
