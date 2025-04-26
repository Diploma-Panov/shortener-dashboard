interface AppConfig {
    darkModeKey: string;
    apiBase: string;
    accessTokenKey: string;
    refreshTokenKey: string;
    currentOrganizationSlugKey: string;
}

const config: AppConfig = {
    darkModeKey: import.meta.env.VITE_DARK_MODE_KEY ?? 'darkMode',
    apiBase: import.meta.env.VITE_API_BASE_URL ?? '',
    accessTokenKey: import.meta.env.VITE_ACCESS_TOKEN_KEY ?? '',
    refreshTokenKey: import.meta.env.VITE_REFRESH_TOKEN_KEY ?? '',
    currentOrganizationSlugKey: import.meta.env.VITE_CURRENT_ORGANIZATION_SLUG_KEY ?? '',
};

export default config;
