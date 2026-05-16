import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineCloudUpload,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineXCircle,
} from 'react-icons/hi';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { submitDeepPracticeAttempt } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];

function QuestionImage({ src, alt }) {
  if (!src) return null;
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
      <img src={src} alt={alt || 'Hình minh họa câu hỏi'} className="w-full max-h-[420px] object-contain" />
    </div>
  );
}

const MARKDOWN_REMARK_PLUGINS = [remarkGfm, remarkMath];
const MARKDOWN_REHYPE_PLUGINS = [rehypeKatex];

function MarkdownContent({ text, className }) {
  if (!text) return null;
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={MARKDOWN_REMARK_PLUGINS} rehypePlugins={MARKDOWN_REHYPE_PLUGINS}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

function snapshotQuestions(questions) {
  return questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    image: question.image,
    options: question.options || [],
    answer: question.answer,
    explanation: question.explanation,
    explanationImage: question.explanationImage,
    tags: question.tags || [],
  }));
}

export default function DeepPracticeQuizRunner({ quiz, meta, onBack, reviewAttempt = null, onAttemptSaved, onStartNew }) {
  const { isAuthenticated } = useAuth();
  const isReviewMode = Boolean(reviewAttempt);
  const [answers, setAnswers] = useState(reviewAttempt?.answers || {});
  const [submitted, setSubmitted] = useState(isReviewMode);
  const [startedAt] = useState(() => Date.now());
  const [saveStatus, setSaveStatus] = useState(isReviewMode ? 'saved' : 'idle');
  const [saveError, setSaveError] = useState(null);

  const questions = reviewAttempt?.meta?.questions?.length ? reviewAttempt.meta.questions : (quiz?.questions || []);
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    if (!reviewAttempt) return;
    setAnswers(reviewAttempt.answers || {});
    setSubmitted(true);
    setSaveStatus('saved');
    setSaveError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reviewAttempt]);

  const result = useMemo(() => {
    if (!submitted) return null;
    const correct = questions.reduce((count, question) => (
      answers[question.id] === question.answer ? count + 1 : count
    ), 0);
    return {
      correct,
      wrong: answeredCount - correct,
      unanswered: totalQuestions - answeredCount,
      percent: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0,
      spentSeconds: isReviewMode
        ? (reviewAttempt?.time_spent_seconds || 0)
        : Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
    };
  }, [answers, answeredCount, isReviewMode, questions, reviewAttempt, startedAt, submitted, totalQuestions]);

  useEffect(() => {
    if (isReviewMode || !submitted || !meta?.id || !result) return;
    const storageKey = `deep-practice-best:${meta.id}`;
    const previous = Number(localStorage.getItem(storageKey) || 0);
    if (result.percent > previous) {
      localStorage.setItem(storageKey, String(result.percent));
    }
  }, [isReviewMode, meta?.id, result, submitted]);

  useEffect(() => {
    if (isReviewMode || !submitted || !meta?.id || !result || saveStatus !== 'idle') return;

    if (!isAuthenticated) {
      setSaveStatus('skipped');
      return;
    }

    const payload = {
      quiz_id: meta.id,
      quiz_title: quiz?.title || meta?.title || null,
      subject: meta?.subject || quiz?.subject || null,
      score_percent: result.percent,
      correct_count: result.correct,
      wrong_count: result.wrong,
      unanswered_count: result.unanswered,
      total_questions: totalQuestions,
      time_spent_seconds: result.spentSeconds,
      answers,
      meta: {
        skill: meta?.skill,
        level: meta?.level,
        questions: snapshotQuestions(questions),
      },
    };

    setSaveStatus('saving');
    submitDeepPracticeAttempt(payload)
      .then((res) => {
        setSaveStatus('saved');
        if (typeof onAttemptSaved === 'function') onAttemptSaved(res.data);
      })
      .catch((err) => {
        setSaveStatus('error');
        setSaveError(err?.response?.data?.detail || 'Không thể lưu kết quả luyện tập');
      });
  }, [answers, isAuthenticated, isReviewMode, meta, onAttemptSaved, questions, quiz, result, saveStatus, submitted, totalQuestions]);

  const chooseAnswer = (questionId, key) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: key }));
  };

  const resetQuiz = () => {
    if (isReviewMode) {
      if (typeof onStartNew === 'function') onStartNew();
      return;
    }
    setAnswers({});
    setSubmitted(false);
    setSaveStatus('idle');
    setSaveError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatSpentTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes} phút ${rest} giây`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 dark:from-cyan-900 dark:to-blue-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-6 transition-colors"
          >
            <HiOutlineArrowLeft className="h-4 w-4" /> Quay lại danh sách quiz
          </button>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white">
                  {meta?.subject || quiz?.subject}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white">
                  {meta?.isFree ? 'Miễn phí' : 'Học viên'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{quiz?.title || meta?.title}</h1>
              <p className="text-white/75 text-sm max-w-2xl">{meta?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center min-w-[220px]">
              <div className="rounded-xl bg-white/10 border border-white/15 p-3">
                <p className="text-2xl font-bold text-white">{totalQuestions}</p>
                <p className="text-xs text-white/70">Câu hỏi</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 p-3">
                <p className="text-2xl font-bold text-white">{meta?.timeMinutes || quiz?.timeMinutes}</p>
                <p className="text-xs text-white/70">Phút gợi ý</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sticky top-20 z-20 mb-6 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Đã chọn {answeredCount}/{totalQuestions} câu
              </p>
              <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                  style={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }}
                />
              </div>
            </div>
            {!submitted ? (
              <button
                onClick={() => setSubmitted(true)}
                disabled={answeredCount === 0}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Nộp bài & xem đáp án
              </button>
            ) : (
              <button
                onClick={resetQuiz}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <HiOutlineRefresh className="h-4 w-4" /> {isReviewMode ? 'Làm bài mới' : 'Làm lại'}
              </button>
            )}
          </div>
        </div>

        {submitted && result && (
          <div className="mb-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  {isReviewMode ? 'Xem lại kết quả' : 'Kết quả'}: {result.correct}/{totalQuestions} câu đúng ({result.percent}%)
                </h2>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                  Sai {result.wrong} câu · Bỏ trống {result.unanswered} câu · Thời gian {formatSpentTime(result.spentSeconds)}
                </p>
                {isReviewMode && reviewAttempt?.submitted_at && (
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                    Lần nộp: {new Date(reviewAttempt.submitted_at).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <HiOutlineClock className="h-4 w-4" /> Gợi ý: ghi lại dạng sai để ôn nền tảng
              </div>
            </div>
            {saveStatus === 'saving' && (
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <div className="w-3 h-3 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                Đang lưu kết quả...
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/70 dark:bg-slate-900/30 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <HiOutlineCloudUpload className="h-4 w-4" />
                {isReviewMode ? 'Đang xem dữ liệu đã lưu' : 'Đã lưu để xem lại sau'}
              </div>
            )}
            {saveStatus === 'skipped' && (
              <div className="mt-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-300">
                Đăng nhập Google để lưu lịch sử làm quiz và xem lại đáp án trên thiết bị khác.
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                ⚠️ {saveError}
              </div>
            )}
          </div>
        )}

        <div className="space-y-5">
          {questions.map((question, index) => {
            const selected = answers[question.id];
            const isCorrect = submitted && selected === question.answer;
            const isWrong = submitted && selected && selected !== question.answer;

            return (
              <article key={question.id} className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300 mb-1">
                      Câu {index + 1}{question.tags?.length ? ` · ${question.tags.join(' · ')}` : ''}
                    </p>
                    <MarkdownContent
                      className="markdown-content text-base font-semibold text-gray-900 dark:text-white"
                      text={question.prompt}
                    />
                  </div>
                  {submitted && (
                    isCorrect ? <HiOutlineCheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" /> : <HiOutlineXCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  )}
                </div>

                <QuestionImage src={question.image} alt={`Hình minh họa câu ${index + 1}`} />

                <div className="mt-4 grid grid-cols-1 gap-3">
                  {(question.options || []).map((option, optionIndex) => {
                    const optionKey = option.key || OPTION_KEYS[optionIndex];
                    const isSelected = selected === optionKey;
                    const isAnswer = submitted && question.answer === optionKey;
                    const optionClass = isAnswer
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100'
                      : isSelected && isWrong
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                        : isSelected
                          ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-100'
                          : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-gray-200 hover:border-cyan-200 dark:hover:border-cyan-700';

                    return (
                      <button
                        key={optionKey}
                        type="button"
                        onClick={() => chooseAnswer(question.id, optionKey)}
                        className={`text-left rounded-xl border p-4 transition-all ${optionClass}`}
                      >
                        <div className="flex gap-3">
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-xs font-bold border border-current/10">
                            {optionKey}
                          </span>
                          <MarkdownContent className="markdown-inline" text={option.text} />
                        </div>
                        <QuestionImage src={option.image} alt={`Hình minh họa đáp án ${optionKey}`} />
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="mt-4 rounded-xl bg-gray-50 dark:bg-slate-900/70 border border-gray-100 dark:border-slate-700 p-4">
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                      Đáp án đúng: {question.answer}
                    </p>
                    <MarkdownContent
                      className="markdown-content text-sm text-gray-600 dark:text-gray-300"
                      text={question.explanation || 'Chưa có giải thích cho câu này.'}
                    />
                    <QuestionImage src={question.explanationImage} alt={`Hình giải thích câu ${index + 1}`} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
