import {
    Box,
    Button,
    Container,
    Stack,
    TextField,
    Typography,
    Switch,
    FormControlLabel,
    Link,
    useTheme,
} from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClient } from '../common/api';
import BackgroundCard from '../components/BackgroundCard.tsx';
import { ShortUrlDto } from '../model/urls.ts';
import { useAppToast } from '../components/toast.tsx';
import { ErrorResponseElement } from '../model/common.ts';
import * as _ from 'lodash';

export interface LandingPageProps {
    darkMode: boolean;
    setDarkMode: Dispatch<SetStateAction<boolean>>;
}

const LandingPage = ({ darkMode, setDarkMode }: LandingPageProps) => {
    const navigate = useNavigate();
    const theme = useTheme();

    const [originalUrl, setOriginalUrl] = useState('');
    const [shortenedUrl, setShortenedUrl] = useState('');

    const { error } = useAppToast();

    const handleShorten = async () => {
        if (!originalUrl.trim()) return;
        const shortUrl: ShortUrlDto | ErrorResponseElement =
            await ApiClient.createTrialShortUrl(originalUrl);

        if (_.has(shortUrl, 'errorType')) {
            error('Could not create trial short URL. Try again later');
            return;
        }
        setShortenedUrl((shortUrl as ShortUrlDto).shortUrl);
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                }}
            >
                <FormControlLabel
                    control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
                    label={darkMode ? 'Dark Mode' : 'Light Mode'}
                />
                <Button variant="contained" color="primary" onClick={() => navigate('/login')}>
                    Sign In
                </Button>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 8 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" fontWeight="bold">
                        Welcome to the Future of URL Shortening
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 2, color: 'text.secondary' }}>
                        Simple. Fast. Reliable.
                    </Typography>
                </Box>
            </Container>

            <Container maxWidth="md" sx={{ textAlign: 'center', mt: 4 }}>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
                    <TextField
                        variant="outlined"
                        placeholder="Paste your URL here..."
                        fullWidth
                        value={originalUrl}
                        sx={{ backgroundColor: theme.palette.background.paper }}
                        onChange={(e) => setOriginalUrl(e.target.value)}
                    />
                    <Button variant="contained" color="primary" onClick={handleShorten}>
                        Shorten
                    </Button>
                </Stack>

                <Typography variant="h6" sx={{ height: 50, mb: 10 }}>
                    {shortenedUrl && (
                        <BackgroundCard padding={2}>
                            Shortened URL:{' '}
                            <Link href={shortenedUrl} target="_blank" rel="noopener">
                                {shortenedUrl}
                            </Link>
                        </BackgroundCard>
                    )}
                </Typography>
            </Container>

            <Container maxWidth="lg" sx={{ mt: 8 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
                    <Box
                        component="img"
                        src="https://cdn.pixabay.com/photo/2022/09/25/23/28/android-7479380_1280.png"
                        alt="Technology"
                        sx={{ width: '100%', maxWidth: 400, borderRadius: 2 }}
                    />
                    <BackgroundCard>
                        <Typography variant="h5" color="text.secondary">
                            Our platform ensures ultra-fast and secure URL shortening. Perfect for
                            businesses and individuals.
                        </Typography>
                    </BackgroundCard>
                </Stack>

                <Stack
                    direction={{ xs: 'column-reverse', md: 'row' }}
                    spacing={4}
                    alignItems="center"
                >
                    <BackgroundCard>
                        <Typography variant="h5" color="text.secondary">
                            No ads, no clutter. Just clean, efficient redirections. Enjoy the
                            experience.
                        </Typography>
                    </BackgroundCard>
                    <Box
                        component="img"
                        src="https://cdn.pixabay.com/photo/2022/07/12/09/51/fingerprint-7316929_1280.png"
                        alt="Security"
                        sx={{ width: '100%', maxWidth: 400, borderRadius: 2 }}
                    />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
                    <Box
                        component="img"
                        src="https://cdn.pixabay.com/photo/2023/12/15/11/13/programming-8450423_1280.png"
                        alt="Developer"
                        sx={{ width: '100%', maxWidth: 400, borderRadius: 2 }}
                    />
                    <BackgroundCard>
                        <Typography variant="h5" color="text.secondary">
                            Created by Maksym Panov, a student @ Simon Kuznets&apos; Kharkiv
                            National University of Economics.
                        </Typography>
                    </BackgroundCard>
                </Stack>
            </Container>

            <Box
                sx={{
                    textAlign: 'center',
                    p: 4,
                    mt: 8,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    &copy; {new Date().getFullYear()} Maksym Panov. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default LandingPage;
