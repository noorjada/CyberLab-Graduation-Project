import React, { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useBlocker,
  useLocation,
  Outlet,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ExamProvider, useExam } from './context/ExamContext';
import Navbar from './components/Navbar';
import Onboarding from './components/Onboarding/Onboarding';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Challenges from './pages/Challenges/Challenges';
import Profile from './pages/Profile/Profile';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import PrivateRoute from './components/PrivateRoute';
import StaffRoute from './components/StaffRoute';
import Admin from './pages/Admin/Admin';
import ChallengeBuilder from './pages/ChallengeBuilder/ChallengeBuilder';
import LabBuilder from './pages/LabBuilder/LabBuilder';
import PracticeExams from './pages/PracticeExams/PracticeExams';
import LearningNotes from './pages/LearningNotes/LearningNotes';
import Roadmap from './pages/Roadmap/Roadmap';
import TerminalPage from './pages/Terminal/Terminal';
import ChatBot from './components/ChatBot';
import Daily from './pages/Daily/Daily';
import Recon from './pages/Recon/Recon';
import './App.css';
import VirusTotalPage from './pages/VirusTotal/VirusTotal';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import VerifyEmail from './pages/VerifyEmail/VerifyEmail';
import Labs from './pages/Labs/Labs';
import Exploits from './pages/Exploits/Exploits';
import Certificates from './pages/Certificates/Certificates';
import CertVerify from './pages/CertVerify/CertVerify';
import Events from './pages/Events/Events';
import Classrooms from './pages/Classrooms/Classrooms';
import OAuthCallback from './pages/OAuthCallback/OAuthCallback';
import SOCAssistant from './pages/SOCAssistant/SOCAssistant';
import Reference from './pages/Reference/Reference';
import StudyPlans from './pages/StudyPlans/StudyPlans';
import CoursePage from './pages/Courses/CoursePage';
import api from './utils/api';
import './components/ExamSafeBrowser/ExamSafeBrowser.css';

function ExamRouteGuard() {
  const { inExam, session } = useExam();
  const location = useLocation();

  if (inExam && location.pathname !== '/exams') {
    const target = session?.slug ? `/exams?open=${encodeURIComponent(session.slug)}` : '/exams';
    return <Navigate to={target} replace />;
  }
  return null;
}

function AppLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { inExam, session, exitExam, syncSession } = useExam();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      inExam && currentLocation.pathname === '/exams' && nextLocation.pathname !== '/exams'
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    const leave = window.confirm(
      'You have an active practice exam. Leaving /exams ends your session without submitting. Continue?'
    );
    if (leave) {
      const examId = session?.examId;
      (async () => {
        if (examId) {
          try {
            await api.post(`/exams/${examId}/abandon`);
          } catch { /* ignore */ }
        }
        exitExam();
        await syncSession();
        blocker.proceed();
      })();
    } else {
      blocker.reset();
    }
  }, [blocker, inExam, session?.examId, exitExam, syncSession]);

  return (
    <div className="App">
      <Navbar />
      <div className={`main-content ${user ? '' : 'main-content--guest'} ${inExam ? 'main-content--exam' : ''}`}>
        <ExamRouteGuard />
        <Outlet />
        <ToastContainer position="top-right" autoClose={3000} theme={theme} />
        {!inExam && <ChatBot />}
        {!inExam && <Onboarding />}
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/labs', element: <PrivateRoute><Labs /></PrivateRoute> },
      { path: '/verify-email/:token', element: <VerifyEmail /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password/:token', element: <ResetPassword /> },
      { path: '/oauth/callback', element: <OAuthCallback /> },
      { path: '/virustotal', element: <PrivateRoute><VirusTotalPage /></PrivateRoute> },
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/dashboard', element: <PrivateRoute><Dashboard /></PrivateRoute> },
      { path: '/challenges', element: <PrivateRoute><Challenges /></PrivateRoute> },
      { path: '/profile', element: <PrivateRoute><Profile /></PrivateRoute> },
      { path: '/leaderboard', element: <PrivateRoute><Leaderboard /></PrivateRoute> },
      { path: '/roadmap', element: <PrivateRoute><Roadmap /></PrivateRoute> },
      { path: '/study-plans', element: <PrivateRoute><StudyPlans /></PrivateRoute> },
      { path: '/study-plans/:slug', element: <PrivateRoute><StudyPlans /></PrivateRoute> },
      { path: '/terminal', element: <PrivateRoute><TerminalPage /></PrivateRoute> },
      { path: '/daily', element: <PrivateRoute><Daily /></PrivateRoute> },
      { path: '/recon', element: <PrivateRoute><Recon /></PrivateRoute> },
      { path: '/exploits', element: <PrivateRoute><Exploits /></PrivateRoute> },
      { path: '/certificates', element: <PrivateRoute><Certificates /></PrivateRoute> },
      { path: '/exams', element: <PrivateRoute><PracticeExams /></PrivateRoute> },
      { path: '/notes', element: <PrivateRoute><LearningNotes /></PrivateRoute> },
      { path: '/reference', element: <PrivateRoute><Reference /></PrivateRoute> },
      { path: '/reference/:slug', element: <PrivateRoute><Reference /></PrivateRoute> },
      { path: '/events', element: <PrivateRoute><Events /></PrivateRoute> },
      { path: '/classrooms', element: <PrivateRoute><Classrooms /></PrivateRoute> },
      { path: '/courses/:id', element: <PrivateRoute><CoursePage /></PrivateRoute> },
      { path: '/soc', element: <PrivateRoute><SOCAssistant /></PrivateRoute> },
      { path: '/verify/:certId', element: <CertVerify /> },
      { path: '/admin', element: <StaffRoute adminOnly><Admin /></StaffRoute> },
      { path: '/builder', element: <StaffRoute><ChallengeBuilder /></StaffRoute> },
      { path: '/lab-builder', element: <StaffRoute adminOnly><LabBuilder /></StaffRoute> },
      { path: '*', element: <Navigate to="/" /> },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </ExamProvider>
    </AuthProvider>
  );
}

export default App;
