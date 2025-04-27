import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config/config';
import {
    AbstractResponseDto,
    ErrorResponseDto,
    ErrorResponseElement,
    MessageResponseDto,
    ServiceErrorType,
} from '../model/common.ts';
import { TokenResponseDto } from '../model/auth.ts';
import {
    UpdateUserInfoDto,
    UpdateUserProfilePictureDto,
    UserInfoDto,
    UserLoginDto,
    UserSignupDto,
} from '../model/users.ts';
import {
    InviteMemberDto,
    OrganizationMembersListDto,
    UpdateMemberRolesDto,
    UpdateMemberUrlsDto,
} from '../model/organizationMembers.ts';
import {
    CreateOrganizationDto,
    OrganizationDto,
    OrganizationsListDto,
    UpdateOrganizationAvatarDto,
    UpdateOrganizationInfoDto,
} from '../model/organizations.ts';
import {
    ChangeUrlStateDto,
    CreateShortUrlDto,
    ShortUrlDto,
    ShortUrlsListDto,
    ShortUrlsSearchParams,
} from '../model/urls.ts';
import { GlobalStatisticsDto, PeriodCountsDto } from '../model/statistics.ts';

const API_BASE = config.apiBase;
const API_PUBLIC = '/public/users';
const API_USER = '/user';

