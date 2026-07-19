import { useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const useAutosave = (examId, studentId) => {
  const socket = useSocket();

  const saveDraft = useCallback((questionId, selectedOption) => {
    if (socket) {
      socket.emit('save_draft', { examId, studentId, questionId, selectedOption });
    }
  }, [socket, examId, studentId]);

  const saveProgress = useCallback((currentIndex) => {
    if (socket) {
      socket.emit('save_progress', { examId, studentId, currentIndex });
    }
  }, [socket, examId, studentId]);

  return { saveDraft, saveProgress };
};

export default useAutosave;
