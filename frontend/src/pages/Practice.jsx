/**
 * Practice Page (Luyện đề)
 * Displays practice exam sections.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlinePlay,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { getLessons, getUserProgress } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const EXAM_SECTIONS = [
  {
    group: 'Đề thi mới V-ACT 2026 - ĐHQG TP.HCM',
    badge: 'CẤU TRÚC MỚI',
    badgeColor: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    items: [
      { key: 'vact_ct1_2026', name: 'Đề chính thức Đợt 1 — 2026', hasVideo: true },
      { key: 'vact_mh_2026', name: 'Đề minh họa ĐHQG 2026', hasVideo: true },
      { key: 'vact_ct2_2025', name: 'Đề chính thức Đợt 2 — 2025', hasVideo: true },
      { key: 'vact_ct1_2025', name: 'Đề chính thức Đợt 1 — 2025', hasVideo: true },
      { key: 'vact_mh_2025', name: 'Đề minh họa ĐHQG 2025', hasVideo: true },
    ],
  },
  {
    group: 'Records - Tổng ôn Toàn diện 2026',
    items: [
      { key: 'tong_on_2026_ta', name: 'Tổng ôn Tiếng Anh', hasVideo: true },
      { key: 'tong_on_2026_toan', name: 'Tổng ôn Toán Phổ Thông', hasVideo: true },
      { key: 'tong_on_2026_tv', name: 'Tổng ôn Tiếng Việt', hasVideo: true },
    ],
  },
  {
    group: 'Đề V-ACT Chính thức trước 2025',
    badge: 'VIDEO CHI TIẾT',
    badgeColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    items: [
      { key: 'vact_2023_d1', name: 'Đề chính thức 2023 — Đợt 1', hasVideo: true },
      { key: 'vact_2022_d2', name: 'Đề chính thức 2022 — Đợt 2', hasVideo: true },
      { key: 'vact_2022_d1', name: 'Đề chính thức 2022 — Đợt 1', hasVideo: true },
      { key: 'vact_2021_d1', name: 'Đề chính thức 2021 — Đợt 1', hasVideo: true },
      { key: 'vact_2019_d1', name: 'Đề chính thức 2019 — Đợt 1', hasVideo: true },
    ],
  },
  {
    group: 'Đề chính thức các năm khác',
    items: [
      { key: 'vact_2024_d1', name: 'Đề chính thức 2024 — Đợt 1', hasVideo: false },
      { key: 'vact_2023_d2', name: 'Đề chính thức 2023 — Đợt 2', hasVideo: false },
      { key: 'vact_2020_d1', name: 'Đề chính thức 2020 — Đợt 1', hasVideo: false },
    ],
  },
];

export default function Practice() {
  const { isEnrolled, isAuthenticated, user, token } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [completedMap, setCompletedMap] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadProgress = async () => {
      setLoadingProgress(true);
      try {
        const lessonsPromise = getLessons({ category: 'luyende' });
        const progressPromise = isAuthenticated && user?.id
          ? getUserProgress(String(user.id)).then((res) => res.data).catch(() => [])
          : Promise.resolve([]);

        const [lessonsResponse, progressData] = await Promise.all([lessonsPromise, progressPromise]);

        if (!isActive) return;

        const lessonRows = Array.isArray(lessonsResponse.data) ? lessonsResponse.data : [];
        const nextCompletedMap = {};
        progressData.forEach((row) => {
          if (row.is_completed) {
            nextCompletedMap[row.lesson_id] = true;
          }
        });

        setLessons(lessonRows);
        setCompletedMap(nextCompletedMap);
      } catch (error) {
        console.error('[DGNL] Failed to load luyện đề progress:', error);
        if (isActive) {
          setLessons([]);
          setCompletedMap({});
        }
      } finally {
        if (isActive) {
          setLoadingProgress(false);
        }
      }
    };

    loadProgress();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, user?.id, token]);

  const sectionProgress = useMemo(() => {
    const total = lessons.length;
    const completed = lessons.reduce((acc, lesson) => acc + (completedMap[lesson.id] ? 1 : 0), 0);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [lessons, completedMap]);

  const subjectProgress = useMemo(() => {
    const map = {};
    lessons.forEach((lesson) => {
      if (!lesson.subject) return;
      if (!map[lesson.subject]) {
        map[lesson.subject] = { total: 0, completed: 0, percent: 0 };
      }
      map[lesson.subject].total += 1;
      if (completedMap[lesson.id]) {
        map[lesson.subject].completed += 1;
      }
    });

    Object.values(map).forEach((stats) => {
      stats.percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    });

    return map;
  }, [lessons, completedMap]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 mb-4">
            GIAI ĐOẠN 2
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Khóa học Luyện đề 2026
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Luyện tập với kho 100+ đề thi thử chuẩn cấu trúc, quản lý thời gian, kiểm tra lỗ hổng kiến thức. Mỗi đề sẽ đi kèm hướng dẫn giải dễ hiểu và video giải thích chi tiết.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tiến độ phần Luyện đề</h2>
            {isAuthenticated ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {sectionProgress.completed}/{sectionProgress.total} bài ({sectionProgress.percent}%)
              </span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">Đăng nhập để lưu tiến độ</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all"
              style={{ width: `${isAuthenticated ? sectionProgress.percent : 0}%` }}
            />
          </div>
          {loadingProgress && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Đang cập nhật tiến độ...</p>
          )}
        </div>

        {EXAM_SECTIONS.map((section) => (
          <div key={section.group} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {section.group}
              </h2>
              {section.badge && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${section.badgeColor}`}>
                  {section.badge}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {section.items.map((item) => {
                const stats = subjectProgress[item.key] || { total: 0, completed: 0, percent: 0 };
                const isItemCompleted = stats.total > 0 && stats.completed === stats.total;

                return (
                  <Link
                    key={item.key}
                    to={`/luyen-de/${item.key}`}
                    className={`group flex items-center gap-4 rounded-xl p-4 border hover:shadow-md transition-all ${
                      isItemCompleted
                        ? 'bg-emerald-50/70 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700'
                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700'
                    }`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                      <HiOutlineDocumentText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        {item.hasVideo && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <HiOutlinePlay className="h-3 w-3" /> Video bài giải
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <HiOutlineDocumentText className="h-3 w-3" /> Đáp án
                        </span>
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                          {stats.total > 0 ? (
                            <>
                              <span>{stats.completed}/{stats.total} bài đã học</span>
                              <span>{stats.percent}%</span>
                            </>
                          ) : (
                            <span>Chưa có bài học</span>
                          )}
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
                            style={{ width: `${stats.percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isItemCompleted && (
                        <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                      {!isEnrolled && (
                        <HiOutlineLockClosed className="h-4 w-4 text-gray-300 dark:text-slate-600" />
                      )}
                      <HiOutlineArrowRight className={`h-4 w-4 transition-colors ${
                        isItemCompleted
                          ? 'text-emerald-500 group-hover:text-emerald-600'
                          : 'text-gray-300 dark:text-slate-600 group-hover:text-primary-500'
                      }`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {!isEnrolled && (
          <div className="mt-8 text-center bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              🔒 Đăng ký khóa học để truy cập đầy đủ đề thi và video bài giải.
            </p>
            <Link
              to="/dang-ky"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Đăng ký ngay <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
