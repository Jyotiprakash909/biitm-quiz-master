import React, { useEffect, useState } from 'react';
import { 
  Badge, IconButton, Menu, MenuItem, Typography, Box, CircularProgress, 
  Button, Divider, ListItemText, ListItemIcon 
} from '@mui/material';
import { 
  NotificationsOutlined as NotificationsIcon,
  CheckCircleOutlined as ReadIcon,
  DeleteOutlined as ClearIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
  ErrorOutlined as ErrorIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NotificationPanel = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    if (notifications.length === 0) fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      handleClose();
    } catch (err) {}
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkRead({ stopPropagation: () => {} }, notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
      handleClose();
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (severity) => {
    switch(severity) {
      case 'warning': return <WarningIcon sx={{ color: '#f59e0b' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#ef4444' }} />;
      case 'success': return <SuccessIcon sx={{ color: '#10b981' }} />;
      default: return <InfoIcon sx={{ color: '#3b82f6' }} />;
    }
  };

  return (
    <>
      <IconButton sx={{ color: '#64748b' }} onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            width: 380,
            maxHeight: 500,
            overflowY: 'auto',
            filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.1))',
            mt: 1.5,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            '& .MuiMenuItem-root': {
              whiteSpace: 'normal',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box px={2} py={1.5} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" fontWeight="800" color="#0f172a">Notifications</Typography>
          <Box display="flex" gap={1}>
            {unreadCount > 0 && (
              <IconButton size="small" onClick={handleMarkAllRead} title="Mark all as read">
                <ReadIcon fontSize="small" />
              </IconButton>
            )}
            {notifications.length > 0 && (
              <IconButton size="small" onClick={handleClearAll} title="Clear all">
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
        <Divider />
        
        {loading && notifications.length === 0 ? (
          <Box p={4} textAlign="center"><CircularProgress size={24} /></Box>
        ) : notifications.length === 0 ? (
          <Box p={4} textAlign="center">
            <NotificationsIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body2" color="#64748b">No new notifications</Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem 
              key={notification._id} 
              onClick={() => handleNotificationClick(notification)}
              sx={{ 
                py: 2, 
                px: 2, 
                bgcolor: notification.isRead ? 'transparent' : '#f0f9ff',
                borderBottom: '1px solid #f1f5f9',
                '&:hover': { bgcolor: notification.isRead ? '#f8fafc' : '#e0f2fe' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, alignSelf: 'flex-start', mt: 0.5 }}>
                {getIcon(notification.severity)}
              </ListItemIcon>
              <ListItemText 
                primary={notification.title}
                secondary={
                  <React.Fragment>
                    <Typography variant="body2" color="#475569" sx={{ display: 'block', mt: 0.5 }}>
                      {notification.description}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                  </React.Fragment>
                }
                primaryTypographyProps={{ fontWeight: notification.isRead ? 600 : 800, color: '#0f172a' }}
              />
              {!notification.isRead && (
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6', alignSelf: 'center', ml: 2 }} />
              )}
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationPanel;
