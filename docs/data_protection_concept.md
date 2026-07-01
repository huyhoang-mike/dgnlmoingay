**Data Protection Concept**

**SEP-Project: E-Learning Platform**

**Abstract**

This system is a course management platform for lesson delivery, mock exams, deep practice quizzes, Q&A, open materials, payment-based enrollment, and user notifications. The technical stack is a React/Vite/Tailwind frontend, a FastAPI backend, PostgreSQL for persistence, and Nginx as reverse proxy and static file server. Authentication is based on Google OAuth plus JWT, and payment enrollment is handled through SePay webhook processing. The backend exposes routers for auth, lessons, progress, exams, payments, Q&A, open materials, notifications, and SEO (main.py, auth.py, payments.py, qa.py, open_materials.py, exams.py).

**System architecture**

- Frontend SPA for students, guests, and admins.
- FastAPI backend with role-based dependencies for authenticated, enrolled, and admin access.
- PostgreSQL as the primary data store.
- VPS-backed upload storage for Q&A and material files under /uploads.
- Google OAuth as identity provider.
- SePay as payment processor and webhook sender.
- Nginx as reverse proxy and upload/static file server.

**Data model**

The relevant personal-data-bearing entities are:

- users: identity, profile, enrollment state, admin state.
- payment_orders: payment contact data, transfer reference, reconciliation and access-grant state.
- qa_questions and qa_answers: user-generated questions, answers, images, author references, visibility, moderation metadata.
- open_materials and material_submissions: public catalog metadata and user contribution metadata.
- user_progress: lesson completion and access behavior.
- exam_attempts and deep_practice_attempts: learning history, answers, score data, timestamps.
- notifications: per-user in-app communication and read state.
- lessons and exam settings are mostly content/configuration objects; they are not personal-data-heavy unless user-generated text is entered into content fields.

Deletion behavior is partly covered by foreign-key rules in the schema: several personal-data tables cascade on user deletion, while payment orders use set null for the user link (exam_attempt.py, deep_practice_attempt.py, qa.py, notification.py, open_material.py, payment_order.py).

**Use Cases**

- Account creation and Google login.
- Admin pre-registration and user management.
- Enrollment management through admin actions or payment confirmation.
- Lesson access control and course delivery.
- Progress tracking for lessons.
- Mock-exam attempt storage and review.
- Deep-practice attempt storage and review.
- Q&A posting, answering, moderation, and notifications.
- Open-material submissions and copyright review.
- Payment creation, webhook reconciliation, and automatic access grant.
- Notification delivery and read tracking.

**Data field catalog**

| Nr. | Data field name | Group of persons | Intended use, purpose | Usage period and erasure | DPC |
|---|---|---|---|---|---|
| 1 | users.email | Students, applicants, admins | Login identifier and contact address | Until account deletion; delete earlier on request if no legal retention reason exists | DPC 1 |
| 2 | users.name | Students, applicants, admins | Display name, support, personalization | Until account deletion or profile update | DPC 1 |
| 3 | users.picture | Students, applicants, admins | Avatar display in UI | Until profile update or account deletion | DPC 1 |
| 4 | users.google_id | Students, applicants | OAuth account binding and duplicate prevention | Until account deletion; removed with the user record | DPC 1 |
| 5 | users.enrollment_year | Students | Student profile and cohort management | Until account deletion; retained with student record while needed | DPC 2 |
| 6 | users.course_type | Students | Course segmentation and access management | Until account deletion | DPC 2 |
| 7 | payment_orders.google_email | Paying students, applicants | Match payment to the right user account | Kept as part of payment record retention, typically 10 years for accounting evidence | DPC 3 |
| 8 | payment_orders.full_name | Paying students, applicants | Payment support, payer identification | Kept as part of payment record retention, typically 10 years | DPC 2 |
| 9 | payment_orders.order_code, transfer_content, provider_transaction_id, provider_payload | Paying students, applicants | Bank transfer reconciliation, audit, anti-duplicate handling | Kept as part of payment record retention, typically 10 years | DPC 3 |
| 10 | qa_questions.author_id, qa_answers.author_id | Authenticated users, students, admins | Link questions and answers to their authors | Until account deletion; cascading deletion applies to authored records | DPC 1 |
| 11 | qa_questions.title, body, images, subject, tags, visibility | Students, admins, guests viewing public content | Q&A publication, search, moderation, SEO | Until deletion by author/admin or account deletion; public content may be archived or anonymized if legally required | DPC 3 |
| 12 | qa_answers.body, images, is_admin_answer, is_accepted | Students, admins | Answering and moderation of Q&A content | Until deletion by author/admin or account deletion | DPC 3 |
| 13 | material_submissions.contributor_id, source_name | Contributors, students, admins | Identify who submitted the material | Until account deletion or submission deletion; contributor link is removed by cascade if applicable | DPC 1 |
| 14 | material_submissions.title, description, tags, file_urls, original_filenames, copyright_note | Contributors, students, admins | Review, copyright handling, publication workflow | Until submission deletion or retention expiry; uploaded files are deleted when the submission is removed | DPC 2 |
| 15 | notifications.user_id, type, title, body, url, read_at | Recipients, admins | In-app messaging and workflow notifications | Until account deletion or periodic cleanup of old notifications | DPC 3 |
| 16 | user_progress.user_id, lesson_id, is_completed, progress_percent, last_accessed, completed_at | Students, admins | Lesson progress tracking and learning analytics | Until account deletion or explicit erasure request; backup copies follow backup rotation | DPC 3 |
| 17 | exam_attempts.user_id, exam_id, exam_title, score, answers, meta, submitted_at | Enrolled students, admins | Mock-exam history, scoring, replay, analytics | Until account deletion or later anonymized analytics retention | DPC 3 |
| 18 | deep_practice_attempts.user_id, quiz_id, quiz_title, subject, score_percent, answers, meta, submitted_at | Authenticated users, admins | Deep-practice history, scoring, replay, analytics | Until account deletion or later anonymized analytics retention | DPC 3 |

