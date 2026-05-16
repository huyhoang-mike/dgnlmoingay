import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineLockClosed } from 'react-icons/hi';
import DeepPracticeQuizRunner from '../components/DeepPracticeQuizRunner';
import { useAuth } from '../contexts/AuthContext';

export default function DeepPracticeQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { isEnrolled } = useAuth();
  const [meta, setMeta] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadQuiz() {
      try {
        const indexRes = await fetch('/deep-practice/index.json', { cache: 'no-store' });
        if (!indexRes.ok) throw new Error('Không tải được danh sách quiz');
        const index = await indexRes.json();
        const foundMeta = index.find((item) => item.id === quizId && item.isPublished);
        if (!foundMeta) throw new Error('Không tìm thấy quiz');

        if (!isActive) return;
        setMeta(foundMeta);

        if (!foundMeta.isFree && !isEnrolled) {
          setLocked(true);
          return;
        }

        const filePath = foundMeta.file.startsWith('/') ? foundMeta.file : `/deep-practice/${foundMeta.file}`;
        const quizRes = await fetch(filePath, { cache: 'no-store' });
        if (!quizRes.ok) throw new Error('Không tải được nội dung quiz');
        const data = await quizRes.json();
        if (isActive) setQuiz(data);
      } catch (err) {
        if (isActive) setError(err.message || 'Có lỗi xảy ra');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadQuiz();

    return () => {
      isActive = false;
    };
  }, [isEnrolled, quizId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Đang tải quiz...</p>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="max-w-md text-center rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <HiOutlineLockClosed className="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quiz dành cho học viên</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-2">{meta?.title}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            Đăng ký khóa học để mở toàn bộ quiz chuyên sâu, bài giảng nền tảng và đề thi thực chiến.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/dang-ky"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors"
            >
              Đăng ký ngay <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => navigate('/luyen-tap-chuyen-sau')}
              className="px-5 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Xem quiz miễn phí
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="max-w-md text-center">
          <p className="text-5xl mb-4">😵</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lỗi</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/luyen-tap-chuyen-sau')}
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            Quay lại danh sách quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <DeepPracticeQuizRunner
      quiz={quiz}
      meta={meta}
      onBack={() => navigate('/luyen-tap-chuyen-sau')}
    />
  );
}
