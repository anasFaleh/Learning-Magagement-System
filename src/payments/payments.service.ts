// payments.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private coursesService: CoursesService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    // 1. Verify course exists and is active
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      include: { price: true },
    });
    if (!course || !course.isActive)
      throw new NotFoundException('Course not available');

    // 2. Ensure user is not already enrolled
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: userId, courseId: dto.courseId },
      },
    });
    if (existingEnrollment) throw new BadRequestException('Already enrolled');

    // 3. If course is free, enroll directly (no payment needed)
    const price = course.price;
    if (!price || price.amount === 0) {
      await this.coursesService.enrollStudent(dto.courseId, {
        studentId: userId,
      });
      return { free: true, message: 'Enrolled successfully' };
    }

    // 4. Calculate price after coupon
    let finalAmount = price.amount;
    let couponId: string | undefined;
    let discountAmount = 0;

    if (dto.couponCode) {
      const coupon = await this.validateCoupon(dto.couponCode, userId);
      discountAmount = Math.round(
        (finalAmount * coupon.discountPercentage) / 100,
      );
      finalAmount = finalAmount - discountAmount;
      couponId = coupon.id;
    }

    // 5. Create a pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        courseId: dto.courseId,
        amount: price.amount,
        currency: price.currency,
        discountAmount,
        finalAmount,
        couponId,
        status: 'PENDING',
      },
    });

    // 6. Create payment intent with external gateway (Stripe)
    const clientSecret = await this.createGatewayPaymentIntent(payment);

    return {
      paymentId: payment.id,
      clientSecret,
      amount: finalAmount,
      currency: price.currency,
    };
  }

  private async validateCoupon(code: string, userId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive)
      throw new BadRequestException('Invalid coupon');

    // Check usage limits
    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses)
      throw new BadRequestException('Coupon usage limit reached');

    // Check user assignment
    const assignedUsers = await this.prisma.couponUser.findMany({
      where: { couponId: coupon.id },
    });
    if (assignedUsers.length > 0) {
      const isAssigned = assignedUsers.some((u) => u.userId === userId);
      if (!isAssigned)
        throw new BadRequestException('Coupon not available for your account');
    }

    return coupon;
  }

  private async createGatewayPaymentIntent(payment: any): Promise<string> {
    // Integration with Stripe (or any gateway)
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const intent = await stripe.paymentIntents.create({
    //   amount: payment.finalAmount,
    //   currency: payment.currency,
    //   metadata: { paymentId: payment.id },
    // });
    // return intent.client_secret;
    // For demo, return a fake secret
    return `pi_demo_${payment.id}`;
  }

  // Called by webhook after successful payment
  async confirmPayment(gatewayPaymentId: string, gatewayMetadata: any) {
    // Find payment by gatewayPaymentId (stored after intent creation) or by metadata
    // Here we find by metadata.paymentId
    const paymentId = gatewayMetadata?.paymentId;
    if (!paymentId) throw new BadRequestException('Missing payment reference');

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'PENDING')
      throw new BadRequestException('Payment already processed');

    // Update payment status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        gatewayPaymentId,
        gatewayMetadata,
        coupon: payment.couponId
          ? { update: { usesCount: { increment: 1 } } }
          : undefined,
      },
    });

    // Enroll the student in the course
    await this.coursesService.enrollStudent(payment.courseId, {
      studentId: payment.userId,
    });

    return { success: true };
  }

  // Get own payment history (student)
  async getUserPayments(userId: string, page: number, limit: number) {
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        include: { course: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);
    return { payments, total, page, limit };
  }

  // Admin: get all payments
  async getAllPayments(query: {
    page: number;
    limit: number;
    courseId?: string;
    status?: string;
  }) {
    const where: any = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.status) where.status = query.status;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, email: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { payments, total, page: query.page, limit: query.limit };
  }
}
