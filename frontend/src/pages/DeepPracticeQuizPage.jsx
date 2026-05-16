import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineChartBar, HiOutlineClock, HiOutlineEye, HiOutlineLockClosed } from 'react-icons/hi';
import DeepPracticeQuizRunner from '../components/DeepPracticeQuizRunner';
import { getDeepPracticeAttempt, listMyDeepPracticeAttempts } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function DeepPracticeQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isEnrolled } = useAuth();
  const [meta, setMeta] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [selectedAttemptLoading, setSelectedAttemptLoading] = useState(null);

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

  const fetchAttempts = async () => {
    if (!isAuthenticated || !quizId) return;
    try {
      setAttemptsLoading(true);
      const res = await listMyDeepPracticeAttempts(quizId);
      setAttempts(res.data);
    } catch {
      setAttempts([]);
    } finally {
      setAttemptsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [isAuthenticated, quizId]);

  const openAttemptReview = async (attemptId) => {
    try {
      setSelectedAttemptLoading(attemptId);
      const res = await getDeepPracticeAttempt(attemptId);
      setSelectedAttempt(res.data);
    } catch (err) {
      console.error('[DGNL] Failed to load deep-practice attempt:', err);
    } finally {
      setSelectedAttemptLoading(null);
    }
  };

  const startNewAttempt = () => {
    setSelectedAttempt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    <>
      {isAuthenticated && attempts.length > 0 && !selectedAttempt && (
        <div className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineChartBar className="h-4 w-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Lịch sử luyện quiz này ({attempts.length})
                </h3>
                {attemptsLoading && (
                  <div className="ml-auto w-3 h-3 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {attempts.slice(0, 10).map((attempt) => (
                  <div key={attempt.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-700/40 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-gray-700 dark:text-gray-200">
                        {attempt.correct_count}/{attempt.total_questions}
                        <span className="ml-2 text-gray-400">· {attempt.score_percent}%</span>
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                        <HiOutlineClock className="h-3 w-3" />
                        {new Date(attempt.submitted_at).toLocaleString('vi-VN')}
                        <span className="ml-2">· {attempt.correct_count}✓ {attempt.wrong_count}✗ {attempt.unanswered_count}∅</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAttemptReview(attempt.id)}
                      disabled={selectedAttemptLoading === attempt.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-[11px] font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
                    >
                      <HiOutlineEye className="h-3.5 w-3.5" />
                      {selectedAttemptLoading === attempt.id ? 'Đang mở...' : 'Xem lại'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <DeepPracticeQuizRunner
        key={selectedAttempt ? `review-${selectedAttempt.id}` : `new-${quizId}`}
        quiz={quiz}
        meta={meta}
        reviewAttempt={selectedAttempt}
        onBack={selectedAttempt ? () => setSelectedAttempt(null) : () => navigate('/luyen-tap-chuyen-sau')}
        onStartNew={startNewAttempt}
        onAttemptSaved={fetchAttempts}
      />
    </>
  );
}
