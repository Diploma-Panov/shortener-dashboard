import config from '../config/config.ts';
import { JwtPayload, JwtUserSubject, MemberRole, OrganizationAccessEntry } from '../model/auth.ts';

function parseJwt<T>(token: string): T | null {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join(''),
        );
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

export const getAccessToken = (): JwtUserSubject | null => {
    const raw = localStorage.getItem(config.accessTokenKey);
    if (!raw) return null;

    const payload = parseJwt<JwtPayload>(raw);
    if (!payload) return null;

    if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(config.accessTokenKey);
        return null;
    }

    try {
        return JSON.parse(payload.sub) as JwtUserSubject;
    } catch {
        localStorage.removeItem(config.accessTokenKey);
        return null;
    }
};

export const getRefreshToken = (): string | null => {
    return localStorage.getItem(config.refreshTokenKey);
};

export const hasAccessToSite = (urlId: number): boolean => {
    const token: JwtUserSubject | null = getAccessToken();

    if (!token) {
        return false;
    }

    const orgs: OrganizationAccessEntry[] = token.organizations;

    const targetSlug: string | null = localStorage.getItem(config.currentOrganizationSlugKey);
    const org: OrganizationAccessEntry | undefined = orgs.find((o) => o.slug === targetSlug);

    return !!org && (org.allowedAllUrls || (org.allowedUrls && org.allowedUrls.includes(urlId)));
};

export const hasRole = (role: MemberRole): boolean => {
    const token: JwtUserSubject | null = getAccessToken();

    if (!token) {
        return false;
    }

    const orgs: OrganizationAccessEntry[] = token.organizations;

    const targetSlug: string | null = localStorage.getItem(config.currentOrganizationSlugKey);
    const org: OrganizationAccessEntry | undefined = orgs.find((o) => o.slug === targetSlug);

    return !!org && org.roles.includes(role);
};
