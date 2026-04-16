import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Platform from './pages/Platform';
import Practice from './pages/Practice';
import RealPractice from './pages/RealPractice';
import ExamPage from './pages/ExamPage';
import FreeTrial from './pages/FreeTrial';
import SubjectLessons from './pages/SubjectLessons';
import LessonView from './pages/LessonView';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/dang-ky" element={<Register />} />
        <Route path="/hoc-thu" element={<FreeTrial />} />
        <Route path="/thuc-chien" element={<RealPractice />} />

        {/* Platform - Nền tảng */}
        <Route path="/nen-tang" element={<Platform />} />
        <Route path="/nen-tang/:subject" element={<SubjectLessons category="nentang" />} />

        {/* Practice - Luyện đề */}
        <Route path="/luyen-de" element={<Practice />} />
        <Route path="/luyen-de/:subject" element={<SubjectLessons category="luyende" />} />

        {/* Lesson View */}
        <Route path="/lessons/:lessonId" element={<LessonView />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Exam page - outside Layout (no Navbar/Footer for focus mode) */}
      <Route path="/thuc-chien/:examId" element={<ExamPage />} />
    </Routes>
  );
}

export default App;
