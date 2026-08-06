import React, { useEffect, useState } from 'react';
import { 
  Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, Box, Chip, TextField, InputAdornment, Grid, Card, CardContent
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const LiveMonitoring = () => {
  const { examId } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ waiting: 0, active: 0, submitted: 0, autoSubmitted: 0, disconnected: 0 });
  const [search, setSearch] = useState('');
  const [recentViolations, setRecentViolations] = useState([]);

  const fetchLiveStats = async () => {
    try {
      const { data } = await api.get(`/exams/${examId}/live-stats`);
      setStats(data.stats);
      setStudents(data.sessions.map(s => ({
        sessionId: s.sessionId,
        studentId: s.studentId?._id,
        rollNumber: s.studentId?.rollNumber || 'Unknown',
        name: s.studentId?.name || 'Unknown',
        status: s.status,
        violationCount: s.violationCount,
        joinTime: s.joinTime
      })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await api.get(`/exams/${examId}`);
        setExam(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchExam();
    fetchLiveStats();

    if (socket) {
      socket.emit('admin_join', { examId });
      socket.on('student_status_update', (data) => {
        fetchLiveStats(); // Re-fetch entire list on update to ensure sync
      });
      socket.on('student_violation', (data) => {
        setRecentViolations(prev => {
          const updated = [{ ...data, time: new Date() }, ...prev];
          return updated.slice(0, 10);
        });
        fetchLiveStats();
      });
    }

    return () => {
      if (socket) {
        socket.off('student_status_update');
        socket.off('student_violation');
      }
    };
  }, [examId, socket]);

  const handleStatusChange = async (status) => {
    try {
      await api.put(`/exams/${examId}/status`, { status });
      setExam(prev => ({ ...prev, status }));
      if(status === 'Completed') fetchLiveStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (sessionId) => {
    try {
      await api.put(`/exams/${examId}/sessions/${sessionId}/approve`);
      fetchLiveStats();
    } catch (err) {
      console.error(err);
      alert('Failed to approve student');
    }
  };

  const handlePublishResults = async () => {
    try {
      await api.post(`/results/exam/${examId}/publish`, { isPublished: true });
      alert('Results Published');
    } catch (err) {
      console.error(err);
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await api.get(`/results/exam/${examId}/export-excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LiveResults_${exam?.examCode || 'Export'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download excel', err);
    }
  };

  const filteredStudents = students.filter(s => 
    s.rollNumber.toLowerCase().includes(search.toLowerCase()) || 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Waiting': return 'info';
      case 'Active': return 'success';
      case 'Submitted': return 'primary';
      case 'AutoSubmitted': return 'secondary';
      case 'Disconnected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="#0f172a">
            Live Monitoring
          </Typography>
          <Typography variant="body2" color="#64748b">
            {exam?.title} ({exam?.examCode})
          </Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button variant="outlined" onClick={() => navigate('/admin/exams')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}>Back</Button>
          {exam?.status !== 'Active' && exam?.status !== 'Completed' && (
            <Button variant="contained" color="success" onClick={() => handleStatusChange('Active')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}>Start Exam</Button>
          )}
          {exam?.status === 'Active' && (
            <Button variant="contained" color="error" onClick={() => handleStatusChange('Completed')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}>End Exam</Button>
          )}
          <Button variant="outlined" color="primary" onClick={downloadExcel} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}>Export</Button>
          <Button variant="contained" color="secondary" onClick={handlePublishResults} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}>Publish Results</Button>
        </Box>
      </Box>

      {/* Stats Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={9}>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={4} md={2.4}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff', borderTop: '4px solid #3b82f6' }}>
                <Typography color="#64748b" variant="caption" fontWeight="700">WAITING</Typography>
                <Typography variant="h4" fontWeight="900" color="#0f172a" mt={0.5}>{stats.waiting}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f0fdf4', borderTop: '4px solid #10b981' }}>
                <Typography color="#166534" variant="caption" fontWeight="700">ACTIVE</Typography>
                <Typography variant="h4" fontWeight="900" color="#15803d" mt={0.5}>{stats.active}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff', borderTop: '4px solid #6366f1' }}>
                <Typography color="#64748b" variant="caption" fontWeight="700">SUBMITTED</Typography>
                <Typography variant="h4" fontWeight="900" color="#0f172a" mt={0.5}>{stats.submitted}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fffbeb', borderTop: '4px solid #f59e0b' }}>
                <Typography color="#92400e" variant="caption" fontWeight="700">AUTO-SUBMITTED</Typography>
                <Typography variant="h4" fontWeight="900" color="#b45309" mt={0.5}>{stats.autoSubmitted}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fef2f2', borderTop: '4px solid #ef4444' }}>
                <Typography color="#991b1b" variant="caption" fontWeight="700">DISCONNECTED</Typography>
                <Typography variant="h4" fontWeight="900" color="#b91c1c" mt={0.5}>{stats.disconnected}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} lg={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" fontWeight="800" color="#0f172a" mb={2}>Recent Violations (Live)</Typography>
            <Box flex={1} overflow="auto" maxHeight={150}>
              {recentViolations.length === 0 ? (
                <Typography variant="body2" color="#64748b" fontStyle="italic">No recent violations.</Typography>
              ) : (
                recentViolations.map((v, i) => (
                  <Box key={i} mb={1} pb={1} borderBottom="1px solid #f1f5f9" onClick={() => navigate(`/admin/sessions?examId=${examId}&search=${v.rollNumber}`)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}>
                    <Typography variant="caption" fontWeight="bold" color="#ef4444">{v.type}</Typography>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="#0f172a">{v.studentName} ({v.rollNumber})</Typography>
                      <Typography variant="caption" color="#64748b">{v.time.toLocaleTimeString()}</Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Box p={2} borderBottom="1px solid #e2e8f0" bgcolor="#f8fafc">
          <TextField
            variant="outlined"
            placeholder="Search by Roll Number or Name..."
            size="small"
            sx={{ width: 300, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Violations</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Join Time</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#64748b' }}>No students found.</TableCell></TableRow>}
              {filteredStudents.map((student, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>
                    <Typography fontWeight="700" color="#0f172a">{student.name}</Typography>
                    <Typography variant="caption" color="#64748b">{student.rollNumber}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={student.status} size="small" color={getStatusColor(student.status)} sx={{ fontWeight: 'bold', borderRadius: 1.5 }} />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${student.violationCount} Violations`} 
                      size="small" 
                      color={student.violationCount > 0 ? 'error' : 'default'} 
                      variant={student.violationCount > 0 ? 'filled' : 'outlined'} 
                      sx={{ fontWeight: 'bold', borderRadius: 1.5 }} 
                    />
                  </TableCell>
                  <TableCell>
                    {student.joinTime ? new Date(student.joinTime).toLocaleTimeString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {student.status === 'Waiting' && exam?.status === 'Active' && (
                      <Button size="small" variant="contained" color="success" onClick={() => handleApprove(student.sessionId)}>Allow Entry</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
};

export default LiveMonitoring;
