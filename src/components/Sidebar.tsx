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
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import BugReportIcon from '@mui/icons-material/BugReport';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

const DRAWER_WIDTH = 210;
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
    { label: 'Home', icon: <HomeIcon /> },
    { label: 'Dashboard', icon: <DashboardIcon /> },
    { label: 'Projects', icon: <FolderIcon /> },
    { label: 'Issues', icon: <BugReportIcon /> },
    { label: 'Settings', icon: <SettingsIcon /> },
    { label: 'Logout', icon: <LogoutIcon /> },
];

export default function Sidebar() {
    const theme = useTheme();
    const [open, setOpen] = useState(true);
    const [selected, setSelected] = useState('Home');

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
                            onClick={() => setSelected(item.label)}
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
                                    // mx: open ? 0 : 'auto',
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
