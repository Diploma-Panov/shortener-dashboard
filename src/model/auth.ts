export interface TokenResponseDto {
    accessToken: string;
    refreshToken?: string | null;
}

export enum MemberRole {
    ORGANIZATION_OWNER = 'ORGANIZATION_OWNER',
    ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
    ORGANIZATION_MEMBERS_MANAGER = 'ORGANIZATION_MEMBERS_MANAGER',
    ORGANIZATION_MANAGER = 'ORGANIZATION_MANAGER',
    ORGANIZATION_MEMBER = 'ORGANIZATION_MEMBER',
    ORGANIZATION_URLS_MANAGER = 'ORGANIZATION_URLS_MANAGER',
}

export enum UserSystemRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export interface OrganizationAccessEntry {
    organizationId: number;
    slug: string;
    allowedUrls: number[];
    allowedAllUrls: boolean;
    roles: MemberRole[];
}

export interface JwtUserSubject {
    userId: number;
    username: string;
    userSystemRole: UserSystemRole;
    firstname: string;
    lastname: string;
    organizations: OrganizationAccessEntry[];
}

export interface JwtPayload {
    exp: number;
    iat: number;
    sub: string;
}
