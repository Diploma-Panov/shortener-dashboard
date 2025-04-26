import { Box, Typography, Button, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { FC } from 'react';

const NotFoundPage: FC = () => {
    const theme = useTheme();
    const toolbarHeight = theme.mixins.toolbar.minHeight;

    return (
        <Box
            sx={{
                position: 'absolute',
                top: `${toolbarHeight}px`,
                left: 0,
                right: 0,
                bottom: 0,
                boxSizing: 'border-box',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                overflow: 'hidden',
            }}
        >
            <Typography variant="h3" gutterBottom>
                404 — Page Not Found
            </Typography>
            <Typography variant="body1" gutterBottom>
                Oops! We can’t find the page you’re looking for.
            </Typography>
            <Button component={RouterLink} to="/urls" variant="contained" sx={{ mt: 2 }}>
                Go Home
            </Button>
        </Box>
    );
};

export default NotFoundPage;
