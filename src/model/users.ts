export interface UserInfoDto {
    id: number;
    firstname: string;
    lastname: string | null;
    companyName: string | null;
    email: string;
    profilePictureUrl: string | null;
}

export interface UpdateUserInfoDto {
    newFirstname: string | null;
    newLastname: string | null;
    newCompanyName: string | null;
    newEmail: string | null;
}

export interface UpdateUserProfilePictureDto {
    newProfilePictureBase64: string;
}

export interface UserLoginDto {
    username: string;
    password: string;
}

export interface UserSignupDto {
    username: string;
    password: string;
    firstName: string;
    lastName: string | null;
    companyName: string | null;
    profilePictureBase64: string | null;
    registrationScope: 'SHORTENER_SCOPE';
    siteUrl: string | null;
}
