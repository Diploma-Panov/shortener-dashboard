interface AppConfig {
    darkModeKey: string;
    apiBase: string;
}

const config: AppConfig = {
    darkModeKey: import.meta.env.VITE_DARK_MODE_KEY ?? 'darkMode',
    apiBase: import.meta.env.VITE_API_BASE_URL ?? '',
};

export default config;
