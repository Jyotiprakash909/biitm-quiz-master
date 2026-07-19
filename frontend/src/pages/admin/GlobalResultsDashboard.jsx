import React, { useEffect, useState } from 'react';
import { 
  Typography, Box, Paper, Grid, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, CircularProgress, Chip, IconButton, InputBase
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Visibility as ViewIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

const GlobalResultsDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/exams');
      setExams(data);
    } catch (err) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  const completedExams = exams.filter(e => e.status === 'Completed' || e.status === 'Archived');
  const filteredExams = completedExams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.examCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="#0f172a">Results & Analytics</Typography>
          <Typography variant="body2" color="#64748b">View leaderboards, performance analytics, and download reports for completed exams.</Typography>
        </Box>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
            <Typography color="#64748b" variant="subtitle2" fontWeight="700">COMPLETED EXAMS</Typography>
            <Typography variant="h4" fontWeight="900" color="#0f172a" mt={1}>{completedExams.length}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Box p={3} borderBottom="1px solid #e2e8f0" bgcolor="#f8fafc" display="flex" alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', borderRadius: 2, px: 2, py: 1, border: '1px solid #e2e8f0', width: '100%', maxWidth: 400 }}>
            <SearchIcon sx={{ color: '#64748b', mr: 1, fontSize: 20 }} />
            <InputBase 
              placeholder="Search by Exam Name or Code..." 
              sx={{ width: '100%', fontSize: '0.875rem' }} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </Box>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Exam Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam._id} hover>
                  <TableCell>
                    <Typography fontWeight="700" color="#0f172a">{exam.title}</Typography>
                    <Typography variant="caption" color="#64748b">{exam.subject}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={exam.examCode} size="small" sx={{ fontWeight: 'bold', bgcolor: '#f1f5f9', color: '#475569' }} />
                  </TableCell>
                  <TableCell>
                    {exam.startTime ? new Date(exam.startTime).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip label={exam.status} size="small" color={exam.status === 'Completed' ? 'success' : 'default'} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="contained" 
                      size="small" 
                      startIcon={<AssessmentIcon />}
                      onClick={() => navigate(`/admin/results/${exam._id}`)}
                      sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}
                    >
                      View Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredExams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No completed exams found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
};

export default GlobalResultsDashboard;
