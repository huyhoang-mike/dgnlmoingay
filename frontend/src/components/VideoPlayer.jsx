/**
 * VideoPlayer Component
 * Embeds a Google Drive video using an iframe with responsive 16:9 aspect ratio.
 *
 * @param {string} driveFileId - The Google Drive File ID
 * @param {string} [title]     - Optional title for the video
 */

export default function VideoPlayer({ driveFileId, title = 'Lesson Video' }) {
  if (!driveFileId) {
    return null;
  }

  const embedUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;

  return (
    <div className="w-full">
      {/* Title bar */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          📹 Video bài giảng
        </h3>
      </div>

      {/* 16:9 responsive iframe container */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-gray-900 dark:bg-slate-800 shadow-lg
                      ring-1 ring-gray-200 dark:ring-slate-700"
           style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-popups"
          style={{ border: 'none' }}
        />
      </div>

      {/* Caption */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
        Nếu video không hiển thị, hãy kiểm tra quyền truy cập Google Drive.
      </p>
    </div>
  );
}
