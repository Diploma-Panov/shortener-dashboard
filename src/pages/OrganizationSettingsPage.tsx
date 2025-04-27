import { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Slider,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import Cropper, { Area } from 'react-easy-crop';
import CloseIcon from '@mui/icons-material/Close';
import config from '../config/config';
import BackgroundCard from '../components/BackgroundCard';
import { MemberRole, TokenResponseDto } from '../model/auth';
import {
    OrganizationDto,
    OrganizationsListDto,
    OrganizationType,
    UpdateOrganizationAvatarDto,
    UpdateOrganizationInfoDto,
} from '../model/organizations';
import { getAccessToken, hasRole } from '../auth/auth.ts';
import { ApiClient } from '../common/api.ts';
import { ErrorResponseElement } from '../model/common.ts';
import * as _ from 'lodash';

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

export interface OrganizationSettingsProps {
    org: OrganizationDto | null;
    setOrg: Dispatch<SetStateAction<OrganizationDto | null>>;
    setOrgs: Dispatch<SetStateAction<OrganizationDto[] | null>>;
}

export default function OrganizationSettingsPage({
    org,
    setOrg,
    setOrgs,
}: OrganizationSettingsProps) {
    const slug = localStorage.getItem(config.currentOrganizationSlugKey) || '';

    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const [rawImage, setRawImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [showCrop, setShowCrop] = useState(false);
    const [processingAvatar, setProcessingAvatar] = useState(false);

    useEffect(() => {
        (async () => {
            const organizationRes: OrganizationDto | ErrorResponseElement =
                await ApiClient.getOrganizationBySlug(slug);
            if (_.has(organizationRes, 'errorType')) {
                return;
            }
            const organization: OrganizationDto = organizationRes as OrganizationDto;
            setOrg(organization);
            setName(organization.name);
            setUrl(organization.url ?? '');
            setDescription(organization.description || '');
            setLoading(false);
        })();
    }, [slug, setOrg]);

    const handleSaveInfo = async () => {
        setSaving(true);
        const dto: UpdateOrganizationInfoDto = {
            newName: name,
            newUrl: url,
            newDescription: description,
        };

        const updatedOrganization: OrganizationDto | ErrorResponseElement =
            await ApiClient.updateOrganizationInfo(slug, dto);

        if (_.has(updatedOrganization, 'errorType')) {
            return;
        }

        const updatedOrganizations: OrganizationsListDto | ErrorResponseElement =
            await ApiClient.getUserOrganizations({ q: 10000 });
        if (_.has(updatedOrganizations, 'errorType')) {
            return;
        }

        setOrg(updatedOrganization as OrganizationDto);
        setOrgs((updatedOrganizations as OrganizationsListDto).entries);

        setSaving(false);
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

    const onCropComplete = (_: Area, pixels: Area) => {
        setCroppedAreaPixels(pixels);
    };

    const handleCropSave = async () => {
        if (rawImage && croppedAreaPixels) {
            const cropped = await getCroppedImg(rawImage, croppedAreaPixels);
            setCroppedImage(cropped);
            setShowCrop(false);
        }
    };

    const handleUploadAvatar = async () => {
        if (!croppedImage) return;
        setProcessingAvatar(true);
        const base64 = croppedImage.split(',')[1];
        const dto: UpdateOrganizationAvatarDto = { newAvatarBase64: base64 };

        const updatedOrganization: OrganizationDto | ErrorResponseElement =
            await ApiClient.updateOrganizationAvatar(slug, dto);
        if (_.has(updatedOrganization, 'errorType')) {
            return;
        }

        const updatedOrganizations: OrganizationsListDto | ErrorResponseElement =
            await ApiClient.getUserOrganizations({ q: 10000 });
        if (_.has(updatedOrganizations, 'errorType')) {
            return;
        }

        setOrg(updatedOrganization as OrganizationDto);
        setOrgs((updatedOrganizations as OrganizationsListDto).entries);
        setCroppedImage(null);
        setProcessingAvatar(false);
    };

    const handleDeleteAvatar = async () => {
        setProcessingAvatar(true);
        const updatedOrganization: OrganizationDto | ErrorResponseElement =
            await ApiClient.deleteOrganizationAvatar(slug);
        if (_.has(updatedOrganization, 'errorType')) {
            return;
        }

        const updatedOrganizations: OrganizationsListDto | ErrorResponseElement =
            await ApiClient.getUserOrganizations({ q: 10000 });
        if (_.has(updatedOrganizations, 'errorType')) {
            return;
        }

        setOrg(updatedOrganization as OrganizationDto);
        setOrgs((updatedOrganizations as OrganizationsListDto).entries);
        setProcessingAvatar(false);
    };

    const handleDeleteOrg = async () => {
        const updatedTokens: TokenResponseDto | ErrorResponseElement =
            await ApiClient.deleteOrganization(slug);
        if (_.has(updatedTokens, 'errorType')) {
            return;
        }
        const { accessToken, refreshToken } = updatedTokens as TokenResponseDto;
        localStorage.setItem(config.accessTokenKey, accessToken);
        localStorage.setItem(config.refreshTokenKey, refreshToken!);
        const { organizations } = getAccessToken()!;
        localStorage.setItem(config.currentOrganizationSlugKey, organizations[0].slug);
        window.location.href = '/urls';
    };

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ width: '100%' }}>
            <BackgroundCard width="100%" padding={4}>
                <Stack spacing={4} width="100%">
                    <Typography variant="h4">Organization Settings</Typography>

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
                                gap: 2,
                                width: { md: 260, xs: '100%' },
                            }}
                        >
                            <Avatar
                                src={croppedImage || org?.avatarUrl || undefined}
                                sx={{ width: 200, height: 200 }}
                            />
                            <Button variant="outlined" component="label" fullWidth>
                                Choose Avatar
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </Button>
                            {croppedImage && (
                                <Button variant="contained" onClick={handleUploadAvatar} fullWidth>
                                    {processingAvatar ? 'Uploading…' : 'Upload'}
                                </Button>
                            )}
                            {org?.avatarUrl && !croppedImage && (
                                <Button
                                    variant="text"
                                    color="error"
                                    fullWidth
                                    onClick={handleDeleteAvatar}
                                >
                                    {processingAvatar ? 'Removing…' : 'Remove Avatar'}
                                </Button>
                            )}
                        </Box>

                        <Stack spacing={2} flex={1} sx={{ maxWidth: { xs: '100%', md: 600 } }}>
                            {' '}
                            <TextField
                                label="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="URL"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                            />
                            <Button
                                variant="contained"
                                onClick={handleSaveInfo}
                                disabled={saving}
                                fullWidth
                            >
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                            {org?.type !== OrganizationType.PERMANENT &&
                                hasRole(MemberRole.ORGANIZATION_OWNER) && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleDeleteOrg}
                                        fullWidth
                                    >
                                        Delete Organization
                                    </Button>
                                )}
                        </Stack>
                    </Stack>
                </Stack>
            </BackgroundCard>

            <Dialog open={showCrop} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Crop Avatar
                    <IconButton
                        aria-label="close"
                        onClick={() => setShowCrop(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ height: 400, position: 'relative' }}>
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
                <DialogActions sx={{ px: 3, py: 2 }}>
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
