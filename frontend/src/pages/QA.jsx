import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineChatAlt2,
  HiOutlineLockClosed,
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineStar,
} from 'react-icons/hi';
import { createQAQuestion, listQAQuestions } from '../api/client';
import QAGuide from '../components/QAGuide';
import QAQuestionCard from '../components/QAQuestionCard';
import { useAuth } from '../contexts/AuthContext';

const SUBJECTS = ['Tất cả', 'Tiếng Việt', 'Tiếng Anh', 'Toán', 'Tư duy khoa học', 'Vật lý', 'Hóa học', 'Sinh học', 'Khác'];

export default function QA() {
  const { isAuthenticated, isEnrolled, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('auto');
  const [subject, setSubject] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', body: '', visibility: 'public', subject: '', tags: '' });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canUseCourseVisibility = isEnrolled || isAdmin;

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = {
        scope,
        ...(subject !== 'Tất cả' ? { subject } : {}),
        ...(search.trim() ? { q: search.trim() } : {}),
      };
      const response = await listQAQuestions(params);
      setQuestions(response.data);
    } catch (err) {
      console.error('[DGNL] Failed to load Q&A:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [scope, subject]);

  const stats = useMemo(() => {
    const answered = questions.filter((question) => question.status === 'answered').length;
    const priority = questions.filter((question) => question.is_priority).length;
    return { total: questions.length, answered, priority };
  }, [questions]);

  const handleSearch = (event) => {
    event.preventDefault();
    loadQuestions();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập Google ở thanh điều hướng trước khi đặt câu hỏi.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('body', form.body.trim());
      formData.append('visibility', canUseCourseVisibility ? form.visibility : 'public');
      if (form.subject) formData.append('subject', form.subject);
      if (form.tags) formData.append('tags', form.tags);
      files.forEach((file) => formData.append('files', file));

      const response = await createQAQuestion(formData);
      setForm({ title: '', body: '', visibility: 'public', subject: '', tags: '' });
      setFiles([]);
      navigate(`/hoi-dap/${response.data.id}`);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(Array.isArray(detail) ? 'Vui lòng kiểm tra lại tiêu đề/nội dung câu hỏi.' : detail || 'Không thể đăng câu hỏi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <section className="bg-gradient-to-br from-violet-600 via-indigo-700 to-blue-800 dark:from-slate-950 dark:via-violet-950 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-semibold mb-5">
                <HiOutlineChatAlt2 className="h-4 w-4 text-yellow-300" /> Hỏi đáp ĐGNL có admin hỗ trợ
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
                Q&A Đánh giá năng lực: hỏi bài, xem lời giải, học từ cộng đồng
              </h1>
              <p className="text-lg text-white/80 leading-relaxed max-w-2xl mb-8">
                Đăng câu hỏi bằng text hoặc ảnh, nhận câu trả lời từ admin và các bạn học sinh khác. Câu hỏi công khai giúp nhiều học sinh tìm thấy lời giải qua Google.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#ask-question"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-bold hover:bg-gray-50 transition-colors shadow-lg shadow-black/10"
                >
                  Đặt câu hỏi ngay <HiOutlineArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="#qa-list"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors"
                >
                  Xem câu hỏi mới
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Câu hỏi', value: stats.total, icon: HiOutlineChatAlt2 },
                { label: 'Đã trả lời', value: stats.answered, icon: HiOutlineShieldCheck },
                { label: 'Ưu tiên', value: stats.priority, icon: HiOutlineStar },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-4 text-center">
                  <item.icon className="h-6 w-6 text-white/80 mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-white">{item.value}</p>
                  <p className="text-xs text-white/70">{item.label}</p>
                </div>
              ))}
              <div className="col-span-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-5">
                <p className="text-sm font-bold text-white mb-2">Tối ưu chuyển đổi</p>
                <p className="text-sm text-white/75 leading-relaxed">
                  Người chưa đăng ký vẫn có thể hỏi công khai; học viên được hỏi riêng trong khóa học và được ưu tiên xử lý.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <QAGuide />

        <section id="ask-question" className="scroll-mt-24 mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-5">
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Đặt câu hỏi mới</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                Các bạn nhớ ghi rõ đề bài và hoặc những thắc mắc về kỳ thi. Ảnh tối đa 5MB/ảnh.
              </p>
              {!isAuthenticated && (
                <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 p-4 text-sm text-yellow-800 dark:text-yellow-200 mb-5">
                  Bạn cần đăng nhập Google ở thanh điều hướng để đăng câu hỏi hoặc trả lời.
                </div>
              )}
              {isAuthenticated && !canUseCourseVisibility && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-4 text-sm text-blue-800 dark:text-blue-200 mb-5">
                  Tài khoản chưa đăng ký khóa học sẽ đăng câu hỏi ở chế độ công khai để cộng đồng cùng hỗ trợ.
                </div>
              )}
              {canUseCourseVisibility && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 p-4 text-sm text-emerald-800 dark:text-emerald-200 mb-5">
                  Học viên được chọn hỏi công khai hoặc chỉ trong khóa học; câu hỏi của bạn được ưu tiên trả lời.
                </div>
              )}
              <Link
                to="/dang-ky"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Muốn được ưu tiên trả lời? Xem khóa học <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6 space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Tiêu đề câu hỏi</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                  minLength={8}
                  maxLength={255}
                  placeholder="Ví dụ: Vì sao câu Tiếng Việt này chọn B thay vì C?"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Nội dung chi tiết</label>
                <textarea
                  value={form.body}
                  onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                  required
                  minLength={10}
                  rows={6}
                  placeholder="Giải thích rõ hơn thắc mắc, phần nào chưa hiểu,..."
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Môn/phần</label>
                  <select
                    value={form.subject}
                    onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Chưa phân loại</option>
                    {SUBJECTS.filter((item) => item !== 'Tất cả').map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Hashtag</label>
                  <input
                    value={form.tags}
                    onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                    placeholder="vd: từ vựng, biểu đồ, đọc hiểu, logic, reading"
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Phạm vi hiển thị</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-slate-600 p-3 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={form.visibility === 'public' || !canUseCourseVisibility}
                      onChange={() => setForm((prev) => ({ ...prev, visibility: 'public' }))}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">Công khai</span>
                    </span>
                  </label>
                  <label className={`flex items-start gap-3 rounded-xl border p-3 ${canUseCourseVisibility ? 'border-gray-200 dark:border-slate-600 cursor-pointer' : 'border-gray-100 dark:border-slate-700 opacity-50 cursor-not-allowed'}`}>
                    <input
                      type="radio"
                      name="visibility"
                      value="course"
                      disabled={!canUseCourseVisibility}
                      checked={canUseCourseVisibility && form.visibility === 'course'}
                      onChange={() => setForm((prev) => ({ ...prev, visibility: 'course' }))}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">Riêng tư trong khóa học</span>
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Ảnh đính kèm</label>
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
                type="submit"
                disabled={submitting || !isAuthenticated}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Đang đăng...' : 'Đăng câu hỏi'} <HiOutlineArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        <section id="qa-list" className="scroll-mt-24">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Câu hỏi mới nhất</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Câu hỏi học viên được ưu tiên; câu hỏi công khai giúp kéo thêm traffic tự nhiên từ Google.
              </p>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm câu hỏi..."
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button className="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700">
                Tìm
              </button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {SUBJECTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSubject(item)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  subject === item
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700'
                }`}
              >
                {item}
              </button>
            ))}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setScope(scope === 'mine' ? 'auto' : 'mine')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  scope === 'mine'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-700'
                }`}
              >
                Câu hỏi của tôi
              </button>
            )}
            {canUseCourseVisibility && (
              <button
                type="button"
                onClick={() => setScope(scope === 'course' ? 'auto' : 'course')}
                className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  scope === 'course'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <HiOutlineLockClosed className="h-4 w-4" /> Trong khóa học
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-10 text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-gray-500 dark:text-gray-400">Chưa có câu hỏi phù hợp. Hãy là người đầu tiên đặt câu hỏi!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {questions.map((question) => <QAQuestionCard key={question.id} question={question} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
