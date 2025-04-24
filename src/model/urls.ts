import { PagedResponse } from './common.ts';

export enum ShortUrlType {
    TRIAL = 'TRIAL',
    REGULAR = 'REGULAR',
}

export enum ShortUrlState {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    NOT_ACTIVE = 'NOT_ACTIVE',
    ARCHIVED = 'ARCHIVED',
}

export interface ShortUrlsSearchParams {
    p?: number;
    q?: number;
    tags?: string[];
    s?: ShortUrlState[];
    t?: ShortUrlType[];
    sb?: string;
    dir?: string;
}

export interface ShortUrlDto {
    id: number;
    creatorName: string;
    originalUrl: string;
    shortUrl: string;
    state: ShortUrlState;
    type: ShortUrlType;
    tags: string[];
}

export interface ShortUrlsListDto extends PagedResponse {
    entries: ShortUrlDto[];
}

export interface CreateShortUrlDto {
    originalUrl: string;
    tags: string[];
}

export interface ChangeUrlStateDto {
    newState: ShortUrlState;
}
