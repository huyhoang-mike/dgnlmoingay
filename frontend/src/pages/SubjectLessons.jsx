/**
 * SubjectLessons Page
 * Displays lessons for a specific subject or exam category.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlinePlay,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { getLessons, getUserProgress } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const SUBJECT_NAMES = {
  tieng_viet: 'Tiếng Việt',
  tieng_anh: 'Tiếng Anh',
  toan: 'Toán Phổ Thông',
  logic: 'Logic & Phân tích Số liệu',
  vat_ly: 'Vật Lý',
  hoa_hoc: 'Hóa Học',
  sinh_hoc: 'Sinh Học',
  dia_ly: 'Địa Lý',
  lich_su: 'Lịch Sử',
  gdktpl: 'GD Kinh tế & Pháp luật',
  nang_cao: 'Tài liệu Nâng cao',
  sach_luyen_de: 'Sách Luyện Đề',
};

export default function SubjectLessons({ category = 'nentang' }) {
  const { subject } = useParams();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedMap, setCompletedMap] = useState({});
  const { isAuthenticated, token, user } = useAuth();

  const subjectName = SUBJECT_NAMES[subject] || subject;
  const backLink = category === 'nentang' ? '/nen-tang' : '/luyen-de';
  const backLabel = category === 'nentang' ? 'Nền tảng' : 'Luyện đề';

  const completedCount = useMemo(
    () => lessons.reduce((acc, lesson) => acc + (completedMap[lesson.id] ? 1 : 0), 0),
    [lessons, completedMap]
  );
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  useEffect(() => {
    let isActive = true;

    const fetchLessons = async () => {
      setLoading(true);
      try {
        const lessonsPromise = getLessons({ category, subject });
        const progressPromise = isAuthenticated && user?.id
          ? getUserProgress(String(user.id)).then((res) => res.data).catch(() => [])
          : Promise.resolve([]);

        const [lessonsResponse, progressData] = await Promise.all([lessonsPromise, progressPromise]);

        if (!isActive) return;

        setLessons(lessonsResponse.data);

        const nextCompletedMap = {};
        progressData.forEach((row) => {
          if (row.is_completed) {
            nextCompletedMap[row.lesson_id] = true;
          }
        });
        setCompletedMap(nextCompletedMap);
      } catch (err) {
        console.error('[DGNL] Failed to fetch lessons:', err);
        if (isActive) {
          setLessons([]);
          setCompletedMap({});
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchLessons();

    return () => {
      isActive = false;
    };
  }, [category, subject, token, isAuthenticated, user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {subjectName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {lessons.length} bài học trong môn này
        </p>

        {isAuthenticated && !loading && lessons.length > 0 && (
          <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-200">Tiến độ môn học</span>
              <span className="text-gray-500 dark:text-gray-400">
                {completedCount}/{lessons.length} bài ({progressPercent}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mb-8 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            Đăng nhập để lưu và theo dõi tiến độ học theo từng bài.
          </div>
        )}

        {/* Lessons */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineDocumentText className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">Chưa có bài học nào cho môn này.</p>
            <Link
              to={backLink}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              ← Quay lại
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const isCompleted = !!completedMap[lesson.id];
              return (
                <Link
                  key={lesson.id}
                  to={`/lessons/${lesson.id}`}
                  className={`group flex items-center gap-4 rounded-xl p-4 border transition-all hover:shadow-md ${
                    isCompleted
                      ? 'bg-emerald-50/70 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700'
                      : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700'
                  }`}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      {!lesson.is_locked && lesson.video_drive_id && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <HiOutlinePlay className="h-3 w-3" /> Video
                        </span>
                      )}
                      {!lesson.is_locked && lesson.pdf_drive_id && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                          <HiOutlineDocumentText className="h-3 w-3" /> PDF
                        </span>
                      )}
                      {!lesson.is_locked && lesson.answer_pdf_drive_id && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <HiOutlineDocumentText className="h-3 w-3" /> Đáp án PDF
                        </span>
                      )}
                      {lesson.is_free && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          FREE
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          <HiOutlineCheckCircle className="h-3 w-3" /> Đã học
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : lesson.is_locked ? (
                      <HiOutlineLockClosed className="h-4 w-4 text-gray-300 dark:text-slate-600" />
                    ) : null}
                    <HiOutlineArrowRight className={`h-4 w-4 transition-colors ${
                      isCompleted
                        ? 'text-emerald-500 group-hover:text-emerald-600'
                        : 'text-gray-300 dark:text-slate-600 group-hover:text-primary-500'
                    }`} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
