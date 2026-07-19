import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const useAntiCheat = (examId, studentId, isActive, exam) => {
  const socket = useSocket();
  const blurTimeout = useRef(null);

  useEffect(() => {
    if (!isActive || !socket || !exam) return;

    let heartbeatInterval;

    const reportViolation = (type) => {
      socket.emit('report_violation', { examId, studentId, violationType: type });
      toast.error(`Violation detected: ${type}. Please remain on the exam screen.`, {
        id: 'violation_toast', // Prevent duplicate toasts stacking
        duration: 5000,
      });
    };

    // 1. Visibility Change (Tab Switch / Minimize)
    const handleVisibilityChange = () => {
      if (document.hidden && exam.strictTabSwitch) {
        if (blurTimeout.current) {
          clearTimeout(blurTimeout.current);
          blurTimeout.current = null;
        }
        reportViolation('TabSwitch');
      }
    };

    // 2. Window Blur (App Switch)
    const handleBlur = () => {
      if (document.hidden) return; // Prevent double counting with visibilitychange

      if (exam.strictTabSwitch) {
        blurTimeout.current = setTimeout(() => {
          if (!document.hasFocus() && !document.hidden) {
            reportViolation('AppSwitch');
          }
          blurTimeout.current = null;
        }, 1000);
      }
    };

    const handleFocus = () => {
      if (blurTimeout.current) {
        clearTimeout(blurTimeout.current);
        blurTimeout.current = null;
      }
    };

    // 3. Disable Context Menu
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 4. Disable Copy
    const handleCopy = (e) => {
      if (exam.copyPasteProtection) {
        e.preventDefault();
        reportViolation('CopyAttempt');
      }
    };

    // 5. Fullscreen Exit Detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && exam.strictFullscreen) {
        reportViolation('FullscreenExit');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Heartbeat
    heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', { examId, studentId });
    }, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(heartbeatInterval);
      if (blurTimeout.current) clearTimeout(blurTimeout.current);
    };
  }, [isActive, examId, studentId, socket, exam]);
};

export default useAntiCheat;
