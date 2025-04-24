interface AppConfig {
    darkModeKey: string;
}

const config: AppConfig = {
    darkModeKey: import.meta.env.VITE_DARK_MODE_KEY ?? 'darkMode',
};

export default config;
