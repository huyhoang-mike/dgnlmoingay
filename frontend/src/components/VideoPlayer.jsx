/**
 * VideoPlayer Component
 * Embeds a Google Drive video using the official preview URL with responsive sizing.
 *
 * @param {string} driveFileId - The Google Drive File ID
 * @param {string} [title]     - Optional title for the video
 */

export default function VideoPlayer({ driveFileId, title = 'Lesson Video' }) {
  if (!driveFileId) {
    return null;
  }

  const previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
  const viewUrl = `https://drive.google.com/file/d/${driveFileId}/view`;

  return (
    <div className="w-full">
      {/* Title bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          📹 Video bài giảng
        </h3>
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          Mở bằng Google Drive
        </a>
      </div>

      {/* 16:9 responsive iframe container */}
      <div className="relative w-full aspect-video min-h-[220px] sm:min-h-0 overflow-hidden rounded-2xl bg-gray-900 dark:bg-slate-800 shadow-lg ring-1 ring-gray-200 dark:ring-slate-700">
        <iframe
          src={previewUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ border: 'none' }}
        />
      </div>

      {/* Caption */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
        Nếu trình duyệt chặn cookie hoặc player hiển thị không tốt trên điện thoại, hãy bấm “Mở bằng Google Drive” để xem trong tab riêng.
      </p>
    </div>
  );
}
