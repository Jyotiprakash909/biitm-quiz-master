import React, { useEffect, useState } from 'react';
import { 
  Typography, Box, Paper, Grid, Table, TableBody, TableCell, TableHead, TableRow, 
  CircularProgress, Chip, IconButton, Tooltip, TextField, InputAdornment 
} from '@mui/material';
import { 
  Search as SearchIcon, 
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const QuestionBank = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/exams');
      setExams(data.filter(e => !e.isArchived));
    } catch (err) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.examCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.subject && e.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="#0f172a">Question Bank</Typography>
          <Typography variant="body2" color="#64748b">Select an exam to manage, upload, or edit its questions.</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Box p={3} borderBottom="1px solid #e2e8f0" display="flex" justifyContent="space-between" alignItems="center" bgcolor="#f8fafc">
          <TextField
            size="small"
            placeholder="Search by exam code or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
              sx: { borderRadius: 2, bgcolor: 'white', minWidth: 300 }
            }}
          />
        </Box>
        
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Exam Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="right">Manage Questions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam._id} hover onClick={() => navigate(`/admin/exams/${exam._id}/questions`)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{exam.examCode}</TableCell>
                  <TableCell>{exam.title}</TableCell>
                  <TableCell><Chip label={exam.subject || 'General'} size="small" sx={{ borderRadius: 1.5, fontWeight: 'bold' }} /></TableCell>
                  <TableCell>
                    <Chip 
                      label={exam.status} 
                      color={exam.status === 'Active' ? 'error' : exam.status === 'Completed' ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Manage Questions">
                      <IconButton color="primary">
                        <ArrowForwardIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredExams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No active exams found matching your search.
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

export default QuestionBank;
