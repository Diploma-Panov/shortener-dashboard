export interface PagedResponse {
    total: number;
    hasMore: boolean;
    page: number;
    perPage: number;
}

export interface AbstractResponseDto<T> {
    payload: T;
    payloadType: string;
}
