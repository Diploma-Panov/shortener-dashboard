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

export interface MessageResponseDto {
    message: string;
}

export enum ServiceErrorType {
    PLATFORM_ERROR = 'PLATFORM_ERROR',
    ACCESS_TOKEN_EXPIRED = 'ACCESS_TOKEN_EXPIRED',
    NO_ACCESS_TOKEN_FOUND = 'NO_ACCESS_TOKEN_FOUND',
    INVALID_ACCESS_TOKEN = 'INVALID_ACCESS_TOKEN',
    LOGIN_FAILED = 'LOGIN_FAILED',
    ACCESS_DENIED = 'ACCESS_DENIED',
    TOKEN_GENERATION_FAILED = 'TOKEN_GENERATION_FAILED',
    EMAIL_IS_INVALID = 'EMAIL_IS_INVALID',
    ENTITY_ALREADY_EXISTS = 'ENTITY_ALREADY_EXISTS',
    ORGANIZATION_ACTION_NOT_ALLOWED = 'ORGANIZATION_ACTION_NOT_ALLOWED',
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    FORM_VALIDATION_FAILED = 'FORM_VALIDATION_FAILED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    PASSWORD_IS_NOT_COMPLIANT = 'PASSWORD_IS_NOT_COMPLIANT',
    SHORT_CODE_EXPIRED = 'SHORT_CODE_EXPIRED',
}

export interface ErrorResponseElement {
    errorMessage?: string | null;
    errorType: ServiceErrorType;
    errorClass: string;
}

export interface ErrorResponseDto {
    errors: ErrorResponseElement[];
}
