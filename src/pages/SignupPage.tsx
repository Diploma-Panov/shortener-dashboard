import { ChangeEvent, FC, useState } from 'react';
import { z } from 'zod';
import {
    Box,
    Button,
    CircularProgress,
    Link,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import BackgroundCard from '../components/BackgroundCard';
import moon from '../images/moon.png';
import sun from '../images/sun.png';
import config from '../config/config';
import { ErrorResponseElement, ServiceErrorType } from '../model/common';
import { TokenResponseDto } from '../model/auth';
import { ApiClient } from '../common/api.ts';
import * as _ from 'lodash';
import { useAppToast } from '../components/toast.tsx';

interface SignupPageProps {
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
}

const signupSchema = z.object({
    username: z.string().email('Invalid email').max(255),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(64, 'Password must be at most 64 characters')
        .regex(/\d/, { message: 'Password must contain at least one digit' })
        .regex(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/, {
            message: 'Password must contain at least one special character',
        })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .refine((val) => !/\s/.test(val), { message: 'Password must not contain whitespace' }),
    firstName: z.string().nonempty('First name is required').max(255),
    lastName: z.string().max(255).nullable(),
    companyName: z.string().max(255).nullable(),
    profilePictureBase64: z.string().base64({ message: 'Invalid base64 image' }).nullable(),
    registrationScope: z.literal('SHORTENER_SCOPE'),
    siteUrl: z.string().url('Invalid URL').nullable(),
});

type SignupForm = z.infer<typeof signupSchema>;

const SignupPage: FC<SignupPageProps> = ({ darkMode, setDarkMode }) => {
    const theme = useTheme();
    const isXsDown = useMediaQuery(theme.breakpoints.down('sm'));

    const [form, setForm] = useState<SignupForm>({
        username: '',
        password: '',
        firstName: '',
        lastName: null,
        companyName: null,
        profilePictureBase64: null,
        registrationScope: 'SHORTENER_SCOPE',
        siteUrl: null,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof SignupForm | 'general', string>>>({});
    const [loading, setLoading] = useState(false);

    const { success, error } = useAppToast();

    const handleChange = (field: keyof SignupForm) => (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSignup = async () => {
        const parse = signupSchema.safeParse(form);
        if (!parse.success) {
            const fieldErrors: Partial<typeof errors> = {};
            parse.error.errors.forEach((err) => {
                const key = err.path[0] as keyof SignupForm;
                fieldErrors[key] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setLoading(true);
        try {
            const tokensResponse: TokenResponseDto | ErrorResponseElement = await ApiClient.signup(
                parse.data,
            );

            if (_.has(tokensResponse, 'errorType')) {
                if (tokensResponse.errorType === ServiceErrorType.ENTITY_ALREADY_EXISTS) {
                    error('User with this email already exists');
                } else {
                    error('Signup failed');
                }
                setLoading(false);
                return;
            }

            const { accessToken, refreshToken } = tokensResponse as TokenResponseDto;
            localStorage.setItem(config.accessTokenKey, accessToken);
            localStorage.setItem(config.refreshTokenKey, refreshToken!);

            window.location.href = '/urls';
            success('Registration is successful');
        } catch (e) {
            error('Network error');
        } finally {
            setLoading(false);
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
                <BackgroundCard maxWidth={500} padding={5}>
                    <Stack spacing={2} sx={{ minHeight: 500 }}>
                        <Typography variant="h4" align="center">
                            Sign Up
                        </Typography>

                        {errors.general && (
                            <Typography color="error" variant="body2">
                                {errors.general}
                            </Typography>
                        )}

                        <TextField
                            label="Email"
                            type="email"
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

                        <TextField
                            label="First Name"
                            fullWidth
                            value={form.firstName}
                            onChange={handleChange('firstName')}
                            error={!!errors.firstName}
                            helperText={errors.firstName}
                        />

                        <TextField
                            label="Last Name (Optional)"
                            fullWidth
                            value={form.lastName || ''}
                            onChange={handleChange('lastName')}
                            error={!!errors.lastName}
                            helperText={errors.lastName}
                        />

                        <TextField
                            label="Company Name (Optional)"
                            fullWidth
                            value={form.companyName || ''}
                            onChange={handleChange('companyName')}
                            error={!!errors.companyName}
                            helperText={errors.companyName}
                        />

                        <TextField
                            label="Site URL (Optional)"
                            fullWidth
                            value={form.siteUrl || ''}
                            onChange={handleChange('siteUrl')}
                            error={!!errors.siteUrl}
                            helperText={errors.siteUrl}
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading}
                            onClick={handleSignup}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
                        </Button>

                        <Typography variant="body2" textAlign="center">
                            Already have an account?{' '}
                            <Link component={RouterLink} to="/login" underline="hover">
                                Log in
                            </Link>
                        </Typography>
                    </Stack>
                </BackgroundCard>
            </Box>

            {!isXsDown && (
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

export default SignupPage;
