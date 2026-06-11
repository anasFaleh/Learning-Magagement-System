import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLectureDto, UpdateLectureDto } from './dto/lecture.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Injectable()
export class LearningContentService {
  constructor(private prisma: PrismaService) {}

  // ─── Lectures ────────────────────────────────────────────────────────────

  async getLectures(courseId: string) {
    return this.prisma.lecture.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getLectureById(courseId: string, lectureId: string) {
    const lecture = await this.prisma.lecture.findFirst({
      where: { id: lectureId, courseId },
    });
    if (!lecture) throw new NotFoundException('Lecture not found');
    return lecture;
  }

  async createLecture(courseId: string, dto: CreateLectureDto) {
    const existing = await this.prisma.lecture.findUnique({
      where: { title: dto.title },
    });
    if (existing) throw new ConflictException('Lecture title must be unique');

    return this.prisma.lecture.create({
      data: { ...dto, courseId },
    });
  }

  async updateLecture(
    courseId: string,
    lectureId: string,
    dto: UpdateLectureDto,
  ) {
    await this.getLectureById(courseId, lectureId);
    return this.prisma.lecture.update({
      where: { id: lectureId },
      data: dto,
    });
  }

  async deleteLecture(courseId: string, lectureId: string) {
    await this.getLectureById(courseId, lectureId);
    return this.prisma.lecture.delete({ where: { id: lectureId } });
  }

  // ─── Announcements ───────────────────────────────────────────────────────

  async getAnnouncements(courseId: string) {
    return this.prisma.announcement.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAnnouncement(courseId: string, dto: CreateAnnouncementDto) {
    const body = (dto as any).content ?? (dto as any).body;
    if (!body)
      throw new BadRequestException('Announcement body/content is required');

    return this.prisma.announcement.create({
      data: { title: dto.title, body, courseId },
    });
  }

  async updateAnnouncement(
    courseId: string,
    announcementId: string,
    dto: UpdateAnnouncementDto,
  ) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, courseId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    const body = (dto as any).content ?? (dto as any).body;

    return this.prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(body !== undefined && { body }),
      },
    });
  }

  async deleteAnnouncement(courseId: string, announcementId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, courseId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return this.prisma.announcement.delete({ where: { id: announcementId } });
  }

  // ─── Assignments ─────────────────────────────────────────────────────────

  async getAssignments(courseId: string) {
    return this.prisma.assignment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAssignmentById(courseId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, courseId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async createAssignment(courseId: string, dto: CreateAssignmentDto) {
    return this.prisma.assignment.create({
      data: { ...dto, courseId },
    });
  }

  async updateAssignment(
    courseId: string,
    assignmentId: string,
    dto: UpdateAssignmentDto,
  ) {
    await this.getAssignmentById(courseId, assignmentId);
    return this.prisma.assignment.update({
      where: { id: assignmentId },
      data: dto,
    });
  }

  async deleteAssignment(courseId: string, assignmentId: string) {
    await this.getAssignmentById(courseId, assignmentId);
    return this.prisma.assignment.delete({ where: { id: assignmentId } });
  }

  // ─── Submissions ─────────────────────────────────────────────────────────

  async submitAssignment(
    courseId: string,
    assignmentId: string,
    studentId: string,
    dto: SubmitAssignmentDto,
  ) {
    const assignment = await this.getAssignmentById(courseId, assignmentId);

    // ✅ Fix: check dueDate before accepting submission
    if (
      (assignment as any).dueDate &&
      new Date() > new Date((assignment as any).dueDate)
    ) {
      throw new BadRequestException('Submission deadline has passed');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment)
      throw new ForbiddenException('You are not enrolled in this course');

    // ✅ Fix: prevent duplicate submissions
    const existing = await this.prisma.submission.findFirst({
      where: { assignmentId, studentId },
    });
    if (existing)
      throw new ConflictException('You have already submitted this assignment');

    return this.prisma.submission.create({
      data: { ...dto, assignmentId, studentId },
    });
  }

  async getSubmissions(courseId: string, assignmentId: string) {
    await this.getAssignmentById(courseId, assignmentId);
    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getStudentSubmission(
    courseId: string,
    assignmentId: string,
    studentId: string,
  ) {
    await this.getAssignmentById(courseId, assignmentId);
    const submission = await this.prisma.submission.findFirst({
      where: { assignmentId, studentId },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    return submission;
  }

  // ─── Quizzes ─────────────────────────────────────────────────────────────

  async getQuizzes(courseId: string) {
    return this.prisma.quiz.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getQuizById(courseId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, courseId },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async createQuiz(courseId: string, dto: CreateQuizDto) {
    const rawDto = dto as any;
    const formUrl = rawDto.formUrl ?? rawDto.questionsUrl;

    // ✅ Fix: validate that formUrl exists
    if (!formUrl) throw new BadRequestException('formUrl is required');

    return this.prisma.quiz.create({
      data: { title: rawDto.title, formUrl, courseId },
    });
  }

  async updateQuiz(courseId: string, quizId: string, dto: UpdateQuizDto) {
    await this.getQuizById(courseId, quizId);
    const updateData: any = { ...dto };
    return this.prisma.quiz.update({
      where: { id: quizId },
      data: updateData,
    });
  }

  async deleteQuiz(courseId: string, quizId: string) {
    await this.getQuizById(courseId, quizId);
    return this.prisma.quiz.delete({ where: { id: quizId } });
  }
}
