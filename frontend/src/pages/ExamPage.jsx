/**
 * ExamPage – loads an exam by ID, shows past attempts, and renders ExamTake.
 * Route: /thuc-chien/:examId
 *
 * Enrolled students additionally see a list of their previous attempts
 * (score history). After submitting a new attempt, the history is refreshed.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiOutlineClock, HiOutlineChartBar } from 'react-icons/hi';
import ExamTake from '../components/ExamTake';
import { useAuth } from '../contexts/AuthContext';
import { getExamSettings, listMyExamAttempts } from '../api/client';

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { isEnrolled } = useAuth();

  const [examData, setExamData] = useState(null);
  const [examMeta, setExamMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);

  // Past-attempts history (enrolled only)
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  const fetchAttempts = useCallback(async () => {
    if (!isEnrolled || !examId) return;
    try {
      setAttemptsLoading(true);
      const res = await listMyExamAttempts(examId);
      setAttempts(res.data);
    } catch {
      setAttempts([]);
    } finally {
      setAttemptsLoading(false);
    }
  }, [isEnrolled, examId]);

  useEffect(() => {
    async function load() {
      try {
        const [idxRes, settingsRes] = await Promise.all([
          fetch('/exams/index.json', { cache: 'no-store' }),
          getExamSettings().then((r) => r.data).catch(() => []),
        ]);
        if (!idxRes.ok) throw new Error('Không tải được danh sách đề');
        const index = await idxRes.json();
        const meta = index.find((e) => e.id === examId);
        if (!meta) throw new Error('Không tìm thấy đề thi');

        const setting = settingsRes.find((s) => s.exam_id === examId);
        const examIsFree = setting ? setting.is_free : meta.isFree;

        if (!examIsFree && !isEnrolled) {
          setExamMeta(meta);
          setLocked(true);
          return;
        }

        setExamMeta(meta);

        const filePath = meta.file.startsWith('/') ? meta.file : `/exams/${meta.file}`;
        const examRes = await fetch(filePath);
        if (!examRes.ok) throw new Error('Không tải được đề thi');
        const data = await examRes.json();
        setExamData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [examId, isEnrolled]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center max-w-md px-4">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Đề thi dành cho học viên
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">{examMeta?.title}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            Đăng ký khóa học để truy cập tất cả đề thi thực chiến, bài giảng và tài liệu.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dang-ky"
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors">
              Đăng ký ngay
            </Link>
            <button onClick={() => navigate('/thuc-chien')}
              className="px-6 py-3 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">😵</p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lỗi</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate('/thuc-chien')}
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors">
            Quay lại danh sách đề
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Past-attempts banner (enrolled only) — rendered above ExamTake. */}
      {isEnrolled && attempts.length > 0 && (
        <div className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineChartBar className="h-4 w-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Lịch sử làm bài của bạn ({attempts.length})
                </h3>
                {attemptsLoading && (
                  <div className="ml-auto w-3 h-3 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {attempts.slice(0, 10).map((a) => {
                  const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0;
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-700/40 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-gray-700 dark:text-gray-200">
                          {a.score}<span className="text-gray-400">/{a.max_score}</span>
                          <span className="ml-2 text-gray-400">· {pct}%</span>
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                          <HiOutlineClock className="h-3 w-3" />
                          {new Date(a.submitted_at).toLocaleString('vi-VN')}
                          <span className="ml-2">· {a.correct_count}✓ {a.wrong_count}✗ {a.unanswered_count}∅</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                Mỗi lần nộp bài sẽ được lưu lại để bạn theo dõi tiến trình.
              </p>
            </div>
          </div>
        </div>
      )}

      <ExamTake
        examData={examData}
        examMeta={examMeta}
        onBack={() => navigate('/thuc-chien')}
        onAttemptSaved={fetchAttempts}
      />
    </>
  );
}
