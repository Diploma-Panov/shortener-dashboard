import { Dispatch, JSX, SetStateAction, useEffect, useState } from 'react';
import {
    Avatar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemIcon,
    ListItemText,
    styled,
    Toolbar,
    Typography,
    useTheme,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    Stack,
    DialogContent,
    DialogActions,
    Button,
    TextField,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupIcon from '@mui/icons-material/Group';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LinkIcon from '@mui/icons-material/Link';
import DomainIcon from '@mui/icons-material/Domain';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '../config/config';
import { UserInfoDto } from '../model/users.ts';
import { hasRole } from '../auth/auth.ts';
import { MemberRole } from '../model/auth.ts';
import { OrganizationDto } from '../model/organizations.ts';
import { z } from 'zod';

const createOrgSchema = z.object({
    name: z.string().nonempty('Name is required'),
    slug: z
        .string()
        .nonempty('Slug is required')
        .regex(/^(?!-)(?!.*--)[a-z0-9-]+(?<!-)$/, {
            message:
                'Value can only contain lowercase letters, digits, and single hyphens; no leading, trailing, or consecutive hyphens',
        }),
    scope: z.literal('SHORTENER_SCOPE'),
    url: z.string().url('Must be valid URL').nullable(),
    description: z.string().nullable(),
    avatarBase64: z.string().nullable(),
});

type CreateOrgInput = z.infer<typeof createOrgSchema>;

const DRAWER_WIDTH = 270;
const COLLAPSED_WIDTH = 60;

const NavItem = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
    display: 'flex',
    alignItems: 'center',
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(3),
    cursor: 'pointer',
    borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
    backgroundColor: isSelected ? theme.palette.action.selected : 'transparent',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

export interface SidebarProps {
    user: UserInfoDto | null;
    setUser: Dispatch<SetStateAction<UserInfoDto | null>>;
    org: OrganizationDto | null;
    orgs: OrganizationDto[] | null;
}

export default function Sidebar({ user, setUser, org, orgs }: SidebarProps) {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const [createOpen, setCreateOpen] = useState(false);

    const [input, setInput] = useState<CreateOrgInput>({
        name: '',
        slug: '',
        scope: 'SHORTENER_SCOPE',
        url: null,
        description: null,
        avatarBase64: null,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof CreateOrgInput, string>>>({});
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        try {
            const parsed = createOrgSchema.parse(input);
            setErrors({});
            setCreating(true);
            const token = localStorage.getItem(config.accessTokenKey) ?? '';
            const res = await fetch(`${config.apiBase}/user/organizations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: token },
                body: JSON.stringify(parsed),
            });
            if (res.ok) {
                const { payload }: { payload: { accessToken: string; refreshToken?: string } } =
                    await res.json();
                localStorage.setItem(config.accessTokenKey, payload.accessToken);
                localStorage.setItem(config.refreshTokenKey, payload.refreshToken!);
                localStorage.setItem(config.currentOrganizationSlugKey, input.slug);
                window.location.href = '/urls';
            } else {
                console.error(await res.text());
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                const fieldErrors: any = {};
                err.errors.forEach((e) => {
                    if (e.path[0]) fieldErrors[e.path[0] as keyof CreateOrgInput] = e.message;
                });
                setErrors(fieldErrors);
            } else console.error(err);
        } finally {
            setCreating(false);
        }
    };

    useEffect(() => {
        (async () => {
            const token = localStorage.getItem(config.accessTokenKey) ?? '';
            try {
                const res = await fetch(`${config.apiBase}/user/users/info`, {
                    headers: { Authorization: token },
                });
                if (res.ok) {
                    const { payload }: { payload: UserInfoDto } = await res.json();
                    setUser(payload);
                }
            } catch (e) {
                console.error('Could not load user info', e);
            }
        })();
    }, [setUser]);

    const navItems: { label: string; icon: JSX.Element; page: string }[] = [];

    if (hasRole(MemberRole.ORGANIZATION_URLS_MANAGER)) {
        navItems.push({ label: 'Short URLs', icon: <LinkIcon />, page: '/urls' });
        navItems.push({ label: 'URL Analytics', icon: <BarChartIcon />, page: '/analytics' });
    }

    if (hasRole(MemberRole.ORGANIZATION_MEMBERS_MANAGER)) {
        navItems.push({ label: 'Organization Members', icon: <GroupIcon />, page: '/members' });
    }

    if (hasRole(MemberRole.ORGANIZATION_MANAGER)) {
        navItems.push({
            label: 'Organization Settings',
            icon: <DomainIcon />,
            page: '/organization',
        });
    }

    if (hasRole(MemberRole.ORGANIZATION_OWNER) || hasRole(MemberRole.ORGANIZATION_ADMIN)) {
        navItems.push(
            ...[
                { label: 'Short URLs', icon: <LinkIcon />, page: '/urls' },
                { label: 'URL Analytics', icon: <BarChartIcon />, page: '/analytics' },
                { label: 'Organization Members', icon: <GroupIcon />, page: '/members' },
                { label: 'Organization Settings', icon: <DomainIcon />, page: '/organization' },
                { label: 'Account Settings', icon: <AccountCircleIcon />, page: '/account' },
                { label: 'Logout', icon: <LogoutIcon />, page: '/login' },
            ],
        );
    }

    return (
        <>
            <Drawer
                variant="permanent"
                sx={{
                    width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
                        boxSizing: 'border-box',
                        backgroundColor: theme.palette.background.paper,
                        borderRight: `1px solid ${theme.palette.divider}`,
                        overflowX: 'hidden',
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    },
                }}
            >
                <Toolbar
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: open ? 'flex-end' : 'center',
                        px: theme.spacing(1),
                    }}
                >
                    <IconButton onClick={() => setOpen((o) => !o)} size="small">
                        {open ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>
                </Toolbar>

                <Divider />

                <List disablePadding>
                    {navItems.map((item) => {
                        const isSelected = location.pathname === item.page;

                        return (
                            <NavItem
                                key={item.label}
                                isSelected={isSelected}
                                onClick={() => {
                                    if (item.label === 'Logout') {
                                        localStorage.removeItem(config.accessTokenKey);
                                        localStorage.removeItem(config.refreshTokenKey);
                                        window.location.href = '/login';
                                    } else {
                                        navigate(item.page);
                                    }
                                }}
                                sx={{
                                    justifyContent: open
                                        ? isSelected
                                            ? 'initial'
                                            : 'flex-start'
                                        : 'center',
                                    px: open ? theme.spacing(3) : 0,
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? theme.spacing(2) : 0,
                                        justifyContent: 'center',
                                        color: isSelected
                                            ? theme.palette.primary.main
                                            : theme.palette.text.primary,
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                {open && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            fontWeight: isSelected ? 600 : 400,
                                            color: isSelected
                                                ? theme.palette.primary.main
                                                : theme.palette.text.primary,
                                        }}
                                    />
                                )}
                            </NavItem>
                        );
                    })}
                </List>

                <Box sx={{ flexGrow: 1 }} />

                <Box
                    sx={{
                        width: '100%',
                        maxWidth: open ? 280 : COLLAPSED_WIDTH,
                        px: open ? 3 : 0,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: open ? 'flex-start' : 'center',
                        gap: 1.5,
                        cursor: 'pointer',
                        overflow: 'hidden',
                    }}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                    {(() => {
                        return (
                            <>
                                <Avatar
                                    src={org?.avatarUrl || undefined}
                                    sx={{
                                        width: open ? 40 : 32,
                                        height: open ? 40 : 32,
                                        border: `2px solid ${theme.palette.divider}`,
                                    }}
                                />

                                {open && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            noWrap
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {org?.name}
                                        </Typography>
                                        <ExpandMoreIcon fontSize="small" />
                                    </Box>
                                )}
                            </>
                        );
                    })()}
                </Box>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={{ mt: -1 }}
                >
                    {orgs?.map((org) => (
                        <MenuItem
                            dense
                            key={org.slug}
                            selected={
                                org.slug === localStorage.getItem(config.currentOrganizationSlugKey)
                            }
                            onClick={() => {
                                localStorage.setItem(config.currentOrganizationSlugKey, org.slug);
                                window.location.href = '/urls';
                            }}
                            sx={{ width: 400 }}
                        >
                            <Avatar
                                src={org.avatarUrl || undefined}
                                sx={{ width: 24, height: 24, mr: 1 }}
                            />
                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                                >
                                    {org.name}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word',
                                        lineHeight: 1,
                                    }}
                                >
                                    {org.description}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))}
                    <Divider />
                    <MenuItem
                        onClick={() => {
                            setCreateOpen(true);
                            setAnchorEl(null);
                        }}
                        sx={{ width: 280, display: 'flex', alignItems: 'center' }}
                    >
                        <AddIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">Create New Organization</Typography>
                    </MenuItem>
                </Menu>

                <Divider sx={{ mx: open ? 3 : 0, my: 1 }} />

                {user && (
                    <Box
                        sx={{
                            width: '100%',
                            px: open ? 3 : 0,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            flexDirection: open ? 'row' : 'column',
                            justifyContent: open ? 'flex-start' : 'center',
                            textAlign: open ? 'left' : 'center',
                            gap: 1.5,
                        }}
                    >
                        <Avatar
                            src={user.profilePictureUrl ?? undefined}
                            sx={{
                                width: open ? 40 : 32,
                                height: open ? 40 : 32,
                                border: `2px solid ${theme.palette.divider}`,
                            }}
                        />
                        {open && (
                            <Box>
                                <Typography variant="body2">
                                    {user.firstname} {user.lastname || ''}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {user.email}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Drawer>
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Create Organization</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label="Name"
                            value={input.name}
                            onChange={(e) =>
                                setInput((prev) => ({ ...prev, name: e.target.value }))
                            }
                            fullWidth
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <TextField
                            label="Slug"
                            value={input.slug}
                            onChange={(e) =>
                                setInput((prev) => ({ ...prev, slug: e.target.value }))
                            }
                            fullWidth
                            error={!!errors.slug}
                            helperText={
                                errors.slug ||
                                'Lowercase, letters/digits/hyphens; no leading/trailing or double hyphens'
                            }
                        />
                        <TextField
                            label="URL"
                            value={input.url || ''}
                            onChange={(e) =>
                                setInput((prev) => ({ ...prev, url: e.target.value || null }))
                            }
                            fullWidth
                            error={!!errors.url}
                            helperText={errors.url}
                        />
                        <TextField
                            label="Description"
                            value={input.description || ''}
                            onChange={(e) =>
                                setInput((prev) => ({
                                    ...prev,
                                    description: e.target.value || null,
                                }))
                            }
                            fullWidth
                            multiline
                            rows={3}
                            error={!!errors.description}
                            helperText={errors.description}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={creating}>
                        {creating ? 'Creating…' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
