interface AppConfig {
    darkModeKey: string;
    apiBase: string;
    authApiBase: string;
    accessTokenKey: string;
    refreshTokenKey: string;
    currentOrganizationSlugKey: string;
}

const config: AppConfig = {
    darkModeKey: import.meta.env.VITE_DARK_MODE_KEY ?? 'darkMode',
    apiBase: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/shrt/v0',
    authApiBase: import.meta.env.VITE_AUTH_API_BASE_URL ?? 'http://localhost:8181/api/auth/v0',
    accessTokenKey: import.meta.env.VITE_ACCESS_TOKEN_KEY ?? 'accessToken',
    refreshTokenKey: import.meta.env.VITE_REFRESH_TOKEN_KEY ?? 'refreshToken',
    currentOrganizationSlugKey:
        import.meta.env.VITE_CURRENT_ORGANIZATION_SLUG_KEY ?? 'currentOrganizationSlugKey',
};

export default config;
