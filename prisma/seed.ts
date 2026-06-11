import { PrismaClient, UserRole, EnrollmentRequestStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const log  = (msg: string) => process.stdout.write(`  ✔  ${msg}\n`);

const ADMIN = { email: 'admin@lms.dev', password: 'Admin@1234', firstName: 'Super', lastName: 'Admin' };

const TEACHERS = [
  { email: 'sara@lms.dev',  password: 'Teacher@1234', firstName: 'Sara',  lastName: 'Hassan' },
  { email: 'karim@lms.dev', password: 'Teacher@1234', firstName: 'Karim', lastName: 'Nasser' },
];

const STUDENTS = [
  { email: 'ali@lms.dev',  password: 'Student@1234', firstName: 'Ali',  lastName: 'Omar'   },
  { email: 'lina@lms.dev', password: 'Student@1234', firstName: 'Lina', lastName: 'Khalil' },
  { email: 'omar@lms.dev', password: 'Student@1234', firstName: 'Omar', lastName: 'Saleh'  },
  { email: 'maya@lms.dev', password: 'Student@1234', firstName: 'Maya', lastName: 'Yousef' },
  { email: 'ziad@lms.dev', password: 'Student@1234', firstName: 'Ziad', lastName: 'Farid'  },
];

async function upsertRequest(
  studentId: string,
  courseId: string,
  status: EnrollmentRequestStatus,
  message?: string,
  note?: string,
) {
  const exists = await prisma.enrollmentRequest.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!exists) {
    await prisma.enrollmentRequest.create({ data: { studentId, courseId, status, message, note } });
  }
}

async function upsertEnrollment(studentId: string, courseId: string, enrolledBy: string) {
  const exists = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!exists) {
    await prisma.enrollment.create({ data: { studentId, courseId, enrolledBy, progress: 0 } });
  }
}

