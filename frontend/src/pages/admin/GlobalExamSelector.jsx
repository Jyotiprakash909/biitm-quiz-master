import React, { useEffect, useState } from 'react';
import { Typography, Paper, Grid, Box, CircularProgress, Alert, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowForward as ArrowIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import api from '../../services/api';

// A generic page to list exams and navigate to their specific nested admin routes
const GlobalExamSelector = ({ title, subtitle, targetRoutePrefix, actionLabel }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await api.get('/exams');
        setExams(data);
      } catch (err) {
        setError('Failed to fetch exams');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;

  return (
    <Box maxWidth="1200px" mx="auto">
      <Typography variant="h4" fontWeight="800" color="#0f172a" mb={1}>{title}</Typography>
      <Typography variant="body2" color="#64748b" mb={4}>{subtitle}</Typography>

      <Grid container spacing={3}>
        {exams.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">No exams found. Create an exam first.</Alert>
          </Grid>
        ) : (
          exams.map((exam) => (
            <Grid item xs={12} md={6} lg={4} key={exam._id}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  border: '1px solid #e2e8f0', 
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box p={1.5} borderRadius={2} bgcolor="#eff6ff" color="#3b82f6" display="flex">
                    <AssignmentIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="700" color="#1e293b" noWrap title={exam.title}>
                      {exam.title.length > 25 ? `${exam.title.substring(0, 25)}...` : exam.title}
                    </Typography>
                    <Typography variant="caption" color="#64748b" fontWeight="600">
                      Code: {exam.examCode}
                    </Typography>
                  </Box>
                </Box>
                <Box mb={3}>
                  <Chip 
                    label={exam.status} 
                    size="small" 
                    sx={{ 
                      bgcolor: exam.status === 'Active' ? '#dcfce7' : exam.status === 'Completed' ? '#f3e8ff' : '#f1f5f9',
                      color: exam.status === 'Active' ? '#166534' : exam.status === 'Completed' ? '#6b21a8' : '#475569',
                      fontWeight: 'bold', borderRadius: 1.5
                    }} 
                  />
                </Box>
                <Button 
                  variant="contained" 
                  fullWidth 
                  endIcon={<ArrowIcon />}
                  onClick={() => navigate(`${targetRoutePrefix}/${exam._id}${targetRoutePrefix === '/admin/exams' ? '/questions' : targetRoutePrefix === '/admin/results' ? '' : '/live'}`)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}
                >
                  {actionLabel}
                </Button>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default GlobalExamSelector;
