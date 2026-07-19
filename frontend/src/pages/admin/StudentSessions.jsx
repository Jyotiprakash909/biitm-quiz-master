import React, { useEffect, useState } from 'react';
import { 
  Typography, Box, Paper, Grid, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, CircularProgress, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, ListItemIcon, Tooltip
} from '@mui/material';
import { 
  History as HistoryIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../services/api';

const StudentSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/sessions');
      setSessions(data);
    } catch (err) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleOpenTimeline = (session) => {
    setSelectedSession(session);
  };

  const handleCloseTimeline = () => {
    setSelectedSession(null);
  };

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return '#3b82f6';
      case 'Submitted': return '#10b981';
      case 'AutoSubmitted': return '#f59e0b';
      case 'Disconnected': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="#0f172a">Student Sessions</Typography>
          <Typography variant="body2" color="#64748b">Monitor all student activities and sessions globally.</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Exam</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Violations</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>IP / Device</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="right">Timeline</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s._id} hover>
                  <TableCell>
                    <Typography fontWeight="700" color="#0f172a">{s.studentId?.name || 'Unknown'}</Typography>
                    <Typography variant="caption" color="#64748b">{s.studentId?.rollNumber}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="700" color="#0f172a">{s.examId?.examCode}</Typography>
                    <Typography variant="caption" color="#64748b">{s.examId?.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={s.status} size="small" sx={{ bgcolor: getStatusColor(s.status), color: 'white', fontWeight: 'bold', borderRadius: 1.5 }} />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${s.violationCount} Violations`} 
                      size="small" 
                      color={s.violationCount > 0 ? 'error' : 'default'} 
                      variant={s.violationCount > 0 ? 'filled' : 'outlined'} 
                      sx={{ fontWeight: 'bold', borderRadius: 1.5 }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="#475569">{s.ipAddress || 'N/A'}</Typography>
                    <Typography variant="caption" color="#94a3b8" sx={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.browserInfo || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Activity Timeline">
                      <IconButton color="primary" onClick={() => handleOpenTimeline(s)}>
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No sessions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Timeline Dialog */}
      <Dialog open={!!selectedSession} onClose={handleCloseTimeline} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', pb: 2 }}>
          Activity Timeline
          {selectedSession && (
            <Typography variant="body2" color="#64748b" display="block">
              {selectedSession.studentId?.name} - {selectedSession.examId?.examCode}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List>
            {selectedSession?.activityTimeline?.length > 0 ? (
              selectedSession.activityTimeline.map((item, index) => (
                <ListItem key={index} divider={index < selectedSession.activityTimeline.length - 1}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.event.includes('Violation') ? <WarningIcon color="error" /> : <HistoryIcon color="primary" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.event} 
                    secondary={new Date(item.timestamp).toLocaleString()} 
                    primaryTypographyProps={{ fontWeight: 'bold', color: item.event.includes('Violation') ? 'error.main' : 'text.primary' }}
                  />
                </ListItem>
              ))
            ) : (
              <Box p={4} textAlign="center">
                <Typography color="textSecondary">No timeline events recorded.</Typography>
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={handleCloseTimeline} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentSessions;
