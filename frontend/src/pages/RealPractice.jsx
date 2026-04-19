/**
 * RealPractice Page (Luyện đề Thực chiến)
 * Lists available mock exams fetched from /exams/index.json
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineLightningBolt,
  HiOutlineClock,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineStar,
  HiOutlineLockClosed,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { getExamSettings } from '../api/client';

const SUBJECT_COLORS = {
  'Tiếng Việt': 'bg-blue-500',
  'Tiếng Anh': 'bg-emerald-500',
  'Toán': 'bg-orange-500',
  'Tư duy khoa học': 'bg-purple-500',
};

export default function RealPractice() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isEnrolled } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const [indexRes, settingsRes] = await Promise.all([
          fetch('/exams/index.json', { cache: 'no-store' }).then((r) => r.json()),
          getExamSettings().then((r) => r.data).catch(() => []),
        ]);

        // Build settings map from backend
        const settingsMap = {};
        settingsRes.forEach((s) => { settingsMap[s.exam_id] = s; });

        // Merge: backend settings override index.json defaults
        const merged = indexRes.map((exam) => {
          const setting = settingsMap[exam.id];
          return {
            ...exam,
            isFree: setting ? setting.is_free : exam.isFree,
            isPublished: setting ? setting.is_published : true,
          };
        }).filter((exam) => exam.isPublished); // Only show published exams

        setExams(merged);
      } catch {
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 dark:from-orange-700 dark:to-red-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            ⚡ Luyện đề Thực chiến
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Thi thử trực tuyến với đề thi V-ACT — timer, chấm điểm tự động, đáp án chi tiết
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: HiOutlineClock, label: 'Timer đếm ngược', desc: 'Tùy chỉnh thời gian làm bài' },
            { icon: HiOutlineClipboardCheck, label: 'Chấm điểm tự động', desc: 'Kết quả & thống kê ngay lập tức' },
            { icon: HiOutlineDocumentText, label: 'Đáp án chi tiết', desc: 'Giải thích cho từng câu hỏi' },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
              <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                <f.icon className="h-4.5 w-4.5 text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{f.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Exam list */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">📋 Danh sách đề thi</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-gray-500 dark:text-gray-400">Chưa có đề thi nào. Quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const canAccess = exam.isFree || isEnrolled;
              return (
                <div
                  key={exam.id}
                  className={`group relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden transition-all hover:shadow-md ${
                    canAccess ? 'cursor-pointer' : 'opacity-80'
                  }`}
                  onClick={() => canAccess && navigate(`/thuc-chien/${exam.id}`)}
                >
                  {/* Free badge */}
                  {exam.isFree && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <HiOutlineStar className="h-3 w-3" /> Miễn phí
                      </span>
                    </div>
                  )}
                  {!canAccess && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">
                        <HiOutlineLockClosed className="h-3 w-3" /> Học viên
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 pr-20 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {exam.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {exam.description}
                    </p>

                    {/* Info row */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <HiOutlineDocumentText className="h-3.5 w-3.5" />
                        {exam.totalQuestions} câu
                      </span>
                      <span className="flex items-center gap-1">
                        <HiOutlineClock className="h-3.5 w-3.5" />
                        {exam.timeMinutes} phút
                      </span>
                      <span className="flex items-center gap-1">
                        <HiOutlineStar className="h-3.5 w-3.5" />
                        {exam.maxScore} điểm
                      </span>
                    </div>

                    {/* Subject bar */}
                    {exam.sections && (
                      <div className="flex rounded-lg overflow-hidden h-2">
                        {Object.entries(exam.sections).map(([sub, info]) => (
                          <div
                            key={sub}
                            className={`${SUBJECT_COLORS[sub] || 'bg-gray-400'}`}
                            style={{ width: `${(info.count / exam.totalQuestions) * 100}%` }}
                            title={`${sub}: ${info.count} câu`}
                          />
                        ))}
                      </div>
                    )}
                    {exam.sections && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(exam.sections).map(([sub, info]) => (
                          <span key={sub} className="text-[10px] text-gray-400 dark:text-gray-500">
                            {sub} ({info.count})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom action bar */}
                  {canAccess && (
                    <div className="px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {exam.pointsPerQuestion} điểm/câu
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                        Vào thi <HiOutlineArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
