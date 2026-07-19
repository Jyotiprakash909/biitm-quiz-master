import React, { useEffect, useState } from 'react';
import { 
  Typography, Box, Card, CardContent, Grid, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, Modal, IconButton, CircularProgress
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Close as CloseIcon, Download as DownloadIcon, RemoveRedEye as EyeIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ResultsAnalytics = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [exam, setExam] = useState(null);
  
  // Modal State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examRes = await api.get(`/exams/${examId}`);
        setExam(examRes.data);
        const analyticsRes = await api.get(`/results/exam/${examId}/analytics`);
        setStats(analyticsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [examId]);

  const downloadExcel = async () => {
    const toastId = toast.loading('Generating Excel file...');
    try {
      const response = await api.get(`/results/exam/${examId}/export-excel`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Results_${exam?.examCode || 'Export'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Excel exported successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel.', { id: toastId });
    }
  };

  const handlePublish = async () => {
    try {
      await api.post(`/results/exam/${examId}/publish`, { isPublished: true });
      toast.success('Results Published to Students');
      const analyticsRes = await api.get(`/results/exam/${examId}/analytics`);
      setStats(analyticsRes.data);
    } catch (err) {
      toast.error('Failed to publish results');
    }
  };

  const openStudentReport = async (studentId) => {
    setReportOpen(true);
    setReportLoading(true);
    try {
      const { data } = await api.get(`/results/exam/${examId}/student/${studentId}/report`);
      setCurrentReport(data);
    } catch (err) {
      toast.error('Failed to fetch student report');
      setReportOpen(false);
    } finally {
      setReportLoading(false);
    }
  };

  if (!stats) return <Box p={4}><CircularProgress /></Box>;

  const pieData = [
    { name: 'Passed', value: stats.passed, color: '#10b981' },
    { name: 'Failed', value: stats.failed, color: '#ef4444' }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="#0f172a">
            Results Analytics
          </Typography>
          <Typography variant="body2" color="#64748b">
            {exam?.title} ({exam?.examCode})
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => navigate('/admin/results')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}>
            Back
          </Button>
          <Button variant="outlined" color="primary" onClick={downloadExcel} startIcon={<DownloadIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}>
            Export Excel
          </Button>
          <Button variant="contained" color={stats.isPublished ? "success" : "primary"} onClick={handlePublish} disabled={stats.isPublished} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}>
            {stats.isPublished ? 'Results Published' : 'Publish Results'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Typography color="#64748b" variant="subtitle2" fontWeight="700">AVERAGE SCORE</Typography>
            <Typography variant="h4" fontWeight="900" color="#0f172a" mt={1}>{stats.averageScore.toFixed(2)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Typography color="#64748b" variant="subtitle2" fontWeight="700">HIGHEST SCORE</Typography>
            <Typography variant="h4" fontWeight="900" color="#10b981" mt={1}>{stats.highestScore}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Typography color="#64748b" variant="subtitle2" fontWeight="700">LOWEST SCORE</Typography>
            <Typography variant="h4" fontWeight="900" color="#ef4444" mt={1}>{stats.lowestScore}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Typography color="#64748b" variant="subtitle2" fontWeight="700">PASS RATE</Typography>
            <Typography variant="h4" fontWeight="900" color="#f59e0b" mt={1}>
              {stats.totalSubmissions > 0 ? ((stats.passed / stats.totalSubmissions) * 100).toFixed(1) : 0}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
            <Typography variant="h6" fontWeight="800" color="#1e293b" mb={2}>Pass vs Fail</Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              {stats.totalSubmissions > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography align="center" color="textSecondary" mt={10}>No submissions yet.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%', overflow: 'hidden' }}>
            <Typography variant="h6" fontWeight="800" color="#1e293b" mb={2}>Top Performers</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Roll No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="center">Score</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.topPerformers.map((student, idx) => {
                  const percentage = student.totalMarks > 0 ? ((student.marksObtained / student.totalMarks) * 100).toFixed(1) : 0;
                  return (
                    <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 800 }}>#{idx + 1}</TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{student.name}</TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="700" color="#0f172a">
                          {student.marksObtained} <Typography component="span" variant="caption" color="#64748b">/ {student.totalMarks}</Typography>
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={percentage >= 40 ? 'PASS' : 'FAIL'} sx={{ bgcolor: percentage >= 40 ? '#dcfce7' : '#fee2e2', color: percentage >= 40 ? '#166534' : '#991b1b', fontWeight: 'bold' }} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="outlined" startIcon={<EyeIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }} onClick={() => openStudentReport(student.studentId)}>
                          Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {stats.topPerformers.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No submissions found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      {/* Student Deep-Dive Modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', borderRadius: 4, p: 0 }}>
          {reportLoading ? (
            <Box p={5} textAlign="center"><CircularProgress /></Box>
          ) : currentReport && (
            <Box>
              <Box p={3} borderBottom="1px solid #e2e8f0" display="flex" justifyContent="space-between" alignItems="center" bgcolor="#f8fafc">
                <Box>
                  <Typography variant="h6" fontWeight="800" color="#0f172a">{currentReport.student.name}</Typography>
                  <Typography variant="subtitle2" color="#64748b">{currentReport.student.rollNumber} • {currentReport.submission.status}</Typography>
                </Box>
                <IconButton onClick={() => setReportOpen(false)}><CloseIcon /></IconButton>
              </Box>
              
              <Box p={3} display="flex" gap={2} bgcolor="#eff6ff">
                <Box bgcolor="white" p={2} borderRadius={2} border="1px solid #bfdbfe" flexGrow={1} textAlign="center">
                  <Typography variant="caption" fontWeight="bold" color="#3b82f6">MARKS OBTAINED</Typography>
                  <Typography variant="h5" fontWeight="900" color="#1e3a8a">{currentReport.submission.marksObtained} / {currentReport.submission.totalMarks}</Typography>
                </Box>
                <Box bgcolor="white" p={2} borderRadius={2} border="1px solid #bfdbfe" flexGrow={1} textAlign="center">
                  <Typography variant="caption" fontWeight="bold" color="#3b82f6">VIOLATIONS</Typography>
                  <Typography variant="h5" fontWeight="900" color={currentReport.session?.violationCount > 0 ? '#ef4444' : '#1e3a8a'}>{currentReport.session?.violationCount || 0}</Typography>
                </Box>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button 
                    variant="contained" 
                    startIcon={<DownloadIcon />} 
                    onClick={() => window.open(`/api/results/exam/${examId}/student/${currentReport.student._id}/pdf`, '_blank')}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}
                  >
                    Export PDF
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<DownloadIcon />} 
                    onClick={() => window.open(`/api/results/exam/${examId}/student/${currentReport.student._id}/excel`, '_blank')}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: 'none', bgcolor: 'white' }}
                  >
                    Export Excel
                  </Button>
                </Box>
              </Box>

              <Box p={3}>
                <Typography variant="h6" fontWeight="800" mb={2}>Detailed Answer Sheet</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }} width="45%">Question</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Student Answer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Correct Answer</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentReport.report.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: '#334155' }}>{item.questionText}</TableCell>
                        <TableCell sx={{ color: item.isCorrect ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>{item.studentAnswer}</TableCell>
                        <TableCell sx={{ color: '#0f172a' }}>{item.correctAnswer}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </Paper>
      </Modal>
    </Box>
  );
};

export default ResultsAnalytics;
