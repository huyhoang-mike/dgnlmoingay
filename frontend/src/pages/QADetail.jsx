import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineBadgeCheck,
  HiOutlineChatAlt2,
  HiOutlineLockClosed,
  HiOutlinePhotograph,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineTrash,
} from 'react-icons/hi';
import { createQAAnswer, deleteQAQuestion, getQAQuestion } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

function ImageGrid({ images = [] }) {
  if (!images.length) return null;
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {images.map((src) => (
        <a key={src} href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <img src={src} alt="Ảnh đính kèm Q&A" className="w-full max-h-96 object-contain" />
        </a>
      ))}
    </div>
  );
}

function AuthorLine({ author, createdAt }) {
  return (
    <div className="flex items-center gap-2">
      {author?.picture ? (
        <img src={author.picture} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30" />
      )}
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{author?.name}</p>
          {author?.is_admin && <HiOutlineShieldCheck className="h-4 w-4 text-violet-500" />}
          {author?.is_enrolled && !author?.is_admin && <HiOutlineBadgeCheck className="h-4 w-4 text-primary-500" />}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(createdAt).toLocaleString('vi-VN')}</p>
      </div>
    </div>
  );
}

export default function QADetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerBody, setAnswerBody] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadQuestion = async () => {
    setLoading(true);
    try {
      const response = await getQAQuestion(questionId);
      setQuestion(response.data);
      setError(null);
    } catch (err) {
      setError(err?.response?.status === 403 ? 'Câu hỏi này chỉ dành cho học viên trong khóa học.' : 'Không tải được câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  const handleSubmitAnswer = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setSubmitError('Bạn cần đăng nhập Google trước khi trả lời.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append('body', answerBody.trim());
      files.forEach((file) => formData.append('files', file));
      await createQAAnswer(questionId, formData);
      setAnswerBody('');
      setFiles([]);
      await loadQuestion();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setSubmitError(Array.isArray(detail) ? 'Vui lòng nhập nội dung trả lời rõ hơn.' : detail || 'Không thể gửi câu trả lời.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!isAdmin || deleting) return;
    const ok = window.confirm('Xóa câu hỏi này? Thao tác này sẽ xóa cả các câu trả lời và không thể hoàn tác.');
    if (!ok) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteQAQuestion(questionId);
      navigate('/hoi-dap', { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setDeleteError(detail || 'Không thể xóa câu hỏi.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="inline-block w-10 h-10 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="max-w-md text-center rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-8">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không thể xem câu hỏi</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => navigate('/hoi-dap')} className="px-5 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700">
              Quay lại Q&A
            </button>
            <Link to="/dang-ky" className="px-5 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700">
              Đăng ký khóa học
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-700 dark:from-violet-950 dark:to-indigo-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button onClick={() => navigate('/hoi-dap')} className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-6">
            <HiOutlineArrowLeft className="h-4 w-4" /> Quay lại Hỏi đáp
          </button>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {question.is_priority && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white">
                <HiOutlineStar className="h-3.5 w-3.5 text-yellow-300" /> Học viên ưu tiên
              </span>
            )}
            {question.visibility === 'course' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white">
                <HiOutlineLockClosed className="h-3.5 w-3.5" /> Chỉ học viên
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white">Công khai</span>
            )}
            {question.status === 'answered' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white">
                <HiOutlineShieldCheck className="h-3.5 w-3.5" /> Admin đã trả lời
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight mb-4">{question.title}</h1>
          <AuthorLine author={question.author} createdAt={question.created_at} />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 mb-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="whitespace-pre-line text-gray-700 dark:text-gray-200 leading-relaxed">{question.body}</p>
          </div>
          <ImageGrid images={question.images} />
          <div className="flex flex-wrap gap-2 mt-5">
            {question.subject && <span className="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-bold">{question.subject}</span>}
            {(question.tags || []).map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-semibold">#{tag}</span>
            ))}
          </div>
        </article>

        {isAdmin && (
          <div className="mb-6">
            {deleteError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-3 text-sm text-red-700 dark:text-red-300 mb-4">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDeleteQuestion}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Đang xóa...' : 'Xóa câu hỏi'} <HiOutlineTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <section className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {question.answers.length} câu trả lời
            </h2>
            <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <HiOutlineChatAlt2 className="h-4 w-4" /> Cộng đồng cùng hỗ trợ
            </span>
          </div>

          {question.answers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-gray-500 dark:text-gray-400">
              Chưa có câu trả lời. Hãy giúp bạn này nếu bạn biết cách giải nhé!
            </div>
          ) : (
            <div className="space-y-4">
              {question.answers.map((answer) => (
                <article key={answer.id} className={`rounded-2xl border p-5 ${answer.is_admin_answer ? 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800/40' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'}`}>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <AuthorLine author={answer.author} createdAt={answer.created_at} />
                    {answer.is_admin_answer && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                        <HiOutlineShieldCheck className="h-3.5 w-3.5" /> Admin
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{answer.body}</p>
                  <ImageGrid images={answer.images} />
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gửi câu trả lời</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Bạn có thể góp ý lời giải hoặc bổ sung hình ảnh. Vui lòng đăng nhập trước khi trả lời.
          </p>
          {submitError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-3 text-sm text-red-700 dark:text-red-300 mb-4">
              {submitError}
            </div>
          )}
          {!isAuthenticated && (
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 p-4 text-sm text-yellow-800 dark:text-yellow-200 mb-5">
              Bạn cần đăng nhập Google ở thanh điều hướng để trả lời câu hỏi.
            </div>
          )}
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <textarea
              value={answerBody}
              onChange={(event) => setAnswerBody(event.target.value)}
              required
              minLength={2}
              rows={5}
              placeholder="Nhập câu trả lời hoặc hướng dẫn giải..."
              className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 4))}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
              />
              {files.length > 0 && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <HiOutlinePhotograph className="h-3.5 w-3.5" /> Đã chọn {files.length} ảnh
                </p>
              )}
            </div>
            <button
              disabled={submitting || !isAuthenticated}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Đang gửi...' : 'Gửi câu trả lời'} <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
