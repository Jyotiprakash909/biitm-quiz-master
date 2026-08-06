import React, { useEffect, useState } from 'react';
import { Typography, Paper, Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Grid, CircularProgress, Alert, ThemeProvider, createTheme, useTheme } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle as CheckCircleIcon, PictureAsPdf as PdfIcon, ExitToApp as ExitIcon, Lock as LockIcon, WarningAmber as WarningIcon } from '@mui/icons-material';
import api from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

const ResultStatus = () => {
  const { settings } = useSettings();
  const theme = useTheme();
  const { examId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const sessionData = JSON.parse(localStorage.getItem('studentSession'));

  const dynamicTheme = React.useMemo(() => {
    const resultColor = result?.examThemeColor;
    const settingsColor = settings?.primaryColor;
    if (!resultColor && !settingsColor) return theme;
    return createTheme({
      ...theme,
      palette: {
        ...theme.palette,
        primary: {
          main: resultColor || settingsColor || theme.palette.primary.main,
        },
      },
    });
  }, [result?.examThemeColor, settings?.primaryColor, theme]);

  useEffect(() => {
    if (!sessionData) {
      navigate('/');
      return;
    }

    const fetchResult = async () => {
      try {
        const { data } = await api.get(`/student/result/${examId}?studentId=${sessionData.studentId}`);
        setResult(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load result. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [examId, navigate]); 

  const handleDownload = async () => {
    try {
      const response = await api.get(`/results/exam/${examId}/student/${sessionData.studentId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Marksheet_${sessionData.rollNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download PDF', err);
    }
  };

  const handleExit = () => {
    localStorage.removeItem('studentSession');
    navigate('/');
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f8fafc">
      <CircularProgress size={60} thickness={4} />
    </Box>
  );

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!result) return null;

  const percentage = result.totalMarks > 0 ? ((result.marksObtained / result.totalMarks) * 100).toFixed(1) : 0;
  const passPercentage = result.passPercentage || settings?.defaultPassPercentage || 40;
  const isPass = percentage >= passPercentage;

  return (
    <ThemeProvider theme={dynamicTheme}>
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Grid container justifyContent="center">
        <Grid item xs={11} md={10} lg={8}>
          <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
            
            <Box display="flex" flexDirection="column" alignItems="center" mb={5}>
              <CheckCircleIcon sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
              <Typography variant="h4" gutterBottom fontWeight="900" color="#0f172a" letterSpacing="-0.5px">
                Exam Submitted
              </Typography>
              <Typography variant="body1" color="#64748b">
                Your responses have been successfully recorded.
              </Typography>
            </Box>
            
            <Grid container spacing={3} mb={5} justifyContent="center">
              <Grid item xs={12} sm={result.isPublished ? 4 : 6}>
                <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <Typography variant="subtitle2" color="#64748b" fontWeight="700" textTransform="uppercase" mb={1}>Provisional Score</Typography>
                  <Typography variant="h3" color="#0f172a" fontWeight="900">
                    {result.marksObtained} <Typography variant="h5" component="span" color="#94a3b8">/ {result.totalMarks}</Typography>
                  </Typography>
                </Paper>
              </Grid>

              {result.isPublished && (
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: isPass ? '#dcfce7' : '#fee2e2', border: `1px solid ${isPass ? '#bbf7d0' : '#fecaca'}` }}>
                    <Typography variant="subtitle2" color={isPass ? '#166534' : '#991b1b'} fontWeight="700" textTransform="uppercase" mb={1}>Status</Typography>
                    <Typography variant="h3" color={isPass ? '#15803d' : '#b91c1c'} fontWeight="900">
                      {isPass ? 'PASS' : 'FAIL'}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {result.violationCount > 0 && (
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
                    <Typography variant="subtitle2" color="#92400e" fontWeight="700" textTransform="uppercase" mb={1}>Violations</Typography>
                    <Typography variant="h3" color="#b45309" fontWeight="900">
                      {result.violationCount}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>

            {!result.isPublished ? (
              <Box p={5} bgcolor="#f8fafc" borderRadius={3} border="1px dashed #cbd5e1" textAlign="center">
                <LockIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                <Typography variant="h6" color="#334155" fontWeight="800" mb={1}>
                  Detailed Report Locked
                </Typography>
                <Typography variant="body2" color="#64748b">
                  The detailed answer sheet and official PDF marksheet will be available once your instructor publishes the final results.
                </Typography>
              </Box>
            ) : (
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                  <Typography variant="h6" fontWeight="800" color="#1e293b">Performance Report</Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<PdfIcon />} 
                    onClick={handleDownload}
                    sx={{ borderRadius: 2, px: 3, py: 1, textTransform: 'none', fontWeight: 'bold', boxShadow: 'none', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' } }}
                  >
                    Download Official Marksheet
                  </Button>
                </Box>
                
                <Paper elevation={0} sx={{ overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 3 }}>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#475569' }} width="40%">Question</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Your Answer</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Correct Answer</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="center">Marks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.report.map((item, idx) => (
                        <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ py: 2, color: '#334155' }}>{item.questionText}</TableCell>
                          <TableCell sx={{ color: item.isCorrect ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                            {item.studentAnswer || 'Not Answered'}
                          </TableCell>
                          <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{item.correctAnswer}</TableCell>
                          <TableCell align="center">
                            <Box display="inline-flex" alignItems="center" px={1.5} py={0.5} borderRadius={1} bgcolor={item.isCorrect ? '#dcfce7' : '#f1f5f9'}>
                              <Typography fontWeight="700" color={item.isCorrect ? '#166534' : '#64748b'} fontSize="0.875rem">
                                {item.isCorrect ? item.marks : 0} <Typography component="span" variant="caption" color="inherit">/ {item.marks}</Typography>
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
            )}

            <Box mt={6} pt={4} borderTop="1px solid #f1f5f9" textAlign="center">
              <Button 
                variant="outlined" 
                size="large" 
                startIcon={<ExitIcon />} 
                onClick={handleExit}
                sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 'bold', color: '#64748b', borderColor: '#cbd5e1' }}
              >
                Exit Portal
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
    </ThemeProvider>
  );
};

export default ResultStatus;
