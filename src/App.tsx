import { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';

import config from './config/config';
import { darkTheme, lightTheme } from './common/theme';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';
import CanvasStarfield from './components/CanvasStarfield';
import LoginPage from './pages/LoginPage';
import { getAccessToken, getRefreshToken } from './auth/auth';
import SignupPage from './pages/SignupPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import PasswordRecoveryPage from './pages/PasswordRecoveryPage.tsx';
import { AppToastContainer } from './components/toast.tsx';

export default function App() {
    const [darkMode, setDarkMode] = useState(
        !localStorage.getItem(config.darkModeKey) ||
            localStorage.getItem(config.darkModeKey) === 'true',
    );
    const isAuthenticated = getAccessToken() !== null || getRefreshToken();

    useEffect(() => {
        localStorage.setItem(config.darkModeKey, darkMode ? 'true' : 'false');
    }, [darkMode]);

    return (
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <CssBaseline />

            <CanvasStarfield
                countFar={4000}
                countNear={8000}
                parallaxFar={2}
                parallaxNear={4}
                dark={darkMode}
            />

            <Routes>
                {!isAuthenticated && (
                    <>
                        <Route
                            path="/login"
                            element={<LoginPage darkMode={darkMode} setDarkMode={setDarkMode} />}
                        />
                        <Route
                            path="/signup"
                            element={<SignupPage darkMode={darkMode} setDarkMode={setDarkMode} />}
                        />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route
                            path="/password-reset/:recoveryCode"
                            element={<PasswordRecoveryPage />}
                        />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </>
                )}

                {isAuthenticated && (
                    <>
                        <Route
                            path="/*"
                            element={
                                <AuthenticatedLayout
                                    darkMode={darkMode}
                                    setDarkMode={setDarkMode}
                                />
                            }
                        />
                    </>
                )}
            </Routes>
            <AppToastContainer />
        </ThemeProvider>
    );
}
