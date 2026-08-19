import React, { useEffect, useState } from 'react';
import { Typography, Grid, Card, CardContent, Box, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton } from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import {
  LibraryBooks as ExamIcon,
  People as StudentIcon,
  Warning as ViolationIcon,
  EmojiEvents as PassIcon,
  TrendingUp as TrendUpIcon,
  AccessTime as TimeIcon,
  CheckCircle as CompletedIcon,
  AutoAwesome as AutoIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data);
        setError('');
      } catch (err) {
        setError('Failed to fetch dashboard statistics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5, minHeight: '100vh', alignItems: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  if (!stats) return null;

  const statCards = [
    { title: 'Total Exams', value: stats.totalExams, icon: <ExamIcon />, color: '#3b82f6', bg: '#eff6ff' },
    { title: 'Active Exams', value: stats.activeExams, icon: <TimeIcon />, color: '#10b981', bg: '#ecfdf5' },
    { title: 'Completed Exams', value: stats.completedExams, icon: <CompletedIcon />, color: '#8b5cf6', bg: '#f5f3ff' },
    { title: 'Registered Students', value: stats.totalStudents, icon: <StudentIcon />, color: '#f59e0b', bg: '#fffbeb' },
    { title: 'Violations Today', value: stats.totalViolations || 0, icon: <ViolationIcon />, color: '#ef4444', bg: '#fef2f2' },
    { title: 'Auto Submissions', value: stats.autoSubmittedCount || 0, icon: <AutoIcon />, color: '#ec4899', bg: '#fdf2f8' },
    { title: 'Avg Pass Rate', value: `${stats.overallPassRate}%`, icon: <PassIcon />, color: '#14b8a6', bg: '#f0fdfa' },
    { title: 'Average Score', value: `${stats.overallAverageScore}%`, icon: <TrendUpIcon />, color: '#06b6d4', bg: '#ecfeff' },
  ];

  return (
    <Box sx={{ maxWidth: 1600, margin: '0 auto', pb: 8 }}>
      <Typography variant="h4" fontWeight="800" color="#0f172a" sx={{ mb: 1, letterSpacing: '-0.5px' }}>
        Dashboard Overview
      </Typography>
      <Typography variant="body2" color="#64748b" sx={{ mb: 4 }}>
        Real-time metrics and analytics across all examination sessions.
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                border: '1px solid #e2e8f0', 
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
                  borderColor: '#cbd5e1'
                }
              }}
            >
              <Box>
                <Typography color="#64748b" variant="subtitle2" fontWeight="700" sx={{ mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant="h4" fontWeight="900" color="#0f172a">
                  {card.value}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: card.bg, color: card.color, display: 'flex' }}>
                {card.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        
        {/* Pass vs Fail Ratio */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="800" color="#1e293b" mb={2}>Pass vs Fail Overall</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData?.passVsFail || []}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(stats.chartData?.passVsFail || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Live Session Status */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="800" color="#1e293b" mb={2}>Live Session Status</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData?.liveStatus || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                    {(stats.chartData?.liveStatus || []).map((entry, index) => {
                       let color = '#3b82f6';
                       if (entry.name === 'Active') color = '#10b981';
                       if (entry.name === 'Submitted') color = '#8b5cf6';
                       if (entry.name === 'Disconnected') color = '#ef4444';
                       return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Violation Analytics */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="800" color="#1e293b" mb={2}>Violation Analytics by Exam</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData?.violationTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorVio)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

      </Grid>

      {/* System Activity */}
      <Typography variant="h5" fontWeight="800" color="#0f172a" sx={{ mb: 3, mt: 6, letterSpacing: '-0.5px' }}>
        Recent Activity
      </Typography>

      <Grid container spacing={4}>
        {/* Recent Exams */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 0, borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle1" fontWeight="700" color="#1e293b">Recent Exams</Typography>
            </Box>
            <Table size="small">
              <TableBody>
                {(stats.recentExams || []).map(exam => (
                  <TableRow key={exam._id} hover>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                      <Typography variant="body2" fontWeight="600" color="#334155">{exam.title}</Typography>
                      <Typography variant="caption" color="textSecondary">{exam.examCode}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                      <Chip label={exam.status} size="small" sx={{ height: 20, fontSize: '0.65rem' }} color={exam.status === 'Active' ? 'error' : 'default'} />
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats.recentExams || stats.recentExams.length === 0) && (
                  <TableRow><TableCell colSpan={2} align="center"><Typography variant="body2" color="textSecondary" py={2}>No recent exams</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Recent Submissions */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 0, borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle1" fontWeight="700" color="#1e293b">Recent Submissions</Typography>
            </Box>
            <Table size="small">
              <TableBody>
                {(stats.recentSubmissions || []).map(sub => (
                  <TableRow key={sub._id} hover>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                      <Typography variant="body2" fontWeight="600" color="#334155">{sub.studentId?.name || 'Unknown'}</Typography>
                      <Typography variant="caption" color="textSecondary">{sub.examId?.title}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                      <Typography variant="body2" fontWeight="700" color="primary">{sub.marksObtained}/{sub.totalMarks}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats.recentSubmissions || stats.recentSubmissions.length === 0) && (
                  <TableRow><TableCell colSpan={2} align="center"><Typography variant="body2" color="textSecondary" py={2}>No recent submissions</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Recent Violations */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 0, borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              <Typography variant="subtitle1" fontWeight="700" color="#b91c1c">Recent Violations</Typography>
            </Box>
            <Table size="small">
              <TableBody>
                {(stats.recentViolations || []).map(vio => (
                  <TableRow key={vio._id} hover>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                      <Typography variant="body2" fontWeight="600" color="#334155">{vio.studentId?.name || 'Unknown'}</Typography>
                      <Typography variant="caption" color="textSecondary">{vio.examId?.title}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                      <Chip label={`${vio.violationCount} Violations`} size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats.recentViolations || stats.recentViolations.length === 0) && (
                  <TableRow><TableCell colSpan={2} align="center"><Typography variant="body2" color="textSecondary" py={2}>No recent violations</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
