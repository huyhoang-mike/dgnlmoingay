/**
 * ExamPage – loads an exam by ID and renders ExamTake.
 * Route: /thuc-chien/:examId
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ExamTake from '../components/ExamTake';
import { useAuth } from '../contexts/AuthContext';
import { getExamSettings } from '../api/client';

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { isEnrolled } = useAuth();

  const [examData, setExamData] = useState(null);
  const [examMeta, setExamMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // 1. Load index + backend settings in parallel
        const [idxRes, settingsRes] = await Promise.all([
          fetch('/exams/index.json'),
          getExamSettings().then((r) => r.data).catch(() => []),
        ]);
        if (!idxRes.ok) throw new Error('Không tải được danh sách đề');
        const index = await idxRes.json();
        const meta = index.find((e) => e.id === examId);
        if (!meta) throw new Error('Không tìm thấy đề thi');

        // 2. Check access — backend settings override index.json
        const setting = settingsRes.find((s) => s.exam_id === examId);
        const examIsFree = setting ? setting.is_free : meta.isFree;

        if (!examIsFree && !isEnrolled) {
          setExamMeta(meta);
          setLocked(true);
          return;
        }

        setExamMeta(meta);

        // 3. Load exam questions
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
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {examMeta?.title}
          </p>
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
    <ExamTake
      examData={examData}
      examMeta={examMeta}
      onBack={() => navigate('/thuc-chien')}
    />
  );
}
