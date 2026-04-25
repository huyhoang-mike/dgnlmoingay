/**
 * Platform Page (Nền tảng)
 * Displays all foundation course subjects as a card grid.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineLockClosed, HiOutlineBookOpen, HiOutlineCheckCircle } from 'react-icons/hi';
import { getLessons, getUserProgress } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  {
    group: '1. Sử dụng Ngôn ngữ',
    subjects: [
      { key: 'tieng_viet', name: 'Tiếng Việt', emoji: '📝', desc: 'Ngữ pháp, đọc hiểu, và kỹ năng sử dụng tiếng Việt' },
      { key: 'tieng_anh', name: 'Tiếng Anh', emoji: '🌍', desc: 'Từ vựng, ngữ pháp, và đọc hiểu tiếng Anh' },
    ],
  },
  {
    group: '2. Toán học',
    subjects: [
      { key: 'toan', name: 'Toán Phổ Thông', emoji: '📐', desc: 'Đại số, hình học, giải tích, và xác suất thống kê' },
    ],
  },
  {
    group: '3. Tư duy Khoa học',
    subjects: [
      { key: 'logic', name: 'Logic & Phân tích Số liệu', emoji: '🧠', desc: 'Tư duy logic, phân tích dữ liệu và biểu đồ' },
      { key: 'vat_ly', name: 'Vật Lý', emoji: '⚡', desc: 'Cơ học, điện từ, quang học, và nhiệt học' },
      { key: 'hoa_hoc', name: 'Hóa Học', emoji: '🧪', desc: 'Hóa đại cương, vô cơ, và hữu cơ' },
      { key: 'sinh_hoc', name: 'Sinh Học', emoji: '🧬', desc: 'Tế bào, di truyền, sinh thái, và tiến hóa' },
      { key: 'dia_ly', name: 'Địa Lý', emoji: '🗺️', desc: 'Địa lý tự nhiên và kinh tế xã hội' },
      { key: 'lich_su', name: 'Lịch Sử', emoji: '📜', desc: 'Lịch sử Việt Nam và thế giới' },
      { key: 'gdktpl', name: 'GD Kinh tế & Pháp luật', emoji: '⚖️', desc: 'Kiến thức kinh tế và pháp luật cơ bản' },
    ],
  },
  {
    group: '4. Nâng cao 900+',
    subjects: [
      { key: 'nang_cao', name: 'Tài liệu Nâng cao', emoji: '🚀', desc: 'Tài liệu và Ebook cho mục tiêu 900+ điểm' },
    ],
  },
];

export default function Platform() {
  const { isEnrolled, isAuthenticated, user, token } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [completedMap, setCompletedMap] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadProgress = async () => {
      setLoadingProgress(true);
      try {
        const lessonsPromise = getLessons({ category: 'nentang' });
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
        console.error('[DGNL] Failed to load nền tảng progress:', error);
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
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-800 dark:to-cyan-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 mb-4">
            GIAI ĐOẠN 1
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Khóa học Nền tảng 2026
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Mỗi môn học gồm bài giảng video và tài liệu đi kèm. Các bạn nên đọc tài liệu trước, sau đó xem bài giảng để tiếp thu hiệu quả hơn.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tiến độ phần Nền tảng</h2>
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
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
              style={{ width: `${isAuthenticated ? sectionProgress.percent : 0}%` }}
            />
          </div>

          {loadingProgress && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Đang cập nhật tiến độ...</p>
          )}
        </div>

        {CATEGORIES.map((cat) => (
          <div key={cat.group} className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <HiOutlineBookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              {cat.group}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.subjects.map((s) => {
                const stats = subjectProgress[s.key] || { total: 0, completed: 0, percent: 0 };
                const isSubjectCompleted = stats.total > 0 && stats.completed === stats.total;

                return (
                  <Link
                    key={s.key}
                    to={`/nen-tang/${s.key}`}
                    className={`group rounded-xl p-5 border hover:shadow-md transition-all ${
                      isSubjectCompleted
                        ? 'bg-emerald-50/70 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700'
                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{s.emoji}</span>
                      <div className="flex items-center gap-1.5">
                        {isSubjectCompleted && (
                          <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                        {!isEnrolled && (
                          <HiOutlineLockClosed className="h-4 w-4 text-gray-300 dark:text-slate-600" />
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{s.desc}</p>

                    <div className="mb-3">
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

                    <span className={`inline-flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all ${
                      isSubjectCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-primary-600 dark:text-primary-400'
                    }`}>
                      Xem bài học <HiOutlineArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {!isEnrolled && (
          <div className="mt-8 text-center bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              🔒 Một số nội dung yêu cầu đăng ký khóa học để truy cập đầy đủ.
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
