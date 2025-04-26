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
