import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import ExamManagement from './pages/admin/ExamManagement';
import LiveMonitoring from './pages/admin/LiveMonitoring';
import ResultsAnalytics from './pages/admin/ResultsAnalytics';
import GlobalExamSelector from './pages/admin/GlobalExamSelector';
import QuestionManagement from './pages/admin/QuestionManagement';
import Settings from './pages/admin/Settings';
import QuestionBank from './pages/admin/QuestionBank';
import StudentSessions from './pages/admin/StudentSessions';
import GlobalResultsDashboard from './pages/admin/GlobalResultsDashboard';

// Student Pages
import StudentLayout from './components/student/StudentLayout';
import Entry from './pages/student/Entry';
import Registration from './pages/student/Registration';
import WaitingRoom from './pages/student/WaitingRoom';
import ActiveExam from './pages/student/ActiveExam';
import ResultStatus from './pages/student/ResultStatus';

const ProtectedAdminRoute = ({ children }) => {
  const { admin } = useAuth();
  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#363636', color: '#fff' } }} />
      <Routes>
        {/* Student Routes */}
        <Route path="/" element={<StudentLayout><Entry /></StudentLayout>} />
        <Route path="/register" element={<StudentLayout><Registration /></StudentLayout>} />
        <Route path="/waiting" element={<StudentLayout><WaitingRoom /></StudentLayout>} />
        <Route path="/exam/:examId" element={<StudentLayout disablePadding maxWidth={false}><ActiveExam /></StudentLayout>} />
        <Route path="/result/:examId" element={<StudentLayout><ResultStatus /></StudentLayout>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <ExamManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <QuestionBank />
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/sessions"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <StudentSessions />
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/results"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <GlobalResultsDashboard />
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedAdminRoute>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/exams/:examId/live"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <LiveMonitoring />
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/exams/:examId/questions"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <QuestionManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/results/:examId"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <ResultsAnalytics />
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
