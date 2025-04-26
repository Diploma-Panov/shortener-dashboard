import { useState } from 'react';
import {
    Drawer,
    Toolbar,
    IconButton,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    useTheme,
    styled,
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

const DRAWER_WIDTH = 270;
const COLLAPSED_WIDTH = 60;

const NavItem = styled(ListItemButton, {
    shouldForwardProp: (prop) => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
    backgroundColor: isSelected ? theme.palette.action.selected : 'transparent',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const navItems = [
    { label: 'Short URLs', icon: <LinkIcon />, page: '/urls' },
    { label: 'URL Analytics', icon: <BarChartIcon />, page: '/analytics' },
    { label: 'Organization Members', icon: <GroupIcon />, page: '/organization-members' },
    { label: 'Account Settings', icon: <AccountCircleIcon />, page: '/account-settings' },
    { label: 'Logout', icon: <LogoutIcon />, page: '/login' },
];

export default function Sidebar() {
    const theme = useTheme();
    const [open, setOpen] = useState(true);
    const [selected, setSelected] = useState('Short URLs');
    const navigate = useNavigate();

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
                <IconButton onClick={() => setOpen(!open)} size="small">
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
        </Drawer>
    );
}