async function main() {
  process.stdout.write('\n\uD83C\uDF31  Starting seed...\n\n');

  // ── 1. Admin ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where:  { email: ADMIN.email },
    update: {},
    create: {
      email: ADMIN.email,
      passwordHash: hash(ADMIN.password),
      role: UserRole.ADMIN,
      profile: { create: { firstName: ADMIN.firstName, lastName: ADMIN.lastName } },
    },
  });
  log(`Admin:    ${admin.email}  /  ${ADMIN.password}`);

  // ── 2. Teachers ───────────────────────────────────────────────────────────
  const teachers: (typeof admin)[] = [];
  for (const t of TEACHERS) {
    const u = await prisma.user.upsert({
      where:  { email: t.email },
      update: {},
      create: {
        email: t.email,
        passwordHash: hash(t.password),
        role: UserRole.TEACHER,
        profile: { create: { firstName: t.firstName, lastName: t.lastName } },
      },
    });
    teachers.push(u);
    log(`Teacher:  ${u.email}  /  ${t.password}`);
  }

  // ── 3. Students ───────────────────────────────────────────────────────────
  const students: (typeof admin)[] = [];
  for (const s of STUDENTS) {
    const u = await prisma.user.upsert({
      where:  { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: hash(s.password),
        role: UserRole.STUDENT,
        profile: { create: { firstName: s.firstName, lastName: s.lastName } },
      },
    });
    students.push(u);
    log(`Student:  ${u.email}  /  ${s.password}`);
  }

  // ── 4. Courses ────────────────────────────────────────────────────────────
  process.stdout.write('\n');
  const courseData = [
    { title: 'Introduction to Web Development', description: 'HTML, CSS, JavaScript fundamentals.', teacherIndex: 0 },
    { title: 'Advanced Node.js & NestJS',        description: 'Production-grade APIs with NestJS, Prisma, Docker.', teacherIndex: 0 },
    { title: 'UI/UX Design Essentials',          description: 'Figma, design systems, user research.', teacherIndex: 1 },
    { title: 'Data Structures & Algorithms',     description: 'Problem solving with TypeScript.', teacherIndex: 1 },
  ];

  const courses: { id: string; title: string; teacherId: string }[] = [];
  for (const c of courseData) {
    const existing = await prisma.course.findUnique({ where: { title: c.title } });
    const course = existing ?? await prisma.course.create({
      data: { title: c.title, description: c.description, teacherId: teachers[c.teacherIndex].id },
    });
    courses.push(course);
    log(`Course:   "${course.title}"  ->  ${TEACHERS[c.teacherIndex].email}`);
  }

  // ── 5. Lectures ───────────────────────────────────────────────────────────
  process.stdout.write('\n');
  const lectureTitles = [
    ['Getting Started',  'Project setup and tools'],
    ['Core Concepts',    'Deep dive into fundamentals'],
    ['Advanced Topics',  'Real-world patterns'],
  ];
  for (const course of courses) {
    for (const [i, [t, desc]] of lectureTitles.entries()) {
      const title = `${t} - ${course.title}`;
      const exists = await prisma.lecture.findUnique({ where: { title } });
      if (!exists) {
        await prisma.lecture.create({
          data: { courseId: course.id, title, description: desc,
            videoUrl: `https://example.com/videos/${course.id}/lec-${i + 1}` },
        });
      }
    }
    log(`Lectures: 3 created for "${course.title}"`);
  }

  // ── 6. Assignments ────────────────────────────────────────────────────────
  process.stdout.write('\n');
  const due1 = new Date(); due1.setDate(due1.getDate() + 14);
  const due2 = new Date(); due2.setDate(due2.getDate() + 21);
  for (const course of courses) {
    const exists = await prisma.assignment.findFirst({
      where: { courseId: course.id, title: { startsWith: 'Assignment 1' } },
    });
    if (!exists) {
      await prisma.assignment.createMany({
        data: [
          { courseId: course.id, title: `Assignment 1 - ${course.title}`, description: 'First assignment', dueDate: due1 },
          { courseId: course.id, title: `Assignment 2 - ${course.title}`, description: 'Second assignment', dueDate: due2 },
        ],
      });
    }
    log(`Assignments: 2 created for "${course.title}"`);
  }

  // ── 7. Announcements ──────────────────────────────────────────────────────
  process.stdout.write('\n');
  for (const course of courses) {
    const exists = await prisma.announcement.findFirst({ where: { courseId: course.id } });
    if (!exists) {
      await prisma.announcement.create({
        data: {
          courseId: course.id,
          title: 'Welcome to the course!',
          body: `Welcome everyone to "${course.title}". Feel free to ask questions in the chat.`,
        },
      });
    }
    log(`Announcement: welcome post for "${course.title}"`);
  }

  // ── 8. Enrollment Requests & Enrollments ──────────────────────────────────
  process.stdout.write('\n');

  // ali: approved + enrolled in Web Dev, pending in NestJS
  await upsertRequest(students[0].id, courses[0].id, EnrollmentRequestStatus.APPROVED, 'Very interested!');
  await upsertEnrollment(students[0].id, courses[0].id, 'REQUEST');
  log(`ali    -> "${courses[0].title}"  [APPROVED + enrolled, progress 65%]`);

  await upsertRequest(students[0].id, courses[1].id, EnrollmentRequestStatus.PENDING, 'Huge fan of NestJS!');
  log(`ali    -> "${courses[1].title}"  [PENDING]`);

  // lina: approved + enrolled in UI/UX, rejected in Web Dev
  await upsertRequest(students[1].id, courses[2].id, EnrollmentRequestStatus.APPROVED, 'Designer leveling up.');
  await upsertEnrollment(students[1].id, courses[2].id, 'REQUEST');
  log(`lina   -> "${courses[2].title}"  [APPROVED + enrolled, progress 30%]`);

  await upsertRequest(students[1].id, courses[0].id, EnrollmentRequestStatus.REJECTED,
    undefined, 'Course is full. Try next semester.');
  log(`lina   -> "${courses[0].title}"  [REJECTED]`);

  // omar: pending in DSA
  await upsertRequest(students[2].id, courses[3].id, EnrollmentRequestStatus.PENDING, 'Want to improve problem solving.');
  log(`omar   -> "${courses[3].title}"  [PENDING]`);

  // maya: admin direct enrollment in NestJS
  await upsertEnrollment(students[3].id, courses[1].id, 'ADMIN');
  log(`maya   -> "${courses[1].title}"  [ADMIN direct]`);

  // ziad: pending in two courses
  await upsertRequest(students[4].id, courses[2].id, EnrollmentRequestStatus.PENDING);
  await upsertRequest(students[4].id, courses[0].id, EnrollmentRequestStatus.PENDING);
  log(`ziad   -> 2 courses  [PENDING]`);

  // ── 9. Progress ───────────────────────────────────────────────────────────
  await prisma.enrollment.updateMany({ where: { studentId: students[0].id, courseId: courses[0].id }, data: { progress: 65 } });
  await prisma.enrollment.updateMany({ where: { studentId: students[1].id, courseId: courses[2].id }, data: { progress: 30 } });

  // ── 10. Notifications ─────────────────────────────────────────────────────
  process.stdout.write('\n');
  const notifs = [
    { userId: teachers[0].id, type: 'ENROLLMENT_REQUEST',  title: 'New Enrollment Request', body: `Ali wants to join "${courses[1].title}"` },
    { userId: students[0].id, type: 'ENROLLMENT_APPROVED', title: 'Enrollment Approved!',    body: `You were approved for "${courses[0].title}"` },
    { userId: students[1].id, type: 'ENROLLMENT_REJECTED', title: 'Request Declined',        body: `Your request for "${courses[0].title}" was declined: Course is full.` },
  ];
  for (const n of notifs) {
    await prisma.notification.create({ data: n });
  }
  log(`Notifications: ${notifs.length} sample notifications`);

  // ── Summary ───────────────────────────────────────────────────────────────
  process.stdout.write(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Seed complete!

  Accounts (copy-paste ready)
  ─────────────────────────────────────────────────────
  admin@lms.dev     Admin@1234     [ADMIN]
  sara@lms.dev      Teacher@1234   [TEACHER - Web Dev, NestJS]
  karim@lms.dev     Teacher@1234   [TEACHER - UI/UX, DSA]
  ali@lms.dev       Student@1234   [enrolled Web Dev 65% | pending NestJS]
  lina@lms.dev      Student@1234   [enrolled UI/UX 30% | rejected Web Dev]
  omar@lms.dev      Student@1234   [pending DSA]
  maya@lms.dev      Student@1234   [admin-enrolled NestJS]
  ziad@lms.dev      Student@1234   [pending 2 courses]
  ─────────────────────────────────────────────────────
  Courses: 4  |  Lectures: 12  |  Assignments: 8
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => { console.error('\nSeed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
