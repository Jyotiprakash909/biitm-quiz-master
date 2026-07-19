import React, { useState } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme, useMediaQuery,
  Avatar, Badge, InputBase, Tooltip
} from '@mui/material';
import { 
  SpaceDashboard as DashboardIcon, 
  LibraryBooks as ExamIcon, 
  Quiz as QuestionIcon,
  People as StudentIcon,
  EmojiEvents as ResultsIcon,
  Insights as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  NotificationsOutlined as NotificationsIcon,
  DarkModeOutlined as ThemeIcon,
  LightModeOutlined as LightModeIcon,
  Business as InstitutionIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeToggle } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import NotificationPanel from './NotificationPanel';

const drawerWidth = 260;

const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { toggleTheme, mode } = useThemeToggle();
  const { settings } = useSettings();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Exam Management', icon: <ExamIcon />, path: '/admin/exams' },
    { text: 'Question Bank', icon: <QuestionIcon />, path: '/admin/questions' },
    { text: 'Student Sessions', icon: <StudentIcon />, path: '/admin/sessions' },
    { text: 'Results', icon: <ResultsIcon />, path: '/admin/results' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
  ];

  const currentMenu = menuItems.find(m => location.pathname.startsWith(m.path));

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {settings?.institutionLogo ? (
          <Box component="img" src={settings.institutionLogo} alt="Logo" sx={{ height: 32, objectFit: 'contain' }} />
        ) : (
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 0.8, borderRadius: 2, display: 'flex' }}>
            <InstitutionIcon fontSize="small" />
          </Box>
        )}
        <Typography variant="h6" fontWeight="800" color="#0f172a" letterSpacing="-0.5px" noWrap>
          {settings?.institutionName || 'Quiz Master'}
        </Typography>
      </Box>
      <List sx={{ px: 2, flexGrow: 1 }}>
        <Typography variant="overline" color="#94a3b8" fontWeight="700" sx={{ px: 2, mb: 1, display: 'block' }}>
          MAIN MENU
        </Typography>
        {menuItems.map((item) => {
          const isSelected = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                selected={isSelected}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  '&.Mui-selected': {
                    bgcolor: '#f1f5f9',
                    color: '#0f172a',
                    '& .MuiListItemIcon-root': { color: 'primary.main' }
                  },
                  '&:hover': { bgcolor: '#f8fafc' }
                }}
              >
                <ListItemIcon sx={{ color: isSelected ? 'primary.main' : '#64748b', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.875rem',
                    color: isSelected ? '#0f172a' : '#475569'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2, borderColor: '#f1f5f9' }} />
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout} 
            sx={{ borderRadius: 2, '&:hover': { bgcolor: '#fee2e2' } }}
          >
            <ListItemIcon sx={{ color: '#ef4444', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600, color: '#ef4444', fontSize: '0.875rem' }} />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          borderBottom: '1px solid #e2e8f0',
          color: '#0f172a',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, flexGrow: { xs: 1, md: 0 }, mr: 4 }}>
            {currentMenu?.text || 'Dashboard'}
          </Typography>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: 2, px: 2, py: 0.5, flexGrow: 1, maxWidth: 400 }}>
            <SearchIcon sx={{ color: '#64748b', mr: 1, fontSize: 20 }} />
            <InputBase placeholder="Search exams, students..." sx={{ width: '100%', fontSize: '0.875rem', fontWeight: 500 }} />
          </Box>

          <Box sx={{ flexGrow: { xs: 0, md: 1 } }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            <Tooltip title="Toggle Theme">
              <IconButton sx={{ color: '#64748b' }} onClick={toggleTheme}>
                {mode === 'dark' ? <LightModeIcon /> : <ThemeIcon />}
              </IconButton>
            </Tooltip>
            <NotificationPanel />
            <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1.5, borderColor: '#e2e8f0' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography variant="subtitle2" fontWeight="700" lineHeight={1.2}>Admin User</Typography>
                <Typography variant="caption" color="#64748b" fontWeight="600">Superadmin</Typography>
              </Box>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem', fontWeight: 'bold' }}>A</Avatar>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e2e8f0' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
