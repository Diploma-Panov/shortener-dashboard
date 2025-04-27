import { MemberRole } from './auth.ts';
import { PagedResponse } from './common.ts';

export interface InviteMemberDto {
    firstname: string;
    lastname: string;
    email: string;
    allowedAllUrls: boolean;
    allowedUrls: number[];
    roles: MemberRole[];
}

export interface OrganizationMemberDto {
    id: number;
    organizationId: number;
    fullName: string;
    email: string;
    roles: MemberRole[];
    allowedUrls: number[];
    allowedAllUrls: boolean;
    pictureUrl?: string | null;
}

export interface OrganizationMembersListDto extends PagedResponse {
    entries: OrganizationMemberDto[];
}

export interface UpdateMemberRolesDto {
    newRoles: MemberRole[];
}

export interface UpdateMemberUrlsDto {
    newUrlsIds: number[];
    allowedAllUrls: boolean;
}
