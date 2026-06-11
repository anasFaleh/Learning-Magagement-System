-- Drop payment-related tables (removes Stripe dependency)
ALTER TABLE "Enrollment" DROP COLUMN IF EXISTS "paymentId";
DROP TABLE IF EXISTS "CouponUser";
DROP TABLE IF EXISTS "Payment";
DROP TABLE IF EXISTS "Coupon";
DROP TABLE IF EXISTS "CoursePrice";
DROP TYPE IF EXISTS "PaymentStatus";

-- Create EnrollmentRequest
CREATE TYPE "EnrollmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "EnrollmentRequest" (
    "id"        TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId"  TEXT NOT NULL,
    "status"    "EnrollmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message"   TEXT,
    "note"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EnrollmentRequest_studentId_courseId_key" ON "EnrollmentRequest"("studentId", "courseId");
CREATE INDEX "EnrollmentRequest_courseId_status_idx" ON "EnrollmentRequest"("courseId", "status");
CREATE INDEX "EnrollmentRequest_studentId_idx" ON "EnrollmentRequest"("studentId");

ALTER TABLE "EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
