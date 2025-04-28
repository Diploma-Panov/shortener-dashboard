import { useState, useEffect, Dispatch, SetStateAction, ChangeEvent } from 'react';
import {
    Box,
    TextField,
    Button,
    Avatar,
    Typography,
    CircularProgress,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slider,
    IconButton,
} from '@mui/material';
import Cropper, { Area } from 'react-easy-crop';
import CloseIcon from '@mui/icons-material/Close';
import { UpdateUserInfoDto, UpdateUserProfilePictureDto, UserInfoDto } from '../model/users';
import BackgroundCard from '../components/BackgroundCard';
import { ApiClient } from '../common/api.ts';
import { ErrorResponseElement, ServiceErrorType } from '../model/common.ts';
import * as _ from 'lodash';
import { useAppToast } from '../components/toast.tsx';

interface UserInfoProps {
    user: UserInfoDto | null;
    setUser: Dispatch<SetStateAction<UserInfoDto | null>>;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
    });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
    );

    return canvas.toDataURL('image/jpeg');
};

export default function UserInfoPage({ user, setUser }: UserInfoProps) {
    const [loading, setLoading] = useState(true);

    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState<string | null>(null);
    const [company, setCompany] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [updatingInfo, setUpdatingInfo] = useState(false);

    const [rawImage, setRawImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [showCrop, setShowCrop] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [processingAvatar, setProcessingAvatar] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const { success, error } = useAppToast();

    useEffect(() => {
        (async () => {
            const res: UserInfoDto | ErrorResponseElement = await ApiClient.getUserInfo();

            if (_.has(res, 'errorType')) {
                error('Could not get user info');
                return;
            }

            const payload: UserInfoDto = res as UserInfoDto;

            setUser(payload);
            setFirstname(payload.firstname);
            setLastname(payload.lastname);
            setCompany(payload.companyName);
            setEmail(payload.email);
            setLoading(false);
        })();
    }, [setUser]);

    const handleDeleteAvatar = async () => {
        setProcessingAvatar(true);
        const res: UserInfoDto | ErrorResponseElement = await ApiClient.deleteProfilePicture();

        if (_.has(res, 'errorType')) {
            error('Could not delete profile picture');
            return;
        }

        success('Profile picture was successfully deleted');

        const payload: UserInfoDto = res as UserInfoDto;
        setUser(payload);
        setProcessingAvatar(false);
    };

    const handleSaveInfo = async () => {
        setUpdatingInfo(true);
        const dto: UpdateUserInfoDto = {
            newFirstname: firstname || null,
            newLastname: lastname,
            newCompanyName: company,
            newEmail: email || null,
        };
        const res: UserInfoDto | ErrorResponseElement = await ApiClient.updateUserInfo(dto);

        setUpdatingInfo(false);

        if (_.has(res, 'errorType')) {
            if (res.errorType === ServiceErrorType.ENTITY_ALREADY_EXISTS) {
                error('User with this email already exists');
            } else {
                error('Could not update user info');
            }
            return;
        }

        success('User info was successfully updated');

        const payload: UserInfoDto = res as UserInfoDto;
        setUser(payload);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = () => {
                setRawImage(reader.result as string);
                setShowCrop(true);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onCropComplete = (_: Area, areaPixels: Area) => {
        setCroppedAreaPixels(areaPixels);
    };

    const handleCropSave = async () => {
        if (rawImage && croppedAreaPixels) {
            const cropped = await getCroppedImg(rawImage, croppedAreaPixels);
            setCroppedImage(cropped);
            setShowCrop(false);
        }
    };

    const handleUploadPicture = async () => {
        setSaving(true);
        if (!croppedImage) return;
        const base64 = croppedImage.split(',')[1];
        const dto: UpdateUserProfilePictureDto = { newProfilePictureBase64: base64 };
        const res: UserInfoDto | ErrorResponseElement = await ApiClient.updateProfilePicture(dto);

        if (_.has(res, 'errorType')) {
            error('Could not upload profile picture');
            return;
        }

        success('Profile picture was successfully uploaded');

        const payload: UserInfoDto = res as UserInfoDto;
        setUser(payload);
        setCroppedImage(null);
        setSaving(false);
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <BackgroundCard padding={4} width="100%">
                <Stack spacing={4} width="100%">
                    <Typography variant="h4">Account Settings</Typography>

                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={4}
                        justifyContent="space-around"
                        alignItems="center"
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: { xs: '100%', md: 260 },
                                gap: 3,
                            }}
                        >
                            <Avatar
                                src={croppedImage || user?.profilePictureUrl || undefined}
                                sx={{ width: 200, height: 200 }}
                            />
                            <Button variant="outlined" component="label" fullWidth>
                                Choose Picture
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </Button>
                            {croppedImage && (
                                <Button variant="contained" onClick={handleUploadPicture} fullWidth>
                                    {saving ? 'Uploading...' : 'Upload Cropped'}
                                </Button>
                            )}
                            {user?.profilePictureUrl && !croppedImage && (
                                <Button
                                    variant="text"
                                    color="error"
                                    fullWidth
                                    onClick={handleDeleteAvatar}
                                >
                                    {processingAvatar ? 'Removing…' : 'Remove Picture'}
                                </Button>
                            )}
                        </Box>

                        <Stack spacing={2} flex={1} sx={{ maxWidth: { xs: '100%', md: 600 } }}>
                            <TextField
                                label="First Name"
                                value={firstname}
                                onChange={(e) => setFirstname(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="Last Name"
                                value={lastname || ''}
                                onChange={(e) => setLastname(e.target.value || null)}
                                fullWidth
                            />
                            <TextField
                                label="Company Name"
                                value={company || ''}
                                onChange={(e) => setCompany(e.target.value || null)}
                                fullWidth
                            />
                            <TextField
                                label="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                onClick={handleSaveInfo}
                                disabled={updatingInfo}
                                fullWidth
                                sx={{ mt: 2 }}
                            >
                                {updatingInfo ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </BackgroundCard>

            <Dialog open={showCrop} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2 }}>
                    Crop Picture
                    <IconButton
                        aria-label="close"
                        onClick={() => setShowCrop(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ position: 'relative', height: 400 }}>
                    {rawImage && (
                        <Cropper
                            image={rawImage}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        Zoom
                    </Typography>
                    <Slider
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(_, v) => setZoom(v as number)}
                        sx={{ width: 200 }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Button onClick={() => setShowCrop(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCropSave}>
                        Save Crop
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
