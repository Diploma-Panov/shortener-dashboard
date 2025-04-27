import { PagedResponse } from './common.ts';

export interface CreateOrganizationDto {
    name: string;
    slug: string;
    scope: 'SHORTENER_SCOPE';
    url: string | null;
    description: string | null;
    avatarBase64: string | null;
}

export enum OrganizationType {
    PERMANENT = 'PERMANENT',
    MANUAL = 'MANUAL',
}

export interface OrganizationDto {
    id: number;
    name: string;
    slug: string;
    scope: 'SHORTENER_SCOPE';
    url: string | null;
    description: string | null;
    avatarUrl: string | null;
    type: OrganizationType;
    membersCount: number;
}

export interface OrganizationsListDto extends PagedResponse {
    entries: OrganizationDto[];
}

export interface UpdateOrganizationAvatarDto {
    newAvatarBase64: string;
}

export interface UpdateOrganizationInfoDto {
    newName?: string | null;
    newDescription?: string | null;
    newUrl?: string | null;
}
