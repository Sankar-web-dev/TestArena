import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TestsService } from './tests.service.js';
import { EnterTestDto } from './dto/enter-test.dto.js';
import { SaveAnswerDto } from './dto/save-answer.dto.js';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '../auth/auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('api/student/tests')
@UseGuards(AuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentTestsController {
  constructor(
    private readonly testsService: TestsService,
  ) {}

  @Get()
  async getAvailableTests(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.getAvailableTests(req.user.id);
  }

  @Post(':testId/enter')
  async enterTest(
    @Param('testId', ParseIntPipe) testId: number,
    @Body() dto: EnterTestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.enterTest(
      testId,
      dto.password,
      req.user.id,
    );
  }

  @Get('attempts/:attemptId')
  async getAttemptQuestions(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.getAttemptQuestions(
      attemptId,
      req.user.id,
    );
  }

  @Post('attempts/:attemptId/questions/:questionId/answer')
  async saveAnswer(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: SaveAnswerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.saveAnswer(
      attemptId,
      questionId,
      dto.selectedOption,
      req.user.id,
    );
  }

  @Post('attempts/:attemptId/submit')
  async submitAttempt(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.submitAttempt(
      attemptId,
      req.user.id,
    );
  }
}
