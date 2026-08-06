import React, { useEffect } from 'react';
import { Typography, Paper, CircularProgress, Box, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { HourglassEmpty as HourglassIcon, School as SchoolIcon } from '@mui/icons-material';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

const WaitingRoom = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const socket = useSocket();
  const sessionData = JSON.parse(localStorage.getItem('studentSession'));

  useEffect(() => {
    if (!sessionData) {
      navigate('/');
      return;
    }

    if (socket) {
      socket.emit('student_join', { examId: sessionData.examId, studentId: sessionData.studentId });

      socket.on('student_status_update', (data) => {
        if (data.status === 'Active' && data.studentId === sessionData.studentId) {
          navigate(`/exam/${sessionData.examId}`);
        }
      });

      const interval = setInterval(async () => {
        try {
          const { data } = await api.post('/student/verify', { 
            rollNumber: sessionData.rollNumber, 
            examCode: sessionData.examCode 
          });
          if (data.status === 'Active') {
            navigate(`/exam/${data.examId}`);
          }
        } catch(e) {
          // Silent ignore for polling errors
        }
      }, 5000); // Polling as backup

      return () => {
        clearInterval(interval);
        socket.off('student_status_update');
      };
    }
  }, [socket, navigate, sessionData]);

  return (
    <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Grid item xs={11} sm={8} md={6} lg={4}>
        <Box textAlign="center" mb={4} display="flex" flexDirection="column" alignItems="center">
          {settings?.institutionLogo ? (
            <Box component="img" src={settings.institutionLogo} alt="Institution Logo" sx={{ height: 60, mb: 2, objectFit: 'contain' }} />
          ) : (
            <Box sx={{ width: 64, height: 64, bgcolor: 'primary.main', mb: 2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <SchoolIcon fontSize="large" />
            </Box>
          )}
          <Typography variant="h5" fontWeight="900" color="#0f172a" letterSpacing="-1px">
            {settings?.institutionName || 'Quiz Master'}
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ p: { xs: 4, md: 5 }, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
          <Box position="relative" display="inline-flex" mb={4}>
            <CircularProgress size={80} thickness={2} sx={{ color: 'primary.light' }} />
            <Box
              sx={{
                top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <HourglassIcon sx={{ fontSize: 30, color: 'primary.main', animation: 'spin 2s linear infinite' }} />
            </Box>
          </Box>
          
          <Typography variant="h5" gutterBottom fontWeight="800" color="#1e293b">
            You're in the Waiting Room
          </Typography>
          <Typography variant="body2" color="#64748b" paragraph mb={4}>
            You are successfully connected. The exam will start automatically when your instructor opens it.
          </Typography>
          
          <Box p={3} bgcolor="#f0f9ff" borderRadius={3} border="1px dashed" borderColor="#bae6fd" textAlign="left">
            <Typography variant="subtitle2" color="#0369a1" fontWeight="700" mb={1}>
              Important Guidelines:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#0c4a6e', fontSize: '0.85rem', lineHeight: 1.6 }}>
              <li>Do not close or refresh this browser tab.</li>
              <li>Ensure your internet connection is stable.</li>
              <li>Switching tabs during the exam may result in auto-submission.</li>
            </ul>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default WaitingRoom;
