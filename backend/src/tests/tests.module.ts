import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller.js';
import { StudentTestsController } from './student-tests.controller.js';
import { TestsService } from './tests.service.js';
import { AttemptExpiryService } from './attempt-expiry.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [TestsController, StudentTestsController],
  providers: [TestsService, AttemptExpiryService]
})
export class TestsModule {}