**Authorization concept**

| Nr. | Role | Description | Required data permissions | Read / Write |
|---|---|---|---|---|
| 1 | Guest | Unauthenticated visitor | Public lessons, public Q&A, published open materials, free exam/quiz previews | Read only |
| 2 | Authenticated user | Logged-in user with Google OAuth | Own profile, own notifications, own Q&A posts, own material submissions, payment order creation/binding, own learning data | Read own data, write limited user content |
| 3 | Enrolled student | Logged-in user with course access | Course-only lessons, exam attempt storage, deep-practice attempt storage, course-only Q&A, progress tracking | Read/write within course features |
| 4 | Admin | System administrator | All user data, moderation queues, all attempts, all submissions, lesson and catalog CRUD, notification broadcasts | Read/write all application data |
| 5 | Google OAuth provider | External identity provider | email, name, picture, sub from the Google identity token | No access to app data; only identity assertion into the system |
| 6 | SePay webhook sender | External payment processor | payment reference, amount, transaction ID, webhook secret header | No access to app data; only payment confirmation into the system |
| 7 | Infrastructure operator / DevOps | Technical operations role outside the app RBAC | Database backups, logs, uploads, deployment configuration | Operational access only, ideally least-privilege and audited |

The current codebase does not define a separate hotline/support role. If the organization needs one, it should be added explicitly with a narrow read-only scope instead of reusing admin broadly.

**List of personal data processing**

| Nr. | Name | Description of analysis | Used data fields | Authorized roles |
|---|---|---|---|---|
| 1 | Google login and account creation | Verifies the Google ID token, creates or updates the user profile, and binds the external identity to the local account | users.email, users.name, users.picture, users.google_id | Guest via Google, authenticated user, admin |
| 2 | Student pre-registration and profile management | Admin creates or updates a student record before or after first login | users.email, users.name, users.enrollment_year, users.course_type, users.is_enrolled, users.is_admin | Admin |
| 3 | Enrollment and course access control | Grants or revokes access to paid course content | users.is_enrolled, users.is_admin, lesson access state | Admin, enrolled student |
| 4 | Lesson progress tracking | Stores per-lesson completion and access history | user_progress.user_id, lesson_id, is_completed, progress_percent, last_accessed, completed_at | Enrolled student, admin |
| 5 | Mock-exam history | Stores submitted exam attempts and score breakdowns for later review | exam_attempts.user_id, exam_id, exam_title, score, answers, meta, submitted_at | Enrolled student, admin |
| 6 | Deep-practice history | Stores specialized quiz attempts and results | deep_practice_attempts.user_id, quiz_id, quiz_title, subject, score_percent, answers, meta, submitted_at | Authenticated user, admin |
| 7 | Q&A publication and moderation | Saves questions, answers, attachments, visibility, and moderation markers | qa_questions.author_id, title, body, images, visibility, tags, answers, qa_answers.author_id, body, images | Authenticated user, enrolled student, admin |
| 8 | Open-material contribution and review | Accepts uploaded files and manages review, approval, and publication | material_submissions.contributor_id, title, description, file_urls, original_filenames, source_name, copyright_note, reviewed_by_id | Authenticated user, enrolled student, admin |
| 9 | Payment creation and reconciliation | Creates payment orders, binds them to a user, and grants access after successful payment | payment_orders.google_email, full_name, order_code, transfer_content, provider_transaction_id, provider_payload, paid_amount, paid_at, access_granted_at | Authenticated user, enrolled student, admin, SePay webhook sender |
| 10 | Notifications and in-app messaging | Sends and tracks user-specific notifications and broadcast messages | notifications.user_id, type, title, body, url, is_read, created_at, read_at | Recipient user, admin |
| 11 | Operational administration and audit | Supports deletion, backup, troubleshooting, and evidence preservation | user data, payment data, submissions, Q&A content, logs, backups | Admin, infrastructure operator / DevOps |