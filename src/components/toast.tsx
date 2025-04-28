import { toast, ToastContainer, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '@mui/material/styles';

export const useAppToast = () => {
    const theme = useTheme();

    const baseOptions: ToastOptions = {
        position: 'top-center',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
    };

    const success = (message: string) => {
        toast.success(message, {
            ...baseOptions,
            style: {
                background: theme.palette.mode === 'dark' ? '#1B5E20' : '#43A047', // Dark green / Medium green
                color: '#FFFFFF',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
            },
        });
    };

    const error = (message: string) => {
        toast.error(message, {
            ...baseOptions,
            style: {
                background: theme.palette.mode === 'dark' ? '#B71C1C' : '#E53935', // Dark red / Medium red
                color: '#FFFFFF',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
            },
        });
    };

    return { success, error };
};

export const AppToastContainer = ToastContainer;
