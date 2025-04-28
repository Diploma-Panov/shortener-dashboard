import { useState, ChangeEvent, FC } from 'react';
import { z } from 'zod';
import { Box, Typography, TextField, Button, useTheme, Stack } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import BackgroundCard from '../components/BackgroundCard';
import { ApiClient } from '../common/api';
import { ErrorResponseElement } from '../model/common';
import { useAppToast } from '../components/toast.tsx';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email').nonempty('Email is required'),
});

type ForgotPasswordForm = {
    email: string;
};

const ForgotPasswordPage: FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [form, setForm] = useState<ForgotPasswordForm>({ email: '' });
    const [errors, setErrors] = useState<Partial<ForgotPasswordForm & { general?: string }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { success, error } = useAppToast();

    const handleChange =
        (field: keyof ForgotPasswordForm) => (e: ChangeEvent<HTMLInputElement>) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };

    const handleSubmit = async () => {
        const result = forgotPasswordSchema.safeParse(form);
        if (!result.success) {
            const fieldErrors: Partial<ForgotPasswordForm> = {};
            result.error.errors.forEach((err) => {
                const key = err.path[0] as keyof ForgotPasswordForm;
                fieldErrors[key] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await ApiClient.sendResetPassword(form.email);
            if ((response as ErrorResponseElement)?.errorType) {
                error('Failed to send reset link');
            } else {
                success(`Password reset instructions were sent to ${form.email.trim()}`);
                navigate('/login');
            }
        } catch (e) {
            console.error('Forgot password error:', e);
            error('Network error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                width: '100vw',
                height: '100vh',
                bgcolor: theme.palette.background.paper,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <BackgroundCard maxWidth={400} padding={5}>
                <Stack spacing={2}>
                    <Typography variant="h5" align="center">
                        Password Reset
                    </Typography>

                    {errors.general && (
                        <Typography color="error" variant="body2">
                            {errors.general}
                        </Typography>
                    )}

                    <TextField
                        label="Email"
                        fullWidth
                        value={form.email}
                        onChange={handleChange('email')}
                        error={!!errors.email}
                        helperText={errors.email}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 1 }}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </Button>

                    <Button
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        sx={{ mt: 1 }}
                        component={RouterLink}
                        to="/login"
                    >
                        Go Back
                    </Button>
                </Stack>
            </BackgroundCard>
        </Box>
    );
};

export default ForgotPasswordPage;
