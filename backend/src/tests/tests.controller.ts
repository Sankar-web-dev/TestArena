import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { TestsService } from './tests.service.js';
import { CreateTestDto } from './dto/create-test.dto.js';
import { UpdateTestDto } from './dto/update-test.dto.js';
import { CreateQuestionDto } from './dto/create-question.dto.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import { buildQuestionTemplate } from './excel/question-template.js';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '../auth/auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('api/tests')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class TestsController {
  constructor(
    private readonly testsService: TestsService,
  ) {}

  @Post()
  async createTest(
    @Body() dto: CreateTestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.createTest(
      dto,
      req.user.id,
    );
  }

  @Get()
  async getMyTests(@Req() req: AuthenticatedRequest) {
    return this.testsService.getMyTests(req.user.id);
  }

  @Put(':testId')
  async updateTest(
    @Param('testId', ParseIntPipe) testId: number,
    @Body() dto: UpdateTestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.updateTest(
      testId,
      dto,
      req.user.id,
    );
  }

  @Delete(':testId')
  async deleteTest(
    @Param('testId', ParseIntPipe) testId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.deleteTest(
      testId,
      req.user.id,
    );
  }

  @Put(':testId/publish')
  async publishTest(
    @Param('testId', ParseIntPipe) testId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.publishTest(
      testId,
      req.user.id,
    );
  }

  @Get(':testId/results')
  async getTestResults(
    @Param('testId', ParseIntPipe) testId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.getTestResults(
      testId,
      req.user.id,
    );
  }

  @Get(':testId/leaderboard')
  async getLeaderboard(
    @Param('testId', ParseIntPipe) testId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.getLeaderboard(
      testId,
      req.user.id,
    );
  }

  @Get(':testId/report')
  async getTestReport(
    @Param('testId', ParseIntPipe) testId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.getTestReport(
      testId,
      req.user.id,
    );
  }

  @Get(':testId/results/export')
  async exportResults(
    @Param('testId', ParseIntPipe) testId: number,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const rows = await this.testsService.exportResults(
      testId,
      req.user.id,
    );

    const headers = [
      'Rank',
      'Name',
      'Email',
      'Score',
      'TotalMarks',
      'Percentage',
      'SubmittedAt',
    ];

    const escapeCsv = (value: unknown) => {
      const text = String(value ?? '');

      return `"${text.replaceAll('"', '""')}"`;
    };

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) =>
            escapeCsv(
              row[header as keyof typeof row],
            ),
          )
          .join(','),
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="test-${testId}-results.csv"`,
    );

    res.send(csv);
  }

  // -----------------------------
  // QUESTIONS
  // -----------------------------

  @Post(':testId/questions')
  async createQuestion(
    @Param('testId', ParseIntPipe) testId: number,
    @Body() dto: CreateQuestionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.createQuestion(
      testId,
      dto,
      req.user.id,
    );
  }

  @Post(':testId/questions/import')
  @UseInterceptors(FileInterceptor('file'))
  async importQuestions(
    @Param('testId', ParseIntPipe) testId: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Excel file is required',
      );
    }

    return this.testsService.importQuestionsFromExcel(
      testId,
      file.buffer,
      req.user.id,
    );
  }

  @Get('questions/template')
  async downloadQuestionTemplate(@Res() res: Response) {
    const buffer = buildQuestionTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="questions-template.xlsx"',
    );
    res.send(buffer);
  }

  @Get(':testId/questions')
  async getQuestions(
    @Param('testId', ParseIntPipe) testId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.getQuestions(
      testId,
      req.user.id,
    );
  }

  @Patch('questions/:questionId')
  async updateQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: UpdateQuestionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.updateQuestion(
      questionId,
      dto,
      req.user.id,
    );
  }

  @Delete('questions/:questionId')
  async deleteQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.deleteQuestion(
      questionId,
      req.user.id,
    );
  }

  @Put(':testId/questions/verify-all')
  async verifyAllQuestions(
    @Param('testId', ParseIntPipe) testId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.verifyAllQuestions(
      testId,
      req.user.id,
    );
  }

  @Put('questions/:questionId/verify')
  async verifyQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.verifyQuestion(
      questionId,
      req.user.id,
    );
  }

  @Put('questions/:questionId/reject')
  async rejectQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.testsService.rejectQuestion(
      questionId,
      req.user.id,
    );
  }
}