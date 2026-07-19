import React, { useState } from 'react';
import { Typography, TextField, Button, Box, Paper, Alert, Grid, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { HowToReg as RegisterIcon, School as SchoolIcon } from '@mui/icons-material';
import api from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

const Registration = () => {
  const { settings } = useSettings();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sessionData = JSON.parse(localStorage.getItem('studentSession'));

  if (!sessionData) {
    navigate('/');
    return null;
  }

  const { rollNumber, examCode } = sessionData;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/student/register', { rollNumber, examCode, name, phoneNumber: phone });
      
      localStorage.setItem('studentSession', JSON.stringify({ ...sessionData, studentId: data.studentId, examId: data.examId }));

      if (data.status === 'Active') {
        navigate(`/exam/${data.examId}`);
      } else {
        navigate('/waiting');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Grid item xs={11} sm={8} md={5} lg={3.5}>
        <Box textAlign="center" mb={4} display="flex" flexDirection="column" alignItems="center">
          {settings?.institutionLogo ? (
            <Box component="img" src={settings.institutionLogo} alt="Institution Logo" sx={{ height: 60, mb: 2, objectFit: 'contain' }} />
          ) : (
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mb: 2 }}>
              <SchoolIcon fontSize="large" />
            </Avatar>
          )}
          <Typography variant="h4" fontWeight="900" color="#0f172a" letterSpacing="-1px">
            {settings?.institutionName || 'Quiz Master'}
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ p: { xs: 4, md: 5 }, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)' }}>
          <Box mb={4}>
            <Typography variant="h6" fontWeight="700" color="#1e293b" gutterBottom>
              Complete Profile
            </Typography>
            <Typography variant="body2" color="#64748b" mb={2}>
              This looks like your first time joining this exam. Please provide your details.
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Box px={1.5} py={0.5} bgcolor="#e0e7ff" color="#4338ca" borderRadius={1.5} fontSize="0.75rem" fontWeight="bold">
                Roll: {rollNumber}
              </Box>
              <Box px={1.5} py={0.5} bgcolor="#fce7f3" color="#be185d" borderRadius={1.5} fontSize="0.75rem" fontWeight="bold">
                Exam: {examCode}
              </Box>
            </Box>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.875rem' }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleRegister} noValidate>
            <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={1}>Full Name</Typography>
            <TextField
              required
              fullWidth
              placeholder="e.g., John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc', transition: 'all 0.2s', '&.Mui-focused': { bgcolor: 'white', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' } } }}
            />
            <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={1}>Phone Number (Optional)</Typography>
            <TextField
              fullWidth
              placeholder="e.g., 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc', transition: 'all 0.2s', '&.Mui-focused': { bgcolor: 'white', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' } } }}
            />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              size="large"
              disabled={loading}
              sx={{ 
                py: 1.5, 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 'bold', 
                fontSize: '1rem',
                boxShadow: 'none',
                '&:hover': { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
              }}
            >
              {loading ? 'Registering...' : 'Register & Proceed'}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Registration;