export class ApiClient {
    private static async apiRequest<T>(
        cfg: AxiosRequestConfig & { _retry?: boolean } = {},
    ): Promise<T | ErrorResponseElement> {
        cfg.baseURL = cfg.baseURL || API_BASE;

        if (cfg.params) {
            cfg.paramsSerializer = {
                serialize: (params) => {
                    const parts: string[] = [];
                    Object.entries(params).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            parts.push(
                                `${encodeURIComponent(key)}=${encodeURIComponent(value.join(','))}`,
                            );
                        } else if (value !== undefined && value !== null) {
                            parts.push(
                                `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
                            );
                        }
                    });
                    return parts.join('&');
                },
            };
        }

        const token = localStorage.getItem(config.accessTokenKey);
        if (token) {
            cfg.headers = { ...(cfg.headers || {}), Authorization: token };
        }

        const handleErrorResponse = (data: any): ErrorResponseElement => {
            if (data?.errors?.length) {
                return data.errors[0] as ErrorResponseElement;
            }
            return {
                errorType: ServiceErrorType.INTERNAL_ERROR,
                errorClass: 'UnknownError',
                errorMessage: data?.message ?? 'An unknown error occurred',
            };
        };

        try {
            const resp = await axios.request<AbstractResponseDto<T> | ErrorResponseDto>(cfg);

            if ((resp.data as ErrorResponseDto).errors) {
                return handleErrorResponse(resp.data);
            }

            return (resp.data as AbstractResponseDto<T>).payload;
        } catch (err: any) {
            const status = err.response?.status;
            const data = err.response?.data;

            if (status === 401 && !cfg._retry) {
                const didRefresh = await this.refreshTokens();
                if (didRefresh) {
                    cfg._retry = true;
                    const newToken = localStorage.getItem(config.accessTokenKey)!;
                    cfg.headers = { ...(cfg.headers || {}), Authorization: newToken };
                    try {
                        const retryResp = await axios.request<
                            AbstractResponseDto<T> | ErrorResponseDto
                        >(cfg);
                        if ((retryResp.data as ErrorResponseDto).errors) {
                            return handleErrorResponse(retryResp.data);
                        }
                        return (retryResp.data as AbstractResponseDto<T>).payload;
                    } catch (retryErr: any) {
                        return handleErrorResponse(retryErr.response?.data);
                    }
                }
            }

            return handleErrorResponse(data);
        }
    }

    private static async refreshTokens(): Promise<boolean> {
        const refresh = localStorage.getItem(config.refreshTokenKey);
        if (!refresh) return false;
        try {
            const resp: AxiosResponse<AbstractResponseDto<TokenResponseDto>> = await axios.get(
                `${API_BASE}${API_PUBLIC}/refresh-token`,
                {
                    headers: { Authorization: refresh },
                },
            );
            const { accessToken, refreshToken } = resp.data.payload;
            localStorage.setItem(config.accessTokenKey, accessToken);
            if (refreshToken) localStorage.setItem(config.refreshTokenKey, refreshToken);
            return true;
        } catch {
            return false;
        }
    }

    static signup(dto: UserSignupDto): Promise<TokenResponseDto | ErrorResponseElement> {
        return this.apiRequest<TokenResponseDto>({
            method: 'POST',
            url: `${API_PUBLIC}/signup`,
            data: dto,
            _retry: true,
        });
    }

    static login(dto: UserLoginDto): Promise<TokenResponseDto | ErrorResponseElement> {
        return this.apiRequest<TokenResponseDto>({
            method: 'POST',
            url: `${API_PUBLIC}/login`,
            data: dto,
        });
    }

    static exchangeShortCode(shortCode: string): Promise<TokenResponseDto | ErrorResponseElement> {
        return this.apiRequest<TokenResponseDto>({
            method: 'GET',
            url: `${API_PUBLIC}/exchange-short-code/${shortCode}`,
        });
    }

    static refreshToken(): Promise<TokenResponseDto | ErrorResponseElement> {
        return this.apiRequest<TokenResponseDto>({
            method: 'GET',
            url: `${API_PUBLIC}/refresh-token`,
            _retry: true,
        });
    }

    static getOrganizationMembers(
        slug: string,
        query?: Record<string, any>,
    ): Promise<OrganizationMembersListDto | ErrorResponseElement> {
        return this.apiRequest<OrganizationMembersListDto>({
            method: 'GET',
            url: `${API_USER}/organizations/${slug}/members`,
            params: query,
        });
    }

    static inviteMember(
        slug: string,
        dto: InviteMemberDto,
    ): Promise<MessageResponseDto | ErrorResponseElement> {
        return this.apiRequest<MessageResponseDto>({
            method: 'POST',
            url: `${API_USER}/organizations/${slug}/members`,
            data: dto,
        });
    }

    static updateMemberRoles(
        slug: string,
        memberId: number,
        dto: UpdateMemberRolesDto,
    ): Promise<MessageResponseDto | ErrorResponseElement> {
        return this.apiRequest<MessageResponseDto>({
            method: 'PUT',
            url: `${API_USER}/organizations/${slug}/members/${memberId}/roles`,
            data: dto,
        });
    }

    static updateMemberUrls(
        slug: string,
        memberId: number,
        dto: UpdateMemberUrlsDto,
    ): Promise<MessageResponseDto | ErrorResponseElement> {
        return this.apiRequest<MessageResponseDto>({
            method: 'PUT',
            url: `${API_USER}/organizations/${slug}/members/${memberId}/urls`,
            data: dto,
        });
    }

    static deleteMember(
        slug: string,
        memberId: number,
    ): Promise<MessageResponseDto | ErrorResponseElement> {
        return this.apiRequest<MessageResponseDto>({
            method: 'DELETE',
            url: `${API_USER}/organizations/${slug}/members/${memberId}`,
        });
    }

    static getUserOrganizations(
        params?: Record<string, any>,
    ): Promise<OrganizationsListDto | ErrorResponseElement> {
        return this.apiRequest<OrganizationsListDto>({
            method: 'GET',
            url: `${API_USER}/organizations`,
            params,
        });
    }

    static getOrganizationBySlug(slug: string): Promise<OrganizationDto | ErrorResponseElement> {
        return this.apiRequest<OrganizationDto>({
            method: 'GET',
            url: `${API_USER}/organizations/${slug}`,
        });
    }

    static createOrganization(
        dto: CreateOrganizationDto,
    ): Promise<TokenResponseDto | ErrorResponseElement> {
        return this.apiRequest<TokenResponseDto>({
            method: 'POST',
            url: `${API_USER}/organizations`,
            data: dto,
        });
    }

    static updateOrganizationInfo(
        slug: string,
        dto: UpdateOrganizationInfoDto,
    ): Promise<OrganizationDto | ErrorResponseElement> {
        return this.apiRequest<OrganizationDto>({
            method: 'PATCH',
            url: `${API_USER}/organizations/${slug}`,
            data: dto,
        });
    }

    static updateOrganizationAvatar(
        slug: string,
        dto: UpdateOrganizationAvatarDto,
    ): Promise<OrganizationDto | ErrorResponseElement> {
        return this.apiRequest<OrganizationDto>({
            method: 'PUT',
            url: `${API_USER}/organizations/${slug}/avatar`,
            data: dto,
        });
    }

    static deleteOrganizationAvatar(slug: string): Promise<OrganizationDto | ErrorResponseElement> {
        return this.apiRequest<OrganizationDto>({
            method: 'DELETE',
            url: `${API_USER}/organizations/${slug}/avatar`,
        });
    }

    static deleteOrganization(slug: string): Promise<TokenResponseDto | ErrorResponseElement> {
        return this.apiRequest<TokenResponseDto>({
            method: 'DELETE',
            url: `${API_USER}/organizations/${slug}`,
        });
    }

    static getTags(slug: string): Promise<string[] | ErrorResponseElement> {
        return this.apiRequest<string[]>({
            method: 'GET',
            url: `${API_USER}/organizations/${slug}/urls/tags`,
        });
    }

    static getShortUrls(
        slug: string,
        params?: ShortUrlsSearchParams,
    ): Promise<ShortUrlsListDto | ErrorResponseElement> {
        return this.apiRequest<ShortUrlsListDto>({
            method: 'GET',
            url: `${API_USER}/organizations/${slug}/urls`,
            params,
        });
    }

    static getShortUrl(slug: string, urlId: number): Promise<ShortUrlDto | ErrorResponseElement> {
        return this.apiRequest<ShortUrlDto>({
            method: 'GET',
            url: `${API_USER}/organizations/${slug}/urls/${urlId}`,
        });
    }

    static createShortUrl(
        slug: string,
        dto: CreateShortUrlDto,
    ): Promise<TokenResponseDto | ErrorResponseElement> {
        return this.apiRequest<TokenResponseDto>({
            method: 'POST',
            url: `${API_USER}/organizations/${slug}/urls`,
            data: dto,
        });
    }

    static updateShortUrlState(
        slug: string,
        urlId: number,
        dto: ChangeUrlStateDto,
    ): Promise<ShortUrlDto | ErrorResponseElement> {
        return this.apiRequest<ShortUrlDto>({
            method: 'PUT',
            url: `${API_USER}/organizations/${slug}/urls/${urlId}`,
            data: dto,
        });
    }

    static getGlobalStats(
        slug: string,
        urlId: number,
    ): Promise<GlobalStatisticsDto | ErrorResponseElement> {
        return this.apiRequest<GlobalStatisticsDto>({
            method: 'GET',
            url: `${API_USER}/organizations/${slug}/urls/${urlId}/stats/global`,
        });
    }

    static getTimeRangeStats(
        slug: string,
        urlId: number,
        start: string,
        end: string,
        period: number,
    ): Promise<PeriodCountsDto | ErrorResponseElement> {
        return this.apiRequest<PeriodCountsDto>({
            method: 'GET',
            url: `${API_USER}/organizations/${slug}/urls/${urlId}/stats/time-range`,
            params: { start, end, period },
        });
    }

    static getUserInfo(): Promise<UserInfoDto | ErrorResponseElement> {
        return this.apiRequest<UserInfoDto>({
            method: 'GET',
            url: `${API_USER}/users/info`,
        });
    }

    static updateUserInfo(dto: UpdateUserInfoDto): Promise<UserInfoDto | ErrorResponseElement> {
        return this.apiRequest<UserInfoDto>({
            method: 'PATCH',
            url: `${API_USER}/users/info`,
            data: dto,
        });
    }

    static updateProfilePicture(
        dto: UpdateUserProfilePictureDto,
    ): Promise<UserInfoDto | ErrorResponseElement> {
        return this.apiRequest<UserInfoDto>({
            method: 'PUT',
            url: `${API_USER}/users/picture`,
            data: dto,
        });
    }

    static deleteProfilePicture(): Promise<UserInfoDto | ErrorResponseElement> {
        return this.apiRequest<UserInfoDto>({
            method: 'DELETE',
            url: `${API_USER}/users/picture`,
        });
    }
}
