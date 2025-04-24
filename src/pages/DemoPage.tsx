import { Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import BackgroundCard from '../components/BackgroundCard.tsx';

const DemoPage = () => {
    return (
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
    );
};

export default DemoPage;
