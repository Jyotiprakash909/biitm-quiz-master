import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Paper, Button, Box, Radio, RadioGroup, FormControlLabel, FormControl, Grid, CircularProgress, Alert, LinearProgress, useTheme, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, ThemeProvider, createTheme } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { AccessTime as TimeIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAntiCheat from '../../hooks/useAntiCheat';
import useAutosave from '../../hooks/useAutosave';
import { useSocket } from '../../context/SocketContext';
import { useSettings } from '../../context/SettingsContext';

const ExamTimer = React.memo(({ initialSeconds, onTimeUp, loading, examLoaded }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onTimeUpRef = React.useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (loading || !examLoaded) return;
    if (timeLeft <= 0) {
      onTimeUpRef.current();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, loading, examLoaded]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isTimeCritical = timeLeft < 300; 

  return (
    <Paper 
      elevation={0}
      sx={{ 
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1, 
        borderRadius: 50,
        bgcolor: isTimeCritical ? '#fee2e2' : 'rgba(255,255,255,0.15)',
        color: isTimeCritical ? '#ef4444' : 'inherit',
        border: `1px solid ${isTimeCritical ? '#fca5a5' : 'rgba(255,255,255,0.3)'}`,
        transition: 'all 0.3s ease'
      }}
    >
      {isTimeCritical && <WarningIcon color="inherit" fontSize="small" />}
      {!isTimeCritical && <TimeIcon color="inherit" fontSize="small" />}
      <Typography variant="h6" fontWeight="800" sx={{ fontFamily: '"Roboto Mono", monospace', letterSpacing: '-0.5px' }}>
        {formatTime(timeLeft)}
      </Typography>
    </Paper>
  );
});

const ActiveExam = () => {
  const { settings } = useSettings();
  const { examId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const theme = useTheme();
  
  // Safe local storage retrieval
  const getSessionData = () => {
    try {
      return JSON.parse(localStorage.getItem('studentSession'));
    } catch (e) {
      return null;
    }
  };
  const sessionData = getSessionData();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialTimeLeft, setInitialTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const { saveDraft, saveProgress } = useAutosave(examId, sessionData?.studentId);
  useAntiCheat(examId, sessionData?.studentId, true, exam);

  const dynamicTheme = React.useMemo(() => {
    const examColor = exam?.examThemeColor;
    const settingsColor = settings?.primaryColor;
    if (!examColor && !settingsColor) return theme;
    return createTheme({
      ...theme,
      palette: {
        ...theme.palette,
        primary: {
          main: examColor || settingsColor || theme.palette.primary.main,
        },
      },
    });
  }, [exam?.examThemeColor, settings?.primaryColor, theme]);

  useEffect(() => {
    if (!sessionData) {
      navigate('/');
      return;
    }

    const fetchExamData = async () => {
      try {
        const { data } = await api.get(`/student/exam-data/${examId}?studentId=${sessionData.studentId}`);
        setExam(data.exam);
        setQuestions(data.questions);
        
        if (data.draftAnswers) {
          setAnswers(data.draftAnswers);
        }
        
        if (data.session?.currentQuestionIndex) {
          setCurrentIndex(data.session.currentQuestionIndex);
        }

        // Strict Server-Time based calculation
        const start = new Date(data.session.startTime).getTime();
        const now = new Date().getTime(); // Assuming client time is close to server time. (For strict enterprise, fetch server time)
        const elapsed = Math.floor((now - start) / 1000);
        const totalSeconds = data.exam.durationMinutes * 60;
        let remaining = totalSeconds - elapsed;
        if (remaining < 0) remaining = 0;
        setInitialTimeLeft(remaining);
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 403) {
          toast.error(err.response?.data?.message || 'Access Denied');
          navigate(`/result/${examId}`);
        }
      }
    };

    fetchExamData();
    
    if (socket) {
      socket.emit('student_join', { examId, studentId: sessionData.studentId });
      
      socket.on('force_submit', () => {
        toast.error('Your exam was automatically submitted due to violation limits or time up.', { duration: 8000 });
        navigate(`/result/${examId}`);
      });
    }

    return () => {
      if (socket) socket.off('force_submit');
    }
  }, [examId, navigate, socket]); 


  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        handleNavigate(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handleNavigate(currentIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions.length]);

  const handleNavigate = useCallback((newIndex) => {
    setCurrentIndex(newIndex);
    saveProgress(newIndex);
    if (exam?.displayMode === 'scroll') {
      const element = document.getElementById(`question-${newIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [saveProgress, exam]);

  const handleOptionSelect = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
    saveDraft(qId, val);
  };

  const clearSelection = (qId) => {
    const newAnswers = { ...answers };
    delete newAnswers[qId];
    setAnswers(newAnswers);
    saveDraft(qId, null);
  };

  const requestSubmit = (isAuto = false) => {
    if (isAuto) {
      executeSubmit(true);
    } else {
      setConfirmSubmitOpen(true);
    }
  };

  const executeSubmit = async (isAuto = false) => {
    setConfirmSubmitOpen(false);
    const submitToast = toast.loading('Submitting exam...');
    try {
      await api.post(`/student/submit/${examId}`, { studentId: sessionData.studentId, answers, autoSubmit: isAuto });
      toast.success('Exam submitted successfully!', { id: submitToast });
      navigate(`/result/${examId}`);
    } catch (err) {
      console.error(err);
      toast.error('Error submitting exam. Please check your internet connection.', { id: submitToast });
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f8fafc">
      <CircularProgress size={60} thickness={4} />
    </Box>
  );

  if (!exam || questions.length === 0) return <Alert severity="error">Failed to load exam data.</Alert>;

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  return (
    <ThemeProvider theme={dynamicTheme}>
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 10 }}>
      {/* Sticky Header with Progress Bar */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1100, bgcolor: 'primary.main', color: 'primary.contrastText', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2)' }}>
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ height: 6, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: progressPercentage === 100 ? 'success.light' : 'white' } }} 
        />
        <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
          <Box display="flex" alignItems="center" gap={2}>
            {settings?.institutionLogo && (
              <Box component="img" src={settings.institutionLogo} alt="Logo" sx={{ height: 40, objectFit: 'contain', display: { xs: 'none', sm: 'block' } }} />
            )}
            <Box>
              <Typography variant="h6" fontWeight="800" sx={{ display: { xs: 'none', sm: 'block' }, letterSpacing: '-0.5px' }}>
                {exam.title}
              </Typography>
              <Typography variant="subtitle2" sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.9 }}>
                {exam.examCode} • {answeredCount} / {questions.length} Answered
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ display: { xs: 'block', sm: 'none' } }}>
                {answeredCount}/{questions.length} Done
              </Typography>
            </Box>
          </Box>
          
          <ExamTimer 
            initialSeconds={initialTimeLeft} 
            onTimeUp={() => executeSubmit(true)} 
            loading={loading} 
            examLoaded={!!exam} 
          />
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, margin: '0 auto', p: { xs: 2, md: 3 }, mt: 2 }}>
        <Grid container spacing={4} flexDirection={{ xs: 'column-reverse', md: 'row' }}>
          
          {/* Question Area */}
          <Grid item xs={12} md={8}
            sx={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
            onCopy={e => { e.preventDefault(); e.stopPropagation(); }}
            onCut={e => { e.preventDefault(); e.stopPropagation(); }}
            onSelectStart={e => { e.preventDefault(); e.stopPropagation(); }}
          >
            {exam.displayMode === 'scroll' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {questions.map((q, idx) => (
                  <Paper key={q._id} id={`question-${idx}`} elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="overline" color="primary.main" fontWeight="800" sx={{ fontSize: '0.85rem', letterSpacing: '1px' }}>
                        Question {idx + 1}
                      </Typography>
                      <Paper elevation={0} sx={{ px: 1.5, py: 0.5, bgcolor: '#f8fafc', color: '#64748b', borderRadius: 2, fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                      </Paper>
                    </Box>
                    
                    <Typography variant="h5" sx={{ mb: 4, lineHeight: 1.6, fontWeight: 600, color: '#1e293b' }}>
                      {q.text}
                    </Typography>

                    <FormControl component="fieldset" sx={{ width: '100%', flexGrow: 1 }}>
                      <RadioGroup value={answers[q._id] || ''} onChange={(e) => handleOptionSelect(q._id, e.target.value)}>
                        {q.options.map((opt, oIdx) => {
                          const isSelected = answers[q._id] === opt;
                          return (
                            <Paper 
                              key={oIdx} 
                              elevation={0}
                              sx={{ 
                                mb: 2, p: 0.5, borderRadius: 3,
                                border: `2px solid ${isSelected ? theme.palette.primary.main : '#e2e8f0'}`,
                                bgcolor: isSelected ? `${theme.palette.primary.main}0A` : 'transparent',
                                transition: 'all 0.2s ease', cursor: 'pointer',
                                '&:hover': {
                                  borderColor: isSelected ? theme.palette.primary.main : '#cbd5e1',
                                  bgcolor: isSelected ? `${theme.palette.primary.main}14` : '#f8fafc'
                                }
                              }}
                              onClick={() => handleOptionSelect(q._id, opt)}
                            >
                              <FormControlLabel 
                                value={opt} 
                                control={<Radio color="primary" sx={{ display: 'none' }} />} 
                                label={
                                  <Box display="flex" alignItems="center" width="100%" p={1.5}>
                                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isSelected ? theme.palette.primary.main : '#94a3b8'}`, mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {isSelected && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />}
                                    </Box>
                                    <Typography sx={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? 'primary.dark' : '#334155' }}>
                                      {opt}
                                    </Typography>
                                  </Box>
                                } 
                                sx={{ width: '100%', m: 0 }}
                              />
                            </Paper>
                          )
                        })}
                      </RadioGroup>
                    </FormControl>
                    <Box mt={2} display="flex" justifyContent="flex-end">
                      <Button onClick={() => clearSelection(q._id)} disabled={!answers[q._id]} sx={{ textTransform: 'none', color: '#94a3b8', '&:hover': { bgcolor: 'transparent', color: '#ef4444' } }}>
                        Clear Selection
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #e2e8f0', minHeight: '60vh', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="overline" color="primary.main" fontWeight="800" sx={{ fontSize: '0.85rem', letterSpacing: '1px' }}>
                    Question {currentIndex + 1}
                  </Typography>
                  <Paper elevation={0} sx={{ px: 1.5, py: 0.5, bgcolor: '#f8fafc', color: '#64748b', borderRadius: 2, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    {currentQ.marks} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                  </Paper>
                </Box>
                
                <Typography variant="h5" sx={{ mb: 4, lineHeight: 1.6, fontWeight: 600, color: '#1e293b' }}>
                  {currentQ.text}
                </Typography>

                <FormControl component="fieldset" sx={{ width: '100%', flexGrow: 1 }}>
                  <RadioGroup value={answers[currentQ._id] || ''} onChange={(e) => handleOptionSelect(currentQ._id, e.target.value)}>
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = answers[currentQ._id] === opt;
                      return (
                        <Paper 
                          key={idx} 
                          elevation={0}
                          sx={{ 
                            mb: 2, 
                            p: 0.5, 
                            borderRadius: 3,
                            border: `2px solid ${isSelected ? theme.palette.primary.main : '#e2e8f0'}`,
                            bgcolor: isSelected ? `${theme.palette.primary.main}0A` : 'transparent',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: isSelected ? theme.palette.primary.main : '#cbd5e1',
                              bgcolor: isSelected ? `${theme.palette.primary.main}14` : '#f8fafc'
                            }
                          }}
                          onClick={() => handleOptionSelect(currentQ._id, opt)}
                        >
                          <FormControlLabel 
                            value={opt} 
                            control={<Radio color="primary" sx={{ display: 'none' }} />} 
                            label={
                              <Box display="flex" alignItems="center" width="100%" p={1.5}>
                                <Box 
                                  sx={{ 
                                    width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isSelected ? theme.palette.primary.main : '#94a3b8'}`,
                                    mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                  }}
                                >
                                  {isSelected && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />}
                                </Box>
                                <Typography sx={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? 'primary.dark' : '#334155' }}>
                                  {opt}
                                </Typography>
                              </Box>
                            } 
                            sx={{ width: '100%', m: 0 }}
                          />
                        </Paper>
                      )
                    })}
                  </RadioGroup>
                </FormControl>

                <Box mt={4} pt={4} borderTop="1px solid #f1f5f9" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Button 
                    variant="outlined" 
                    size="large"
                    disabled={currentIndex === 0} 
                    onClick={() => handleNavigate(currentIndex - 1)}
                    sx={{ borderRadius: 3, px: 4, textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#e2e8f0' }}
                  >
                    Previous
                  </Button>
                  
                  <Button 
                    onClick={() => clearSelection(currentQ._id)}
                    disabled={!answers[currentQ._id]}
                    sx={{ textTransform: 'none', color: '#94a3b8', '&:hover': { bgcolor: 'transparent', color: '#ef4444' } }}
                  >
                    Clear Selection
                  </Button>
                  
                  <Button 
                    variant="contained"
                    size="large"
                    onClick={() => {
                      if (currentIndex < questions.length - 1) {
                        handleNavigate(currentIndex + 1);
                      } else {
                        requestSubmit(false);
                      }
                    }}
                    sx={{ borderRadius: 3, px: 6, textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}
                  >
                    {currentIndex === questions.length - 1 ? 'Finish Exam' : 'Next Question'}
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>

          {/* Navigation Grid */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 4, position: { md: 'sticky' }, top: 120, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
              <Typography variant="h6" gutterBottom fontWeight="800" color="#1e293b" mb={3}>
                Question Navigator
              </Typography>
              <Grid container spacing={1.5}>
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q._id];
                  const isCurrent = currentIndex === idx;
                  
                  let bgcolor = 'transparent';
                  let color = '#64748b';
                  let borderColor = '#e2e8f0';

                  if (isCurrent) {
                    bgcolor = 'primary.main';
                    color = 'white';
                    borderColor = 'primary.main';
                  } else if (isAnswered) {
                    bgcolor = '#dcfce7'; // green-100
                    color = '#166534'; // green-800
                    borderColor = '#dcfce7';
                  }

                  return (
                    <Grid item key={idx}>
                      <Box
                        onClick={() => handleNavigate(idx)}
                        sx={{ 
                          width: 42, 
                          height: 42,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 2,
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          bgcolor,
                          color,
                          border: `2px solid ${borderColor}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }
                        }}
                      >
                        {idx + 1}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
              
              <Box mt={5} pt={3} borderTop="1px solid #f1f5f9">
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  size="large" 
                  onClick={() => requestSubmit(false)}
                  sx={{ py: 1.8, borderRadius: 3, textTransform: 'none', fontWeight: 800, fontSize: '1.05rem', boxShadow: 'none', '&:hover': { boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)' } }}
                >
                  Submit Final Answers
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
                  Make sure you have reviewed all questions before submitting.
                </Typography>
              </Box>
            </Paper>
          </Grid>

        </Grid>
      </Box>

      <Dialog open={confirmSubmitOpen} onClose={() => setConfirmSubmitOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Submit Exam</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit the exam? Once submitted, you cannot change your answers.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmSubmitOpen(false)}>Cancel</Button>
          <Button onClick={() => executeSubmit(false)} variant="contained" color="error">
            Confirm Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </ThemeProvider>
  );
};

export default ActiveExam;
