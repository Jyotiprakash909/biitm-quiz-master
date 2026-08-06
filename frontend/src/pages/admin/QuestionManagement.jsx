import React, { useEffect, useState } from 'react';
import { 
  Typography, Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Checkbox, IconButton, Tooltip, Stack
} from '@mui/material';
import { 
  Delete as DeleteIcon, Edit as EditIcon, ArrowUpward as ArrowUpIcon, 
  ArrowDownward as ArrowDownIcon 
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const QuestionManagement = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  
  const [openManual, setOpenManual] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [file, setFile] = useState(null);
  const [bulkErrors, setBulkErrors] = useState([]);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newQ, setNewQ] = useState({ text: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 });

  const fetchQuestions = async () => {
    try {
      const { data } = await api.get(`/exams/${examId}/questions`);
      setQuestions(data);
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
    fetchQuestions();
  }, [examId]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(questions.map(q => q._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleManualSave = async () => {
    try {
      if (!newQ.text || !newQ.correctAnswer || newQ.options.some(o => !o)) {
        alert('Please fill all fields');
        return;
      }
      if (!newQ.options.includes(newQ.correctAnswer)) {
        alert('Correct answer must exactly match one of the options');
        return;
      }

      if (editingId) {
        await api.put(`/exams/${examId}/questions/${editingId}`, newQ);
      } else {
        await api.post(`/exams/${examId}/questions`, newQ);
      }

      setOpenManual(false);
      setEditingId(null);
      setNewQ({ text: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 });
      fetchQuestions();
    } catch (err) {
      console.error(err);
      alert('Failed to save question');
    }
  };

  const handleEditClick = (q) => {
    setNewQ({ text: q.text, options: q.options, correctAnswer: q.correctAnswer, marks: q.marks });
    setEditingId(q._id);
    setOpenManual(true);
  };

  const handleBulkUpload = async () => {
    if (!file) return;
    setBulkErrors([]);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/exams/${examId}/questions/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setOpenBulk(false);
      setFile(null);
      fetchQuestions();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        // Split errors by newline if it's our formatted error string
        const errorMsg = err.response.data.message;
        setBulkErrors(errorMsg.split('\n'));
      } else {
        setBulkErrors(['Failed to upload Excel']);
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`/exams/${examId}/questions/template`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'QuestionTemplate.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download template', err);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/exams/${examId}/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if(!window.confirm(`Delete ${selectedIds.length} questions?`)) return;
    try {
      await api.post(`/exams/${examId}/questions/bulk-delete`, { questionIds: selectedIds });
      setSelectedIds([]);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReorder = async (currentIndex, direction) => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
    
    // Swap
    const temp = newQuestions[currentIndex];
    newQuestions[currentIndex] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;
    
    setQuestions(newQuestions);
    
    // Save to backend
    try {
      await api.put(`/exams/${examId}/questions/reorder`, { orderedIds: newQuestions.map(q => q._id) });
    } catch (err) {
      console.error(err);
      fetchQuestions(); // Revert on failure
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Manage Questions</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => navigate('/admin/exams')}>Back to Exams</Button>
          <Button variant="contained" color="secondary" onClick={() => setOpenBulk(true)}>
            Upload Excel
          </Button>
          <Button variant="contained" color="primary" onClick={() => {
            setEditingId(null);
            setNewQ({ text: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 });
            setOpenManual(true);
          }}>
            + Add Manual
          </Button>
        </Stack>
      </Box>

      {exam && <Typography variant="h6" color="textSecondary" mb={2}>Exam: {exam.title} ({exam.examCode})</Typography>}

      {selectedIds.length > 0 && (
        <Box mb={2} p={2} bgcolor="error.light" borderRadius={1} display="flex" justifyContent="space-between" alignItems="center">
          <Typography color="error.contrastText">{selectedIds.length} questions selected</Typography>
          <Button variant="contained" color="error" size="small" onClick={handleBulkDelete}>
            Delete Selected
          </Button>
        </Box>
      )}

      <Paper elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell padding="checkbox">
                <Checkbox 
                  checked={questions.length > 0 && selectedIds.length === questions.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < questions.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell width={80}>Q.No</TableCell>
              <TableCell>Question Text</TableCell>
              <TableCell>Correct Answer</TableCell>
              <TableCell align="center">Marks</TableCell>
              <TableCell align="center">Reorder</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>No questions added yet.</TableCell></TableRow>}
            {questions.map((q, idx) => (
              <TableRow key={q._id} hover selected={selectedIds.includes(q._id)}>
                <TableCell padding="checkbox">
                  <Checkbox checked={selectedIds.includes(q._id)} onChange={() => handleSelectOne(q._id)} />
                </TableCell>
                <TableCell><strong>{idx + 1}</strong></TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography noWrap>{q.text}</Typography>
                </TableCell>
                <TableCell>{q.correctAnswer}</TableCell>
                <TableCell align="center">{q.marks}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" disabled={idx === 0} onClick={() => handleReorder(idx, 'up')}>
                    <ArrowUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" disabled={idx === questions.length - 1} onClick={() => handleReorder(idx, 'down')}>
                    <ArrowDownIcon fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton size="small" color="primary" onClick={() => handleEditClick(q)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(q._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Manual Add/Edit Dialog */}
      <Dialog open={openManual} onClose={() => setOpenManual(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editingId ? 'Edit Question' : 'Add Question'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Question Text" value={newQ.text} onChange={e => setNewQ({...newQ, text: e.target.value})} multiline rows={3} />
          <Box display="flex" gap={2} mt={2}>
            {newQ.options.slice(0, 2).map((opt, i) => (
              <TextField key={i} fullWidth margin="dense" label={`Option ${i+1}`} value={opt} onChange={e => {
                const opts = [...newQ.options];
                opts[i] = e.target.value;
                setNewQ({...newQ, options: opts});
              }} />
            ))}
          </Box>
          <Box display="flex" gap={2}>
            {newQ.options.slice(2, 4).map((opt, i) => (
              <TextField key={i+2} fullWidth margin="dense" label={`Option ${i+3}`} value={opt} onChange={e => {
                const opts = [...newQ.options];
                opts[i+2] = e.target.value;
                setNewQ({...newQ, options: opts});
              }} />
            ))}
          </Box>
          <Box display="flex" gap={2} mt={2}>
            <TextField fullWidth margin="dense" label="Correct Answer (Must match an option exactly)" value={newQ.correctAnswer} onChange={e => setNewQ({...newQ, correctAnswer: e.target.value})} />
            <TextField fullWidth margin="dense" type="number" label="Marks" value={newQ.marks} onChange={e => setNewQ({...newQ, marks: Number(e.target.value)})} sx={{ maxWidth: 150 }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenManual(false)}>Cancel</Button>
          <Button onClick={handleManualSave} variant="contained">Save Question</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={openBulk} onClose={() => { setOpenBulk(false); setBulkErrors([]); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Upload Questions via Excel</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" color="textSecondary">
              Please ensure your Excel file has the exact following columns: <br/>
              <strong>Question | Option A | Option B | Option C | Option D | Correct Answer | Marks</strong>
            </Typography>
            <Button variant="outlined" size="small" onClick={handleDownloadTemplate}>Download Template</Button>
          </Box>
          <Box border="1px dashed #ccc" p={3} textAlign="center" borderRadius={1} mb={2}>
            <input type="file" accept=".xlsx" onChange={(e) => { setFile(e.target.files[0]); setBulkErrors([]); }} />
          </Box>
          
          {bulkErrors.length > 0 && (
            <Box bgcolor="error.light" p={2} borderRadius={1} maxHeight="150px" overflow="auto">
              <Typography variant="subtitle2" color="error.contrastText" fontWeight="bold">Validation Errors:</Typography>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#fff', fontSize: '0.85rem' }}>
                {bulkErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpenBulk(false); setBulkErrors([]); }}>Cancel</Button>
          <Button onClick={handleBulkUpload} variant="contained" disabled={!file}>Upload Excel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionManagement;
