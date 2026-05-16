import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlineStar,
} from 'react-icons/hi';
import DeepPracticeGuide from '../components/DeepPracticeGuide';
import { listMyDeepPracticeAttempts } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const SUBJECT_COLORS = {
  'Tiếng Việt': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'Tiếng Anh': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  'Toán': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  'Tư duy khoa học': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

const getBestScore = (quizId) => {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(`deep-practice-best:${quizId}`) || 0);
};

export default function DeepPractice() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('Tất cả');
  const [bestAttemptByQuiz, setBestAttemptByQuiz] = useState({});
  const { isEnrolled, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const [indexData, attempts] = await Promise.all([
          fetch('/deep-practice/index.json', { cache: 'no-store' }).then((res) => {
            if (!res.ok) throw new Error('Không tải được danh sách quiz');
            return res.json();
          }),
          isAuthenticated ? listMyDeepPracticeAttempts().then((res) => res.data).catch(() => []) : Promise.resolve([]),
        ]);

        const nextBestAttemptByQuiz = {};
        attempts.forEach((attempt) => {
          const currentBest = nextBestAttemptByQuiz[attempt.quiz_id];
          if (currentBest === undefined || attempt.score_percent > currentBest) {
            nextBestAttemptByQuiz[attempt.quiz_id] = attempt.score_percent;
          }
        });

        if (isActive) {
          setQuizzes(indexData.filter((quiz) => quiz.isPublished));
          setBestAttemptByQuiz(nextBestAttemptByQuiz);
        }
      } catch {
        if (isActive) {
          setQuizzes([]);
          setBestAttemptByQuiz({});
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  const subjects = useMemo(() => (
    ['Tất cả', ...Array.from(new Set(quizzes.map((quiz) => quiz.subject).filter(Boolean)))]
  ), [quizzes]);

  const filteredQuizzes = useMemo(() => (
    activeSubject === 'Tất cả'
      ? quizzes
      : quizzes.filter((quiz) => quiz.subject === activeSubject)
  ), [activeSubject, quizzes]);

  const stats = useMemo(() => {
    const freeCount = quizzes.filter((quiz) => quiz.isFree).length;
    const premiumCount = quizzes.length - freeCount;
    const questionCount = quizzes.reduce((sum, quiz) => sum + (quiz.totalQuestions || 0), 0);
    return { freeCount, premiumCount, questionCount };
  }, [quizzes]);

  const openQuiz = (quiz) => {
    if (quiz.isFree || isEnrolled) {
      navigate(`/luyen-tap-chuyen-sau/${quiz.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <section className="bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 dark:from-slate-950 dark:via-cyan-950 dark:to-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-semibold mb-5">
                <HiOutlineStar className="h-4 w-4 text-yellow-300" /> Quiz ngắn theo từng chuyên đề
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
                Luyện tập chuyên sâu theo dạng bài
              </h1>
              <p className="text-lg text-white/80 leading-relaxed max-w-2xl mb-8">
                Làm các bộ câu hỏi trắc nghiệm theo từng phần như Tiếng Việt, Tiếng Anh, Toán và phân tích số liệu.
                Có quiz miễn phí để trải nghiệm và quiz nâng cao dành riêng cho học viên.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#quiz-list"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-bold hover:bg-gray-50 transition-colors shadow-lg shadow-black/10"
                >
                  Bắt đầu luyện miễn phí <HiOutlineArrowRight className="h-5 w-5" />
                </a>
                <Link
                  to="/dang-ky"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors"
                >
                  Mở khóa toàn bộ quiz
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Quiz miễn phí', value: stats.freeCount, icon: HiOutlineStar },
                { label: 'Quiz học viên', value: stats.premiumCount, icon: HiOutlineLockClosed },
                { label: 'Câu hỏi', value: stats.questionCount, icon: HiOutlineDocumentText },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-4 text-center">
                  <item.icon className="h-6 w-6 text-white/80 mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-white">{item.value}</p>
                  <p className="text-xs text-white/70">{item.label}</p>
                </div>
              ))}
              <div className="col-span-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-5">
                <p className="text-sm font-bold text-white mb-2">Gợi ý tăng điểm</p>
                <p className="text-sm text-white/75 leading-relaxed">
                  Dùng quiz chuyên sâu để tìm lỗ hổng nhỏ, sau đó học bài giảng tương ứng và kiểm tra lại bằng đề thực chiến.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <DeepPracticeGuide />

        <section id="quiz-list" className="scroll-mt-24">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách quiz chuyên sâu</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Chọn một phần nhỏ để luyện ngay. Quiz miễn phí giúp học sinh mới trải nghiệm trước khi đăng ký.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => setActiveSubject(subject)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    activeSubject === subject
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-10 text-center">
              <p className="text-4xl mb-3">🧩</p>
              <p className="text-gray-500 dark:text-gray-400">Chưa có quiz cho phần này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredQuizzes.map((quiz) => {
                const canAccess = quiz.isFree || isEnrolled;
                const bestScore = bestAttemptByQuiz[quiz.id] ?? getBestScore(quiz.id);
                return (
                  <article
                    key={quiz.id}
                    onClick={() => openQuiz(quiz)}
                    className={`group relative rounded-2xl border bg-white dark:bg-slate-800 p-5 transition-all ${
                      canAccess
                        ? 'cursor-pointer border-gray-100 dark:border-slate-700 hover:border-cyan-200 dark:hover:border-cyan-700 hover:shadow-md'
                        : 'border-gray-100 dark:border-slate-700 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${SUBJECT_COLORS[quiz.subject] || 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                        {quiz.subject}
                      </span>
                      {quiz.isFree ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          <HiOutlineStar className="h-3.5 w-3.5" /> Miễn phí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">
                          <HiOutlineLockClosed className="h-3.5 w-3.5" /> Học viên
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                      {quiz.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <HiOutlineBookOpen className="h-3.5 w-3.5" /> {quiz.skill}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <HiOutlineClock className="h-3.5 w-3.5" /> {quiz.timeMinutes} phút
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <HiOutlineChartBar className="h-3.5 w-3.5" /> {quiz.totalQuestions} câu
                      </span>
                    </div>

                    {bestScore > 0 && (
                      <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/40 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Điểm tốt nhất{bestAttemptByQuiz[quiz.id] !== undefined ? '' : ' trên thiết bị này'}: {bestScore}%
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{quiz.level}</span>
                      {canAccess ? (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                          Vào luyện <HiOutlineArrowRight className="h-4 w-4" />
                        </span>
                      ) : (
                        <Link
                          to="/dang-ky"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400"
                        >
                          Đăng ký để mở <HiOutlineArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {!isAuthenticated && (
          <div className="mt-10 rounded-2xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 p-6 text-center">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              Đăng nhập Google để website ghi nhớ quyền học viên và mở quiz nâng cao sau khi đăng ký khóa học.
            </p>
            <Link
              to="/dang-ky"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
            >
              Xem quyền lợi khóa học <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
