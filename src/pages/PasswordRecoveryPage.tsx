import { useState, ChangeEvent, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Box, Typography, TextField, Button, Stack } from '@mui/material';

import BackgroundCard from '../components/BackgroundCard';
import { ApiClient } from '../common/api';
import { ErrorResponseElement } from '../model/common';
import { useAppToast } from '../components/toast.tsx';

type PasswordForm = {
    password: string;
    confirmPassword: string;
};

const passwordSchema = z
    .object({
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
        confirmPassword: z.string().nonempty('Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

const PasswordRecoveryPage: FC = () => {
    const { recoveryCode } = useParams<{ recoveryCode: string }>();
    const navigate = useNavigate();

    const [form, setForm] = useState<PasswordForm>({ password: '', confirmPassword: '' });
    const [errors, setErrors] = useState<Partial<PasswordForm & { general?: string }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { success, error } = useAppToast();

    const handleChange = (field: keyof PasswordForm) => (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async () => {
        const result = passwordSchema.safeParse(form);
        if (!result.success) {
            const fieldErrors: Partial<PasswordForm> = {};
            result.error.errors.forEach((err) => {
                const key = err.path[0] as keyof PasswordForm;
                fieldErrors[key] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        try {
            setIsSubmitting(true);
            if (recoveryCode) {
                const response = await ApiClient.resetPasswordByCode(recoveryCode, form.password);
                if ((response as ErrorResponseElement)?.errorType) {
                    error('Password reset failed');
                } else {
                    success('Password reset was successful');
                    navigate('/login');
                }
            } else {
                error('Invalid recovery code');
            }
        } catch (e) {
            console.error('Password recovery error:', e);
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
                bgcolor: '#050014',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Poppins', sans-serif",
                color: '#FFFFFF',
            }}
        >
            <BackgroundCard maxWidth={400} padding={5}>
                <Stack spacing={3}>
                    <Typography
                        variant="h4"
                        align="center"
                        sx={{
                            fontFamily: "'Orbitron', sans-serif",
                            color: '#FFFFFF',
                        }}
                    >
                        Reset Password
                    </Typography>

                    {errors.general && (
                        <Typography color="error" variant="body2" textAlign="center">
                            {errors.general}
                        </Typography>
                    )}

                    <TextField
                        label="New Password"
                        type="password"
                        fullWidth
                        value={form.password}
                        onChange={handleChange('password')}
                        error={!!errors.password}
                        helperText={errors.password}
                        sx={{
                            input: { color: '#FFFFFF' },
                            label: { color: '#888' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: 'rgba(191,0,255,0.4)' },
                                '&:hover fieldset': { borderColor: '#BF00FF' },
                                '&.Mui-focused fieldset': { borderColor: '#BF00FF' },
                            },
                        }}
                    />

                    <TextField
                        label="Confirm Password"
                        type="password"
                        fullWidth
                        value={form.confirmPassword}
                        onChange={handleChange('confirmPassword')}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        sx={{
                            input: { color: '#FFFFFF' },
                            label: { color: '#888' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: 'rgba(191,0,255,0.4)' },
                                '&:hover fieldset': { borderColor: '#BF00FF' },
                                '&.Mui-focused fieldset': { borderColor: '#BF00FF' },
                            },
                        }}
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        sx={{
                            backgroundColor: '#BF00FF',
                            color: '#FFFFFF',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            '&:hover': {
                                backgroundColor: '#a000cc',
                            },
                        }}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </Button>

                    <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                            borderColor: 'rgba(191,0,255,0.4)',
                            color: '#BF00FF',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            mt: 1,
                            '&:hover': {
                                borderColor: '#BF00FF',
                                backgroundColor: 'rgba(191, 0, 255, 0.1)',
                            },
                        }}
                        onClick={() => navigate('/login')}
                    >
                        Back
                    </Button>
                </Stack>
            </BackgroundCard>
        </Box>
    );
};

export default PasswordRecoveryPage;
