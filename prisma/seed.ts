import { PrismaClient, UserRole, EnrollmentRequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

const log = (msg: string) => console.log(`  ✔  ${msg}`);

// ─── Data ─────────────────────────────────────────────────────────────────────

const ADMIN = {
  email: 'admin@lms.dev',
  password: 'Admin@1234',
  firstName: 'Super',
  lastName: 'Admin',
};

const TEACHERS = [
  { email: 'sara@lms.dev',  password: 'Teacher@1234', firstName: 'Sara',  lastName: 'Hassan'  },
  { email: 'karim@lms.dev', password: 'Teacher@1234', firstName: 'Karim', lastName: 'Nasser'  },
];

const STUDENTS = [
  { email: 'ali@lms.dev',    password: 'Student@1234', firstName: 'Ali',    lastName: 'Omar'    },
  { email: 'lina@lms.dev',   password: 'Student@1234', firstName: 'Lina',   lastName: 'Khalil'  },
  { email: 'omar@lms.dev',   password: 'Student@1234', firstName: 'Omar',   lastName: 'Saleh'   },
  { email: 'maya@lms.dev',   password: 'Student@1234', firstName: 'Maya',   lastName: 'Yousef'  },
  { email: 'ziad@lms.dev',   password: 'Student@1234', firstName: 'Ziad',   lastName: 'Farid'   },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Starting seed...\n');

  // ── 1. Admin ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: {},
    create: {
      email: ADMIN.email,
      passwordHash: hash(ADMIN.password),
      role: UserRole.ADMIN,
      profile: { create: { firstName: ADMIN.firstName, lastName: ADMIN.lastName } },
    },
  });
  log(`Admin:    ${admin.email}  /  password: ${ADMIN.password}`);

  // ── 2. Teachers ─────────────────────────────────────────────────────────────
  const teachers: typeof admin[] = [];
  for (const t of TEACHERS) {
    const u = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        passwordHash: hash(t.password),
        role: UserRole.TEACHER,
        profile: { create: { firstName: t.firstName, lastName: t.lastName } },
      },
    });
    teachers.push(u);
    log(`Teacher:  ${u.email}  /  password: ${t.password}`);
  }

  // ── 3. Students ─────────────────────────────────────────────────────────────
  const students: typeof admin[] = [];
  for (const s of STUDENTS) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: hash(s.password),
        role: UserRole.STUDENT,
        profile: { create: { firstName: s.firstName, lastName: s.lastName } },
      },
    });
    students.push(u);
    log(`Student:  ${u.email}  /  password: ${s.password}`);
  }

  // ── 4. Courses ───────────────────────────────────────────────────────────────
  console.log('');
  const courseData = [
    {
      title: 'Introduction to Web Development',
      description: 'HTML, CSS, JavaScript fundamentals from scratch.',
      teacherIndex: 0,
    },
    {
      title: 'Advanced Node.js & NestJS',
      description: 'Build production-grade APIs with NestJS, Prisma, and Docker.',
      teacherIndex: 0,
    },
    {
      title: 'UI/UX Design Essentials',
      description: 'Figma, design systems, and user research basics.',
      teacherIndex: 1,
    },
    {
      title: 'Data Structures & Algorithms',
      description: 'Problem solving with TypeScript — arrays, trees, graphs.',
      teacherIndex: 1,
    },
  ];

  const courses: { id: string; title: string; teacherId: string }[] = [];
  for (const c of courseData) {
    const existing = await prisma.course.findUnique({ where: { title: c.title } });
    const course = existing ?? await prisma.course.create({
      data: {
        title: c.title,
        description: c.description,
        teacherId: teachers[c.teacherIndex].id,
      },
    });
    courses.push(course);
    log(`Course:   "${course.title}"  →  teacher: ${TEACHERS[c.teacherIndex].email}`);
  }

  // ── 5. Lectures ──────────────────────────────────────────────────────────────
  console.log('');
  const lectureTemplates = [
    ['Getting Started', 'Project setup and tools'],
    ['Core Concepts',   'Deep dive into the fundamentals'],
    ['Advanced Topics', 'Real-world patterns and best practices'],
  ];

  for (const course of courses) {
    for (const [i, [title, description]] of lectureTemplates.entries()) {
      const fullTitle = `${title} — ${course.title}`;
      const existing = await prisma.lecture.findUnique({ where: { title: fullTitle } });
      if (!existing) {
        await prisma.lecture.create({
          data: {
            courseId: course.id,
            title: fullTitle,
            description,
            videoUrl: `https://example.com/videos/${course.id}/lecture-${i + 1}`,
          },
        });
      }
    }
    log(`Lectures: 3 lectures created for "${course.title}"`);
  }

  // ── 6. Assignments ───────────────────────────────────────────────────────────
  console.log('');
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14); // 2 weeks from now

  for (const course of courses) {
    const existing = await prisma.assignment.findFirst({
      where: { courseId: course.id, title: { startsWith: 'Assignment 1' } },
    });
    if (!existing) {
      await prisma.assignment.createMany({
        data: [
          { courseId: course.id, title: `Assignment 1 — ${course.title}`, description: 'First assignment', dueDate },
          { courseId: course.id, title: `Assignment 2 — ${course.title}`, description: 'Second assignment', dueDate: new Date(dueDate.getTime() + 7 * 86400000) },
        ],
      });
    }
    log(`Assignments: 2 assignments created for "${course.title}"`);
  }

  // ── 7. Announcements ─────────────────────────────────────────────────────────
  console.log('');
  for (const course of courses) {
    const existing = await prisma.announcement.findFirst({ where: { courseId: course.id } });
    if (!existing) {
      await prisma.announcement.create({
        data: {
          courseId: course.id,
          title: '👋 Welcome to the course!',
          body: `Welcome everyone! This is the official announcement board for "${course.title}". Feel free to ask questions.`,
        },
      });
    }
    log(`Announcement: welcome post created for "${course.title}"`);
  }

  // ── 8. Enrollment Requests (various statuses) ────────────────────────────────
  console.log('');

  // ali: APPROVED in course 0 (Web Dev)
  await upsertRequest(students[0].id, courses[0].id, EnrollmentRequestStatus.APPROVED,
    'I am very interested in web development!');
  await upsertEnrollment(students[0].id, courses[0].id, 'REQUEST');
  log(`Enrollment: ali → "${courses[0].title}"  [APPROVED + enrolled]`);

  // ali: PENDING in course 1 (NestJS)
  await upsertRequest(students[0].id, courses[1].id, EnrollmentRequestStatus.PENDING,
    'Huge fan of NestJS, please accept!');
  log(`Enrollment: ali → "${courses[1].title}"  [PENDING]`);

  // lina: APPROVED in course 2 (UI/UX)
  await upsertRequest(students[1].id, courses[2].id, EnrollmentRequestStatus.APPROVED,
    'Designer looking to level up.');
  await upsertEnrollment(students[1].id, courses[2].id, 'REQUEST');
  log(`Enrollment: lina → "${courses[2].title}"  [APPROVED + enrolled]`);

  // lina: REJECTED in course 0
  await upsertRequest(students[1].id, courses[0].id, EnrollmentRequestStatus.REJECTED,
    undefined, 'Course is currently full. Try next semester.');
  log(`Enrollment: lina → "${courses[0].title}"  [REJECTED]`);

  // omar: PENDING in course 3 (DSA)
  await upsertRequest(students[2].id, courses[3].id, EnrollmentRequestStatus.PENDING,
    'I want to improve my problem solving skills.');
  log(`Enrollment: omar → "${courses[3].title}"  [PENDING]`);

  // maya: Admin direct enrollment in course 1
  await upsertEnrollment(students[3].id, courses[1].id, 'ADMIN');
  log(`Enrollment: maya → "${courses[1].title}"  [ADMIN direct]`);

  // ziad: PENDING in both UI/UX and Web Dev
  await upsertRequest(students[4].id, courses[2].id, EnrollmentRequestStatus.PENDING);
  await upsertRequest(students[4].id, courses[0].id, EnrollmentRequestStatus.PENDING);
  log(`Enrollment: ziad → 2 courses  [PENDING]`);

  // ── 9. Progress updates ──────────────────────────────────────────────────────
  await prisma.enrollment.updateMany({
    where: { studentId: students[0].id, courseId: courses[0].id },
    data: { progress: 65 },
  });
  await prisma.enrollment.updateMany({
    where: { studentId: students[1].id, courseId: courses[2].id },
    data: { progress: 30 },
  });
  log(`Progress: ali 65% in Web Dev, lina 30% in UI/UX`);

  // ── 10. Notifications ────────────────────────────────────────────────────────
  console.log('');
  const notifs = [
    { userId: teachers[0].id, type: 'ENROLLMENT_REQUEST', title: 'New Enrollment Request', body: `Ali wants to join "${courses[1].title}"` },
    { userId: students[0].id, type: 'ENROLLMENT_APPROVED', title: 'Enrollment Approved!', body: `You were approved for "${courses[0].title}"` },
    { userId: students[1].id, type: 'ENROLLMENT_REJECTED', title: 'Request Declined', body: `Your request for "${courses[0].title}" was declined: Course is full.` },
  ];
  for (const n of notifs) {
    await prisma.notification.create({ data: n });
  }
  log(`Notifications: ${notifs.length} sample notifications created`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Seed complete!

👤  Accounts (all passwords below)
────────────────────────────────────────────
  Admin    →  admin@lms.dev       Admin@1234
  Teacher  →  sara@lms.dev        Teacher@1234
  Teacher  →  karim@lms.dev       Teacher@1234
  Student  →  ali@lms.dev         Student@1234  (enrolled + pending)
  Student  →  lina@lms.dev        Student@1234  (enrolled + rejected)
  Student  →  omar@lms.dev        Student@1234  (pending)
  Student  →  maya@lms.dev        Student@1234  (admin-enrolled)
  Student  →  ziad@lms.dev        Student@1234  (2× pending)

📚  Courses: ${courses.length}  |  📝  Lectures: ${courses.length * 3}
📋  Enrollment states: APPROVED, PENDING, REJECTED, ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertRequest(
  studentId: string,
  courseId: string,
  status: EnrollmentRequestStatus,
  message?: string,
  note?: string,
) {
  const existing = await prisma.enrollmentRequest.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!existing) {
    await prisma.enrollmentRequest.create({
      data: { studentId, courseId, status, message, note },
    });
  }
}

async function upsertEnrollment(studentId: string, courseId: string, enrolledBy: string) {
  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!existing) {
    await prisma.enrollment.create({
      data: { studentId, courseId, enrolledBy, progress: 0 },
    });
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
