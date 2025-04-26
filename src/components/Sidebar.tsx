import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import {
    Drawer,
    Toolbar,
    IconButton,
    Divider,
    List,
    Box,
    Avatar,
    Typography,
    useTheme,
    styled,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupIcon from '@mui/icons-material/Group';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LinkIcon from '@mui/icons-material/Link';
import { useNavigate } from 'react-router-dom';
import config from '../config/config';
import { UserInfoDto } from '../model/users.ts';

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
}

export default function Sidebar({ user, setUser }: SidebarProps) {
    const theme = useTheme();
    const navigate = useNavigate();

    const [open, setOpen] = useState(true);
    const [selected, setSelected] = useState('Short URLs');

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

    const navItems = [
        { label: 'Short URLs', icon: <LinkIcon />, page: '/urls' },
        { label: 'URL Analytics', icon: <BarChartIcon />, page: '/analytics' },
        {
            label: 'Organization Members',
            icon: <GroupIcon />,
            page: '/organization-members',
        },
        { label: 'Account Settings', icon: <AccountCircleIcon />, page: '/account' },
        { label: 'Logout', icon: <LogoutIcon />, page: '/login' },
    ];

    return (
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
                    const isSelected = selected === item.label;
                    return (
                        <NavItem
                            key={item.label}
                            isSelected={isSelected}
                            onClick={() => {
                                setSelected(item.label);
                                if (item.label === 'Logout') {
                                    localStorage.removeItem(config.accessTokenKey);
                                    localStorage.removeItem(config.refreshTokenKey);
                                    window.location.href = '/login';
                                    return;
                                }
                                navigate(item.page);
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
    );
}
