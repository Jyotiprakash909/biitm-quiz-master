import React, { useState } from 'react';
import { Typography, TextField, Button, Box, Paper, Alert, Grid, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PlayArrow as PlayArrowIcon, School as SchoolIcon } from '@mui/icons-material';
import api from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

const Entry = () => {
  const { settings } = useSettings();
  const [rollNumber, setRollNumber] = useState('');
  const [examCode, setExamCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEntry = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim() || !examCode.trim()) {
      setError('Please enter both Roll Number and Exam Code.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.post('/student/verify', { 
        rollNumber: rollNumber.trim().toUpperCase(), 
        examCode: examCode.trim() 
      });
      
      localStorage.setItem('studentSession', JSON.stringify({ 
        rollNumber: rollNumber.trim().toUpperCase(), 
        examCode: examCode.trim(), 
        studentId: data.studentId, 
        examId: data.examId 
      }));

      if (data.status === 'RegistrationClosed') {
        setError('Registration is currently closed by the instructor.');
      } else if (data.status === 'NeedsRegistration') {
        navigate('/register');
      } else if (data.status === 'Waiting') {
        navigate('/waiting');
      } else if (data.status === 'Active') {
        navigate(`/exam/${data.examId}`);
      } else if (data.status === 'Completed' || data.status === 'Submitted' || data.status === 'AutoSubmitted') {
        navigate(`/result/${data.examId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your credentials.');
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
              Join Examination
            </Typography>
            <Typography variant="body2" color="#64748b">
              Enter your Roll Number and the Exam Code provided by your instructor to proceed.
            </Typography>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.875rem' }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleEntry} noValidate>
            <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={1}>Roll Number</Typography>
            <TextField
              required
              fullWidth
              placeholder="e.g., MCA-2023-01"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              disabled={loading}
              autoFocus
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc', transition: 'all 0.2s', '&.Mui-focused': { bgcolor: 'white', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' } } }}
            />
            <Typography variant="subtitle2" fontWeight="600" color="#334155" mb={1}>Exam Code</Typography>
            <TextField
              required
              fullWidth
              placeholder="e.g., BQM-X7K9P2"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              disabled={loading}
              sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc', transition: 'all 0.2s', '&.Mui-focused': { bgcolor: 'white', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' } } }}
            />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              size="large"
              disabled={loading}
              endIcon={<PlayArrowIcon />}
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
              {loading ? 'Verifying...' : 'Continue'}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Entry;
