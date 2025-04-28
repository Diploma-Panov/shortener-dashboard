import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config/config';
import {
    AbstractResponseDto,
    ErrorResponseDto,
    ErrorResponseElement,
    MessageResponseDto,
    ServiceErrorType,
} from '../model/common.ts';
import { JwtUserSubject, TokenResponseDto } from '../model/auth.ts';
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
import { getAccessToken } from '../auth/auth.ts';

const API_BASE = config.apiBase;
const API_PUBLIC = '/public';
const API_USER = '/user';

export class ApiClient {
    private static refreshTokenPromise: Promise<string> | null = null;

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
                if (!this.refreshTokenPromise) {
                    this.refreshTokenPromise = this.refreshTokens()
                        .then((success) => {
                            this.refreshTokenPromise = null;
                            if (!success) throw new Error('refresh failed');
                            return localStorage.getItem(config.accessTokenKey)!;
                        })
                        .catch(() => {
                            this.refreshTokenPromise = null;
                            throw new Error('refresh failed');
                        });
                }

                try {
                    const newToken = await this.refreshTokenPromise;
                    cfg._retry = true;
                    cfg.headers = { ...(cfg.headers || {}), Authorization: newToken };
                    const retryResp = await axios.request<
                        AbstractResponseDto<T> | ErrorResponseDto
                    >(cfg);
                    if ((retryResp.data as ErrorResponseDto).errors) {
                        return handleErrorResponse(retryResp.data);
                    }
                    return (retryResp.data as AbstractResponseDto<T>).payload;
                } catch {
                    return handleErrorResponse(data);
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
                `${API_BASE}${API_PUBLIC}/users/refresh-token`,
                {
                    headers: { Authorization: refresh },
                },
            );
            const { accessToken, refreshToken } = resp.data.payload;
            localStorage.setItem(config.accessTokenKey, accessToken);
            if (refreshToken) localStorage.setItem(config.refreshTokenKey, refreshToken);

            const { organizations }: JwtUserSubject = getAccessToken()!;
            const slug: string = organizations[0].slug;

            localStorage.setItem(config.currentOrganizationSlugKey, slug);

            return true;
        } catch {
            return false;
        }
    }

    static sendResetPassword(email: string): Promise<MessageResponseDto | ErrorResponseElement> {
        const data = { email };
        return this.apiRequest<MessageResponseDto>({
            method: 'POST',
            url: `${config.authApiBase}/public/users/send-reset-password`,
            data,
            _retry: true,
        });
    }

    static async resetPasswordByCode(
        recoveryCode: string,
        newPassword: string,
    ): Promise<void | ErrorResponseElement> {
        const data = { recoveryCode, newPassword };
        const response = await this.apiRequest<any>({
            method: 'POST',
            url: `${config.authApiBase}/public/users/reset-password`,
            data,
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
        });

        if (response.status === 302 || response.status === 303) {
            const redirectUrl = response.headers['location'];
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                throw new Error('Redirect URL not provided by server');
            }
        }
    }

    static signup(dto: UserSignupDto): Promise<TokenResponseDto | ErrorResponseElement> {
        return this.apiRequest<TokenResponseDto>({
            method: 'POST',
            url: `${API_PUBLIC}/users/signup`,
            data: dto,
            _retry: true,
        });
    }

    static login(dto: UserLoginDto): Promise<TokenResponseDto | ErrorResponseElement> {
        return this.apiRequest<TokenResponseDto>({
            method: 'POST',
            url: `${API_PUBLIC}/users/login`,
            data: dto,
        });
    }

    static exchangeShortCode(shortCode: string): Promise<TokenResponseDto | ErrorResponseElement> {
        return this.apiRequest<TokenResponseDto>({
            method: 'GET',
            url: `${API_PUBLIC}/users/exchange-short-code/${shortCode}`,
        });
    }

    static refreshToken(): Promise<TokenResponseDto | ErrorResponseElement> {
        console.log('refreshToken');
        return this.apiRequest<TokenResponseDto>({
            method: 'GET',
            url: `${API_PUBLIC}/users/refresh-token`,
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

    static createTrialShortUrl(originalUrl: string): Promise<ShortUrlDto | ErrorResponseElement> {
        return this.apiRequest<ShortUrlDto>({
            method: 'POST',
            url: `${API_PUBLIC}/urls`,
            data: { originalUrl },
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
