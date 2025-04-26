import { useState, ChangeEvent, FC } from 'react';
import { z } from 'zod';
import {
    Box,
    Typography,
    TextField,
    Button,
    useTheme,
    useMediaQuery,
    Stack,
    Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import BackgroundCard from '../components/BackgroundCard';
import moon from '../images/moon.png';
import sun from '../images/sun.png';
import config from '../config/config';
import { AbstractResponseDto } from '../model/common.ts';
import { TokenResponseDto } from '../model/auth.ts';

type LoginForm = {
    username: string;
    password: string;
};
const loginSchema = z.object({
    username: z.string().nonempty('Username is required'),
    password: z.string().nonempty('Password is required'),
});

export interface LoginPageProps {
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
}

const LoginPage: FC<LoginPageProps> = ({ darkMode, setDarkMode }) => {
    const theme = useTheme();
    const isXsOrSmDown = useMediaQuery(theme.breakpoints.down('sm'));

    const [form, setForm] = useState<LoginForm>({ username: '', password: '' });
    const [errors, setErrors] = useState<Partial<LoginForm & { general?: string }>>({});

    const handleChange = (field: keyof LoginForm) => (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleLogin = async () => {
        const result = loginSchema.safeParse(form);
        if (!result.success) {
            const fieldErrors: Partial<LoginForm> = {};
            result.error.errors.forEach((err) => {
                const key = err.path[0] as keyof LoginForm;
                fieldErrors[key] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        try {
            const response = await fetch(`${config.apiBase}/public/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!response.ok) {
                const errorData = await response.json();
                setErrors({ general: errorData.message || 'Login failed' });
                return;
            }
            const data: AbstractResponseDto<TokenResponseDto> =
                (await response.json()) as AbstractResponseDto<TokenResponseDto>;
            localStorage.setItem(config.accessTokenKey, data.payload.accessToken);
            if (data.payload.refreshToken) {
                localStorage.setItem(config.refreshTokenKey, data.payload.refreshToken);
            }
            window.location.href = '/urls';
        } catch (e) {
            console.error('Login error:', e);
            setErrors({ general: 'Network error' });
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                width: '100vw',
                height: '100vh',
                bgcolor: theme.palette.background.paper,
            }}
        >
            <Box
                sx={{
                    width: { xs: '100%', md: '50%' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: theme.palette.background.paper,
                }}
            >
                <BackgroundCard maxWidth={400} padding={5}>
                    <Stack spacing={3} sx={{ minHeight: 300 }}>
                        <Typography variant="h4" align="center">
                            Sign In
                        </Typography>

                        {errors.general && (
                            <Typography color="error" variant="body2">
                                {errors.general}
                            </Typography>
                        )}

                        <TextField
                            label="Username"
                            fullWidth
                            value={form.username}
                            onChange={handleChange('username')}
                            error={!!errors.username}
                            helperText={errors.username}
                        />

                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            value={form.password}
                            onChange={handleChange('password')}
                            error={!!errors.password}
                            helperText={errors.password}
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 1 }}
                            onClick={handleLogin}
                        >
                            Log In
                        </Button>

                        <Typography variant="body2" textAlign="center">
                            Don’t have an account?{' '}
                            <Link component={RouterLink} to="/signup" underline="hover">
                                Sign up
                            </Link>
                        </Typography>
                    </Stack>
                </BackgroundCard>
            </Box>

            {!isXsOrSmDown && (
                <Box
                    sx={{
                        width: '50%',
                        bgcolor: theme.palette.background.paper,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Box
                        component="img"
                        src={darkMode ? moon : sun}
                        alt={darkMode ? 'Moon' : 'Sun'}
                        sx={{
                            width: '80%',
                            height: 'auto',
                            borderRadius: '50%',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            maskImage: `
                                radial-gradient(
                                  circle at center,
                                  rgba(0,0,0,1) 60%,
                                  rgba(0,0,0,0) 100%
                                )
                              `,
                            WebkitMaskImage: `
                                radial-gradient(
                                  circle at center,
                                  rgba(0,0,0,1) 60%,
                                  rgba(0,0,0,0) 100%
                                )
                              `,
                            maskSize: '100% 100%',
                            WebkitMaskSize: '100% 100%',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                        }}
                        onClick={() => setDarkMode(!darkMode)}
                    />
                </Box>
            )}
        </Box>
    );
};

export default LoginPage;
