import { Box, Paper, useTheme } from '@mui/material';
import { FC, ReactNode } from 'react';

interface BackgroundCardProps {
    children: ReactNode;
    maxWidth?: string | number;
    padding?: number | string;
    width?: number | string;
}

const BackgroundCard: FC<BackgroundCardProps> = ({
    children,
    width = 'auto',
    maxWidth = '90vw',
    padding = 4,
}) => {
    const theme = useTheme();
    const borderColor = theme.palette.divider;

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, py: 4, width }}>
            <Paper
                elevation={0}
                sx={{
                    position: 'relative',
                    maxWidth,
                    width,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 2,
                    p: padding,
                }}
            >
                {children}
            </Paper>
        </Box>
    );
};

export default BackgroundCard;
