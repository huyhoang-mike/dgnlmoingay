/**
 * LessonView Page
 * Displays a single lesson with video, PDF materials, and content.
 * Respects access control — locked content shows upgrade prompt.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineCheckCircle, HiOutlineLockClosed } from 'react-icons/hi';
import { getLesson, getLessonProgress, upsertLessonProgress } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from '../components/VideoPlayer';
import PDFMaterial from '../components/PDFMaterial';

export default function LessonView() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionSaving, setCompletionSaving] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      try {
        const response = await getLesson(lessonId);
        setLesson(response.data);
      } catch (error) {
        console.error('[DGNL] Failed to fetch lesson:', error);
        setLesson(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId]);

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (!lesson?.id || !isAuthenticated || !user?.id || lesson.is_locked) {
        setIsCompleted(false);
        return;
      }

      setCompletionLoading(true);
      try {
        const response = await getLessonProgress(String(user.id), lesson.id);
        setIsCompleted(Boolean(response.data?.is_completed));
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('[DGNL] Failed to fetch lesson completion status:', error);
        }
        setIsCompleted(false);
      } finally {
        setCompletionLoading(false);
      }
    };

    fetchCompletionStatus();
  }, [lesson?.id, lesson?.is_locked, isAuthenticated, user?.id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
          <div className="h-96 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 text-center">
        <p className="text-gray-500 dark:text-gray-400">Không tìm thấy bài học.</p>
        <Link to="/" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  const currentId = parseInt(lessonId, 10);
  const isLocked = lesson.is_locked;
  const hasVideo = !isLocked && !!lesson.video_drive_id;
  const hasPdf = !isLocked && !!lesson.pdf_drive_id;
  const hasAnswerPdf = !isLocked && !!lesson.answer_pdf_drive_id;
  const canTrackProgress = !isLocked && isAuthenticated && !!user?.id;

  const handleToggleComplete = async () => {
    if (!canTrackProgress || completionSaving) return;

    const nextCompleted = !isCompleted;
    setCompletionSaving(true);
    try {
      await upsertLessonProgress(String(user.id), lesson.id, {
        is_completed: nextCompleted,
        progress_percent: nextCompleted ? 100 : 0,
      });
      setIsCompleted(nextCompleted);
    } catch (error) {
      console.error('[DGNL] Failed to update lesson completion:', error);
    } finally {
      setCompletionSaving(false);
    }
  };

  const completionButton = canTrackProgress ? (
    <button
      type="button"
      onClick={handleToggleComplete}
      disabled={completionSaving || completionLoading}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold transition-colors ${
        isCompleted
          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          : 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
      } ${completionSaving || completionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      <HiOutlineCheckCircle className="h-5 w-5" />
      {completionSaving ? 'Đang lưu...' : isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
    </button>
  ) : !isLocked ? (
    <Link
      to="/dang-ky"
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
    >
      Đăng nhập để lưu tiến độ
    </Link>
  ) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
      {/* Breadcrumb + Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to={lesson.category === 'luyende' ? '/luyen-de' : '/nen-tang'}
            className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 mb-2 transition-colors"
          >
            <HiOutlineArrowLeft className="h-3 w-3" />
            {lesson.category === 'luyende' ? 'Luyện đề' : 'Nền tảng'}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
          {lesson.is_free && (
            <span className="inline-flex mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              FREE
            </span>
          )}
          {!isLocked && isCompleted && (
            <span className="inline-flex mt-1 ml-2 items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              <HiOutlineCheckCircle className="h-3 w-3" />
              Đã hoàn thành
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentId > 1 && (
            <Link
              to={`/lessons/${currentId - 1}`}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium
                         text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg
                         hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <HiOutlineArrowLeft className="h-4 w-4" />
              Trước
            </Link>
          )}
          <Link
            to={`/lessons/${currentId + 1}`}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium
                       text-white bg-primary-600 rounded-lg
                       hover:bg-primary-700 transition-colors shadow-sm"
          >
            Tiếp
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Description */}
      {lesson.description && (
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-base leading-relaxed">
          {lesson.description}
        </p>
      )}

      {/* Locked Content Prompt */}
      {isLocked && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-2xl p-8 text-center mb-8">
          <HiOutlineLockClosed className="mx-auto h-10 w-10 text-yellow-500 dark:text-yellow-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nội dung bị khóa
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            {isAuthenticated
              ? 'Đăng ký khóa học để truy cập nội dung đầy đủ bao gồm video bài giảng và tài liệu.'
              : 'Đăng nhập và đăng ký khóa học để truy cập nội dung đầy đủ.'}
          </p>
          <Link
            to="/dang-ky"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Đăng ký ngay <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Video Section */}
      {hasVideo && (
        <section className="mb-8">
          <VideoPlayer driveFileId={lesson.video_drive_id} title={lesson.title} />
        </section>
      )}

      {!hasVideo && hasPdf && (
        <section className="mb-8">
          <PDFMaterial driveFileId={lesson.pdf_drive_id} title="Tài liệu bài học" preview />
        </section>
      )}

      {!hasVideo && hasAnswerPdf && (
        <section className="mb-8">
          <PDFMaterial driveFileId={lesson.answer_pdf_drive_id} title="File đáp án" />
        </section>
      )}

      {/* Two-Column: Content + PDF */}
      <div className={`grid grid-cols-1 gap-8 ${hasVideo ? 'lg:grid-cols-3' : ''}`}>
        {/* Main Content */}
        <div className={hasVideo ? 'lg:col-span-2' : ''}>
          {!isLocked && lesson.content ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                📝 Nội dung bài học
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {lesson.content}
              </div>
            </div>
          ) : !isLocked ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
              <p className="text-gray-400 dark:text-gray-500">Nội dung đang được cập nhật...</p>
            </div>
          ) : null}
        </div>

        {/* Sidebar: PDF + Actions */}
        {hasVideo && !isLocked && (
          <div className="space-y-6">
            {hasPdf && <PDFMaterial driveFileId={lesson.pdf_drive_id} title="Tài liệu bài học" />}
            {hasAnswerPdf && <PDFMaterial driveFileId={lesson.answer_pdf_drive_id} title="File đáp án" />}

            {/* Mark Complete Button */}
            {completionButton}
          </div>
        )}
      </div>

      {!isLocked && !hasVideo && (
        <div className="mt-6">
          <div className="w-full sm:w-auto">{completionButton}</div>
        </div>
      )}
    </div>
  );
}
