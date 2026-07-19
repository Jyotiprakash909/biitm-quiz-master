import React, { useEffect, useState } from 'react';
import { 
  Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, 
  Paper, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Chip, IconButton, Menu, MenuItem, Tooltip, InputAdornment, Switch, FormControlLabel, Grid, Select, InputLabel, FormControl
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon, Search as SearchIcon, ContentCopy as DuplicateIcon, 
  Archive as ArchiveIcon, Delete as DeleteIcon, Visibility as MonitorIcon, 
  Assessment as ResultsIcon, Edit as EditIcon, QuestionAnswer as QuestionIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [search, setSearch] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  
  const { settings } = useSettings();
  
  const [newExam, setNewExam] = useState({ 
    title: '', subject: '', durationMinutes: 60, passPercentage: 40, examThemeColor: '',
    warningThreshold: 3, 
    strictFullscreen: true, strictTabSwitch: true, copyPasteProtection: true, displayMode: 'single'
  });
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const navigate = useNavigate();

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/exams');
      const activeOrArchived = data.filter(e => !e.isArchived); // Exclude archived if we don't want to show them
      setExams(data);
      setFilteredExams(activeOrArchived);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = exams.filter(e => !e.isArchived && (
      e.title.toLowerCase().includes(term) || 
      e.examCode.toLowerCase().includes(term) ||
      e.subject.toLowerCase().includes(term)
    ));
    setFilteredExams(filtered);
  }, [search, exams]);

  const handleCreateExam = async () => {
    try {
      if (isEditMode) {
        await api.put(`/exams/${newExam._id}`, newExam);
      } else {
        await api.post('/exams', newExam);
      }
      setOpenDialog(false);
      setIsEditMode(false);
      setNewExam({ 
        title: '', subject: '', durationMinutes: settings?.defaultDurationMinutes || 60, passPercentage: settings?.defaultPassPercentage || 40, examThemeColor: settings?.primaryColor || '',
        warningThreshold: 3, 
        strictFullscreen: true, strictTabSwitch: true, copyPasteProtection: true, displayMode: 'single'
      });
      fetchExams();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenEditDialog = () => {
    setIsEditMode(true);
    setNewExam({
      _id: selectedExam._id,
      title: selectedExam.title,
      subject: selectedExam.subject,
      durationMinutes: selectedExam.durationMinutes,
      warningThreshold: selectedExam.warningThreshold,
      strictFullscreen: selectedExam.strictFullscreen,
      strictTabSwitch: selectedExam.strictTabSwitch,
      copyPasteProtection: selectedExam.copyPasteProtection,
      displayMode: selectedExam.displayMode || 'single',
      passPercentage: selectedExam.passPercentage || settings?.defaultPassPercentage || 40,
      examThemeColor: selectedExam.examThemeColor || settings?.primaryColor || ''
    });
    setOpenDialog(true);
    handleCloseMenu();
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/exams/${id}/status`, { status });
      fetchExams();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDuplicate = async () => {
    try {
      await api.post(`/exams/${selectedExam._id}/duplicate`);
      handleCloseMenu();
      fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async () => {
    try {
      await api.put(`/exams/${selectedExam._id}/archive`);
      handleCloseMenu();
      fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/exams/${examToDelete._id}`);
      setDeleteDialog(false);
      setExamToDelete(null);
      fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMenu = (event, exam) => {
    setAnchorEl(event.currentTarget);
    setSelectedExam(exam);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedExam(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Scheduled': return 'default';
      case 'OpenRegistration': return 'info';
      case 'Active': return 'error';
      case 'Completed': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">Exam Management</Typography>
        <Button variant="contained" color="primary" onClick={() => {
          setNewExam({
            title: '', subject: '', durationMinutes: settings?.defaultDurationMinutes || 60, passPercentage: settings?.defaultPassPercentage || 40, examThemeColor: settings?.primaryColor || '',
            warningThreshold: 3, 
            strictFullscreen: true, strictTabSwitch: true, copyPasteProtection: true, displayMode: 'single'
          });
          setIsEditMode(false);
          setOpenDialog(true);
        }}>
          + Create New Exam
        </Button>
      </Box>

      <Box mb={3} display="flex" gap={2}>
        <TextField
          variant="outlined"
          placeholder="Search exams..."
          size="small"
          sx={{ width: 300, bgcolor: 'white' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper elevation={2} sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell fontWeight="bold">Exam Code</TableCell>
              <TableCell fontWeight="bold">Title</TableCell>
              <TableCell fontWeight="bold">Subject</TableCell>
              <TableCell fontWeight="bold">Duration</TableCell>
              <TableCell fontWeight="bold">Status</TableCell>
              <TableCell fontWeight="bold" align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExams.map((exam) => (
              <TableRow key={exam._id} hover>
                <TableCell sx={{ fontWeight: 'bold' }}>{exam.examCode}</TableCell>
                <TableCell>{exam.title}</TableCell>
                <TableCell>{exam.subject}</TableCell>
                <TableCell>{exam.durationMinutes} min</TableCell>
                <TableCell>
                  <Chip label={exam.status} color={getStatusColor(exam.status)} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Questions">
                    <IconButton size="small" color="primary" onClick={() => navigate(`/admin/exams/${exam._id}/questions`)}>
                      <QuestionIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Live Monitor">
                    <IconButton size="small" color="secondary" onClick={() => navigate(`/admin/exams/${exam._id}/live`)}>
                      <MonitorIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Results">
                    <IconButton size="small" color="success" onClick={() => navigate(`/admin/results/${exam._id}`)}>
                      <ResultsIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={(e) => handleOpenMenu(e, exam)}>
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredExams.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No exams found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {selectedExam?.status === 'Scheduled' && (
          <MenuItem onClick={() => { handleStatusChange(selectedExam._id, 'OpenRegistration'); handleCloseMenu(); }}>
            Open Registration
          </MenuItem>
        )}
        {selectedExam?.status === 'OpenRegistration' && (
          <MenuItem sx={{ color: 'error.main' }} onClick={() => { handleStatusChange(selectedExam._id, 'Active'); handleCloseMenu(); }}>
            Start Exam
          </MenuItem>
        )}
        {selectedExam?.status === 'Active' && (
          <MenuItem sx={{ color: 'success.main' }} onClick={() => { handleStatusChange(selectedExam._id, 'Completed'); handleCloseMenu(); }}>
            End Exam
          </MenuItem>
        )}
        <MenuItem onClick={handleOpenEditDialog}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit Exam
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <DuplicateIcon fontSize="small" sx={{ mr: 1 }} /> Duplicate
        </MenuItem>
        <MenuItem onClick={handleArchive}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} /> Archive
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(true); setExamToDelete(selectedExam); handleCloseMenu(); }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Create / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{isEditMode ? 'Edit Exam' : 'Create New Exam'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Title" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} />
          <TextField fullWidth margin="normal" label="Subject" value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth margin="normal" type="number" label="Duration (minutes)" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth margin="normal" type="number" label="Pass Percentage (%)" value={newExam.passPercentage} onChange={e => setNewExam({...newExam, passPercentage: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Question Display Mode</InputLabel>
                <Select value={newExam.displayMode} label="Question Display Mode" onChange={e => setNewExam({...newExam, displayMode: e.target.value})}>
                  <MenuItem value="single">One By One</MenuItem>
                  <MenuItem value="scroll">Scroll Mode</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary" sx={{ ml: 1, mt: 1, display: 'block' }}>Exam Theme Color</Typography>
              <TextField fullWidth margin="dense" type="color" value={newExam.examThemeColor} onChange={e => setNewExam({...newExam, examThemeColor: e.target.value})} />
            </Grid>
          </Grid>
          <Typography variant="subtitle2" mt={2} mb={1} fontWeight="bold">Security & Anti-Cheat Settings</Typography>
          <TextField fullWidth margin="normal" type="number" label="Warning Threshold (Violations before auto-submit)" value={newExam.warningThreshold} onChange={e => setNewExam({...newExam, warningThreshold: e.target.value})} />
          
          <Box mt={2} display="flex" flexDirection="column" gap={1}>
            <FormControlLabel control={<Switch checked={newExam.strictFullscreen} onChange={e => setNewExam({...newExam, strictFullscreen: e.target.checked})} />} label="Enforce Fullscreen Mode" />
            <FormControlLabel control={<Switch checked={newExam.strictTabSwitch} onChange={e => setNewExam({...newExam, strictTabSwitch: e.target.checked})} />} label="Detect Tab Switching" />
            <FormControlLabel control={<Switch checked={newExam.copyPasteProtection} onChange={e => setNewExam({...newExam, copyPasteProtection: e.target.checked})} />} label="Prevent Copy/Paste" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateExam} variant="contained" disabled={!newExam.title || !newExam.subject}>
            {isEditMode ? 'Save Changes' : 'Create Exam'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete exam "{examToDelete?.title}"? This action cannot be undone and will delete all associated questions and submissions.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">Delete Permanently</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ExamManagement;
