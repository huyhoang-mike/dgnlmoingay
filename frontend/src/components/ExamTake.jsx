/**
 * ExamTake Component
 * Full exam-taking experience: timer, question navigation, answer review, grading.
 * Supports MathJax rendering for math questions.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowUp,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlinePlay,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineCloudUpload,
} from 'react-icons/hi';
import { submitExamAttempt } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

// ── Flatten questions from mixed single/passage format ──
function flattenQuestions(rawData) {
  const flat = [];
  let globalIndex = 0;
  let passageCounter = 0;
  for (const item of rawData) {
    if (item.type === 'passage') {
      const pid = passageCounter++;
      (item.questions || []).forEach((q, qi) => {
        flat.push({
          ...q,
          index: globalIndex++,
          subject: item.subject,
          passage: item.passage_content,
          instruction: item.instruction,
          type: 'passage',
          passageId: pid,
          isFirstInPassage: qi === 0,
        });
      });
    } else {
      flat.push({
        ...item,
        index: globalIndex++,
      });
    }
  }
  return flat;
}

function snapshotQuestions(questions) {
  return questions.map((question) => ({
    index: question.index,
    subject: question.subject,
    question: question.question,
    options: question.options || [],
    answer: question.answer,
    explain: question.explain,
    passage: question.passage,
    instruction: question.instruction,
    type: question.type,
    passageId: question.passageId,
    isFirstInPassage: question.isFirstInPassage,
  }));
}

// ── Timer formatting ──
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── MathJax-aware HTML renderer ──
// Replaces \n → <br/> only OUTSIDE $...$ and $$...$$ math blocks
// so that MathJax LaTeX parsing is not broken by injected <br/> tags.
function mathAwareNewlines(text) {
  const segments = [];
  let lastIndex = 0;
  // Match $$...$$ (display) or $...$ (inline) math blocks
  const mathRegex = /\$\$[\s\S]*?\$\$|\$[^$]*?\$/g;
  let match;
  while ((match = mathRegex.exec(text)) !== null) {
    // Non-math text before this match: convert newlines
    const before = text.slice(lastIndex, match.index);
    segments.push(before.replace(/\n/g, '<br/>'));
    // Math block: keep as-is
    segments.push(match[0]);
    lastIndex = match.index + match[0].length;
  }
  // Remaining non-math text after the last match
  segments.push(text.slice(lastIndex).replace(/\n/g, '<br/>'));
  return segments.join('');
}

function MathContent({ text }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([ref.current]).catch(() => {});
    }
  }, [text]);

  if (!text) return null;
  const html = mathAwareNewlines(text);
  return <span ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── Subject color map ──
const SUBJECT_COLORS = {
  'Tiếng Việt': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', fill: 'bg-blue-500' },
  'Tiếng Anh': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', fill: 'bg-emerald-500' },
  'Toán': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', fill: 'bg-orange-500' },
  'Tư duy khoa học': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', fill: 'bg-purple-500' },
};

const getSubjectColor = (subject) => SUBJECT_COLORS[subject] || SUBJECT_COLORS['Toán'];

export default function ExamTake({ examData, examMeta, onBack, onAttemptSaved, reviewAttempt = null, onStartNew }) {
  const { isEnrolled } = useAuth();
  const isReviewMode = Boolean(reviewAttempt);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);

  // Exam states
  const [phase, setPhase] = useState(isReviewMode ? 'submitted' : 'setup'); // setup | running | submitted
  const [customMinutes, setCustomMinutes] = useState(examMeta?.timeMinutes || 150);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  // Persistence: 'idle' | 'saving' | 'saved' | 'error' | 'skipped'
  const [saveStatus, setSaveStatus] = useState(isReviewMode ? 'saved' : 'idle');
  const [saveError, setSaveError] = useState(null);

  const timerRef = useRef(null);
  const questionRefs = useRef({});
  const quizAreaRef = useRef(null);

  // Flatten on load
  useEffect(() => {
    if (reviewAttempt?.meta?.questions?.length) {
      setQuestions(reviewAttempt.meta.questions);
      return;
    }
    if (examData) {
      setQuestions(flattenQuestions(examData));
    }
  }, [examData, reviewAttempt]);

  useEffect(() => {
    if (!reviewAttempt) return;
    setAnswers(reviewAttempt.answers || {});
    setCurrentQ(0);
    setPhase('submitted');
    setRemainingSeconds(0);
    setStartedAt(null);
    setSaveStatus('saved');
    setSaveError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reviewAttempt]);

  // Timer
  useEffect(() => {
    if (phase === 'running' && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Back to top detection
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // MathJax re-render when phase or questions change
  useEffect(() => {
    if (window.MathJax?.typesetPromise) {
      setTimeout(() => window.MathJax.typesetPromise().catch(() => {}), 100);
    }
  }, [phase, currentQ, questions]);

  // ── Actions ──
  const startExam = () => {
    const mins = Math.max(1, Math.min(customMinutes, 300));
    setRemainingSeconds(mins * 60);
    setStartedAt(Date.now());
    setPhase('running');
  };

  const handleAnswer = useCallback((qIndex, option) => {
    if (phase === 'submitted') return;
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  }, [phase]);

  const handleSubmit = useCallback(() => {
    clearInterval(timerRef.current);
    setPhase('submitted');
  }, []);

  const handleReset = () => {
    if (isReviewMode) {
      if (typeof onStartNew === 'function') onStartNew();
      return;
    }
    setAnswers({});
    setCurrentQ(0);
    setPhase('setup');
    setRemainingSeconds(0);
    setStartedAt(null);
    setSaveStatus('idle');
    setSaveError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToQuestion = (idx) => {
    const el = questionRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setCurrentQ(idx);
    }
    setShowMap(false);
  };

  // ── Computed ──
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const pointsPerQ = examMeta?.pointsPerQuestion || 10;
  const maxScore = examMeta?.maxScore || 1200;

  const results = useMemo(() => {
    if (phase !== 'submitted') return null;
    let correct = 0;
    const bySubject = {};
    questions.forEach((q, i) => {
      const sub = q.subject || 'Unknown';
      if (!bySubject[sub]) bySubject[sub] = { total: 0, correct: 0 };
      bySubject[sub].total++;
      if (answers[i] === q.answer) {
        correct++;
        bySubject[sub].correct++;
      }
    });
    return {
      correct,
      wrong: answeredCount - correct,
      unanswered: totalQuestions - answeredCount,
      score: correct * pointsPerQ,
      bySubject,
    };
  }, [phase, answers, questions]);

  const timerWarning = remainingSeconds > 0 && remainingSeconds < 300;
  const timerDanger = remainingSeconds > 0 && remainingSeconds < 60;

  // ── Persist attempt to backend after submit (enrolled users only) ──
  useEffect(() => {
    if (phase !== 'submitted' || !results) return;
    if (saveStatus !== 'idle') return; // already done

    if (isReviewMode) return;

    if (!isEnrolled) {
      setSaveStatus('skipped');
      return;
    }
    const examId = examMeta?.id;
    if (!examId) {
      setSaveStatus('skipped');
      return;
    }

    const timeSpent = startedAt
      ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      : 0;

    const payload = {
      exam_id: examId,
      exam_title: examMeta?.title || null,
      score: results.score,
      max_score: maxScore,
      correct_count: results.correct,
      wrong_count: results.wrong,
      unanswered_count: results.unanswered,
      total_questions: totalQuestions,
      time_spent_seconds: timeSpent,
      // JSON keys must be strings
      answers: Object.fromEntries(
        Object.entries(answers).map(([k, v]) => [String(k), v])
      ),
      meta: {
        bySubject: results.bySubject,
        questions: snapshotQuestions(questions),
      },
    };

    setSaveStatus('saving');
    submitExamAttempt(payload)
      .then((res) => {
        setSaveStatus('saved');
        if (typeof onAttemptSaved === 'function') onAttemptSaved(res.data);
      })
      .catch((err) => {
        setSaveStatus('error');
        setSaveError(err?.response?.data?.detail || 'Không thể lưu kết quả');
      });
  }, [phase, results, isEnrolled, examMeta, maxScore, totalQuestions, answers, startedAt, saveStatus, onAttemptSaved, questions, isReviewMode]);

  // ── Group questions by subject for sections ──
  const subjectGroups = useMemo(() => {
    const groups = [];
    let currentSubject = null;
    let currentGroup = null;
    questions.forEach((q, i) => {
      if (q.subject !== currentSubject) {
        currentSubject = q.subject;
        currentGroup = { subject: q.subject, startIndex: i, questions: [] };
        groups.push(currentGroup);
      }
      currentGroup.questions.push({ ...q, globalIndex: i });
    });
    return groups;
  }, [questions]);

  // ════════════════════════════════════════════
  // SETUP PHASE
  // ════════════════════════════════════════════
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Back */}
          <button onClick={onBack}
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-8 transition-colors">
            <HiOutlineChevronLeft className="h-4 w-4" /> Quay lại
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {examMeta?.title || 'Đề thi'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {examMeta?.description}
            </p>

            {/* Exam info */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalQuestions}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Câu hỏi</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{maxScore}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Điểm tối đa</p>
              </div>
            </div>

            {/* Sections */}
            {examMeta?.sections && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ma trận đề thi:</p>
                <div className="space-y-2">
                  {Object.entries(examMeta.sections).map(([subject, info]) => {
                    const colors = getSubjectColor(subject);
                    return (
                      <div key={subject} className={`flex items-center justify-between px-3 py-2 rounded-lg ${colors.bg}`}>
                        <span className={`text-sm font-medium ${colors.text}`}>{subject}</span>
                        <span className={`text-sm font-bold ${colors.text}`}>{info.count} câu</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timer setting */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                ⏱️ Thời gian làm bài (phút):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 150)}
                  className="w-28 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-center font-mono text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  / {examMeta?.timeMinutes || 150} phút tiêu chuẩn
                </span>
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={startExam}
              disabled={questions.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 text-lg disabled:opacity-50"
            >
              <HiOutlinePlay className="h-6 w-6" />
              Bắt đầu làm bài
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // RUNNING + SUBMITTED PHASE
  // ════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* ── Main Quiz Area ──────────────── */}
          <div className="flex-1 min-w-0" ref={quizAreaRef}>
            {/* Results banner */}
            {phase === 'submitted' && results && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                  {isReviewMode ? '📚 Xem lại lần làm bài' : '📊 Kết quả'}
                </h2>

                {isReviewMode && reviewAttempt?.submitted_at && (
                  <div className="mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 text-center">
                    Lần nộp: {new Date(reviewAttempt.submitted_at).toLocaleString('vi-VN')} · Đáp án bạn đã chọn được tô màu ngay bên dưới.
                  </div>
                )}

                {/* Save status banner (only shown for enrolled users / errors) */}
                {saveStatus === 'saving' && (
                  <div className="mb-4 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-3 h-3 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                    Đang lưu kết quả...
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="mb-4 flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg py-2">
                    <HiOutlineCloudUpload className="h-4 w-4" />
                    {isReviewMode ? 'Đang xem dữ liệu đã lưu trong hồ sơ học viên' : 'Đã lưu vào hồ sơ học viên — bạn có thể xem lại sau'}
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="mb-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-700 dark:text-red-300 text-center">
                    ⚠️ {saveError}
                  </div>
                )}
                {saveStatus === 'skipped' && !isEnrolled && (
                  <div className="mb-4 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-xs text-yellow-700 dark:text-yellow-300 text-center">
                    💡 Đăng ký khóa học để lưu kết quả và xem lại đáp án sau này.
                  </div>
                )}

                {/* Score circle */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="currentColor" strokeWidth="3"
                            className="text-gray-200 dark:text-slate-700" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" strokeWidth="3" strokeLinecap="round"
                            className="text-primary-500"
                            strokeDasharray={`${(results.score / maxScore) * 100}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{results.score}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">/ {maxScore}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{results.correct}</p>
                    <p className="text-xs text-green-600/70 dark:text-green-400/70">Đúng</p>
                  </div>
                  <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{results.wrong}</p>
                    <p className="text-xs text-red-600/70 dark:text-red-400/70">Sai</p>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{results.unanswered}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bỏ trống</p>
                  </div>
                </div>

                {/* By subject */}
                <div className="space-y-2">
                  {Object.entries(results.bySubject).map(([sub, data]) => {
                    const colors = getSubjectColor(sub);
                    const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                    return (
                      <div key={sub} className="flex items-center gap-3">
                        <span className={`text-xs font-medium w-28 truncate ${colors.text}`}>{sub}</span>
                        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-slate-700">
                          <div className={`h-full rounded-full ${colors.fill} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-16 text-right">
                          {data.correct}/{data.total}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <HiOutlineRefresh className="h-4 w-4" /> {isReviewMode ? 'Làm bài mới' : 'Làm lại'}
                  </button>
                  <button onClick={onBack}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
                    <HiOutlineChevronLeft className="h-4 w-4" /> {isReviewMode ? 'Quay lại lịch sử' : 'Danh sách đề'}
                  </button>
                </div>
              </div>
            )}

            {/* Questions by section */}
            {subjectGroups.map((group) => (
              <div key={group.subject} className="mb-8">
                {/* Section header */}
                <div className={`sticky top-16 z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 ${getSubjectColor(group.subject).bg} backdrop-blur-sm`}>
                  <span className={`text-sm font-bold ${getSubjectColor(group.subject).text}`}>
                    {group.subject}
                  </span>
                  <span className={`text-xs ${getSubjectColor(group.subject).text} opacity-70`}>
                    ({group.questions.length} câu)
                  </span>
                </div>

                {group.questions.map((q) => {
                  const gi = q.globalIndex;
                  const userAnswer = answers[gi];
                  const isCorrect = phase === 'submitted' && userAnswer === q.answer;
                  const isWrong = phase === 'submitted' && userAnswer && userAnswer !== q.answer;

                  return (
                    <div
                      key={gi}
                      ref={(el) => (questionRefs.current[gi] = el)}
                      className={`bg-white dark:bg-slate-800 rounded-xl p-5 mb-3 border transition-all
                        ${phase === 'submitted'
                          ? isCorrect
                            ? 'border-green-200 dark:border-green-800'
                            : isWrong
                            ? 'border-red-200 dark:border-red-800'
                            : 'border-yellow-200 dark:border-yellow-800'
                          : userAnswer
                          ? 'border-primary-200 dark:border-primary-800'
                          : 'border-gray-100 dark:border-slate-700'
                        } shadow-sm`}
                    >
                      {/* Question header */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                          ${phase === 'submitted'
                            ? isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : isWrong ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                          }`}>
                          {gi + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          {/* Passage context — only on first question of passage group */}
                          {q.passage && q.isFirstInPassage && (
                            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-l-3 border-primary-300 dark:border-primary-700">
                              {q.instruction && (
                                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">
                                  {q.instruction}
                                </p>
                              )}
                              <MathContent text={q.passage} />
                            </div>
                          )}
                          <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                            <MathContent text={q.question} />
                          </div>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-2 ml-11">
                        {(q.options || []).map((opt, oi) => {
                          // Robust option parsing: detect "A. " prefix or fall back to index
                          const prefixMatch = opt.match(/^([A-D])\.\s*/);
                          const letter = prefixMatch ? prefixMatch[1] : String.fromCharCode(65 + oi);
                          const optContent = prefixMatch ? opt.slice(prefixMatch[0].length) : opt.trim();
                          const isSelected = userAnswer === letter;
                          const isCorrectOpt = phase === 'submitted' && letter === q.answer;
                          const isWrongOpt = phase === 'submitted' && isSelected && letter !== q.answer;

                          return (
                            <label
                              key={oi}
                              onClick={() => handleAnswer(gi, letter)}
                              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm
                                ${phase === 'submitted'
                                  ? isCorrectOpt
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : isWrongOpt
                                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                    : 'border border-transparent'
                                  : isSelected
                                  ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                                  : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-transparent'
                                }
                                ${phase === 'submitted' ? 'pointer-events-none' : ''}
                              `}
                            >
                              <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold mt-0.5
                                ${phase === 'submitted'
                                  ? isCorrectOpt
                                    ? 'bg-green-500 text-white'
                                    : isWrongOpt
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                                  : isSelected
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                                }`}>
                                {letter}
                              </span>
                              <span className="flex-1 text-gray-700 dark:text-gray-300">
                                <MathContent text={optContent} />
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Explanation (after submit) */}
                      {phase === 'submitted' && q.explain && (
                        <div className="mt-3 ml-11 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">💡 Giải thích:</p>
                          <div className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                            <MathContent text={q.explain} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ── Desktop Sidebar (Question Map) ──── */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
              {/* Timer */}
              <div className={`text-center mb-4 p-3 rounded-xl
                ${timerDanger ? 'bg-red-50 dark:bg-red-900/20' : timerWarning ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-slate-700/50'}`}>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">⏱️ Thời gian còn lại</p>
                <p className={`text-2xl font-mono font-bold
                  ${timerDanger ? 'text-red-600 dark:text-red-400' : timerWarning ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                  {phase === 'submitted' ? '00:00' : formatTime(remainingSeconds)}
                </p>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span>Đã làm: {answeredCount}/{totalQuestions}</span>
                <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 mb-4">
                <div className="h-full rounded-full bg-primary-500 transition-all"
                     style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
              </div>

              {/* Question grid */}
              <div className="grid grid-cols-6 gap-1.5 mb-4 max-h-[40vh] overflow-y-auto pr-1">
                {questions.map((q, i) => {
                  const answered = answers[i] !== undefined;
                  const isCorrect = phase === 'submitted' && answers[i] === q.answer;
                  const isWrong = phase === 'submitted' && answered && answers[i] !== q.answer;
                  return (
                    <button
                      key={i}
                      onClick={() => scrollToQuestion(i)}
                      className={`w-full aspect-square rounded-md text-[11px] font-bold transition-all
                        ${phase === 'submitted'
                          ? isCorrect ? 'bg-green-500 text-white'
                          : isWrong ? 'bg-red-500 text-white'
                          : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                          : answered
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              {phase === 'submitted' && (
                <div className="flex flex-wrap gap-3 text-[10px] mb-4">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Đúng</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Sai</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-300 dark:bg-yellow-700" /> Bỏ trống</span>
                </div>
              )}

              {/* Submit / Reset */}
              {phase === 'running' && (
                <button onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                  <HiOutlineCheckCircle className="h-5 w-5" /> Nộp bài
                </button>
              )}
              {phase === 'submitted' && (
                <div className="flex gap-2">
                  <button onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <HiOutlineRefresh className="h-3.5 w-3.5" /> {isReviewMode ? 'Bài mới' : 'Làm lại'}
                  </button>
                  <button onClick={onBack}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-primary-600 text-xs font-medium text-white hover:bg-primary-700 transition-colors">
                    <HiOutlineChevronLeft className="h-3.5 w-3.5" /> {isReviewMode ? 'Lịch sử' : 'Danh sách'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Bar ──────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
        {/* Timer */}
        <div className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold
          ${timerDanger ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          : timerWarning ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}>
          {phase === 'submitted' ? '✓' : formatTime(remainingSeconds)}
        </div>

        {/* Progress */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {answeredCount}/{totalQuestions}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Map toggle */}
        <button onClick={() => setShowMap(true)}
          className="p-2.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
          <HiOutlineMenu className="h-5 w-5" />
        </button>

        {/* Submit */}
        {phase === 'running' && (
          <button onClick={handleSubmit}
            className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors">
            Nộp bài
          </button>
        )}
      </div>

      {/* ── Mobile Map Panel ──────────────── */}
      {showMap && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMap(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Bảng câu hỏi</h3>
              <button onClick={() => setShowMap(false)} className="p-1 text-gray-400"><HiOutlineX className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-8 gap-2 mb-4">
              {questions.map((q, i) => {
                const answered = answers[i] !== undefined;
                const isCorrect = phase === 'submitted' && answers[i] === q.answer;
                const isWrong = phase === 'submitted' && answered && answers[i] !== q.answer;
                return (
                  <button key={i} onClick={() => scrollToQuestion(i)}
                    className={`aspect-square rounded-md text-[11px] font-bold
                      ${phase === 'submitted'
                        ? isCorrect ? 'bg-green-500 text-white'
                        : isWrong ? 'bg-red-500 text-white'
                        : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                        : answered
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                      }`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            {phase === 'running' && (
              <button onClick={() => { setShowMap(false); handleSubmit(); }}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl">
                Nộp bài ({answeredCount}/{totalQuestions})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Back to top ──────────────────── */}
      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 lg:bottom-6 right-6 z-30 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <HiOutlineArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* Mobile bottom spacing */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
