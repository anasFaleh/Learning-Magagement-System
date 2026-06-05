/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Lecture` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Lecture_title_key" ON "Lecture"("title");
