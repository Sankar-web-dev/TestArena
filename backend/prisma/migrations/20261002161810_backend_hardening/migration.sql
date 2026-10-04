-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- CreateIndex
CREATE INDEX "Question_testId_idx" ON "Question"("testId");

-- CreateIndex
CREATE INDEX "Question_testId_status_idx" ON "Question"("testId", "status");

-- CreateIndex
CREATE INDEX "Result_score_idx" ON "Result"("score");

-- CreateIndex
CREATE INDEX "Result_percentage_idx" ON "Result"("percentage");

-- CreateIndex
CREATE INDEX "Test_createdById_idx" ON "Test"("createdById");

-- CreateIndex
CREATE INDEX "Test_status_idx" ON "Test"("status");

-- CreateIndex
CREATE INDEX "Test_startTime_idx" ON "Test"("startTime");

-- CreateIndex
CREATE INDEX "Test_endTime_idx" ON "Test"("endTime");
