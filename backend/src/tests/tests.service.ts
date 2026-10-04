import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreateTestDto } from './dto/create-test.dto.js';
import { UpdateTestDto } from './dto/update-test.dto.js';
import { CreateQuestionDto } from './dto/create-question.dto.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import { parseQuestionsFromExcel } from './excel/excel-question-parser.js';
import { hashPassword, verifyPassword } from 'better-auth/crypto';

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateAttemptIsActive(
    attemptId: number,
    studentId: string,
  ) {
    const attempt = await this.prisma.attempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        test: {
          select: {
            duration: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException(
        'You cannot access this attempt',
      );
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        attempt.status === 'EXPIRED'
          ? 'The test time has expired'
          : 'This attempt has already been submitted',
      );
    }

    // The attempt clock is purely startedAt + duration.
    // startTime/endTime only gate WHEN a student can
    // enter — someone joining at 17:59 gets their full
    // 20 minutes, so expiry must not be capped here.
    const expiresAt =
      attempt.startedAt.getTime() +
      attempt.test.duration * 60 * 1000;

    const now = Date.now();

    if (now >= expiresAt) {
      await this.prisma.attempt.update({
        where: {
          id: attemptId,
        },
        data: {
          status: 'EXPIRED',
          submittedAt: new Date(),
        },
      });

      throw new BadRequestException(
        'The test time has expired',
      );
    }

    return {
      attempt,
      expiresAt: new Date(expiresAt),
    };
  }

  async createTest(
    dto: CreateTestDto,
    userId: string,
  ) {
    const passwordHash = await hashPassword(dto.password);

    return this.prisma.test.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        passwordHash,
        createdById: userId,
        startTime: dto.startTime
          ? new Date(dto.startTime)
          : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        status: true,
        createdById: true,
        createdAt: true,
      },
    });
  }

  async updateTest(
    testId: number,
    dto: UpdateTestDto,
    userId: string,
  ) {
    const test = await this.prisma.test.findFirst({
      where: {
        id: testId,
        createdById: userId,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found or you do not have permission',
      );
    }

    if (test.status === 'LIVE' || test.status === 'ENDED') {
      throw new BadRequestException(
        'Cannot edit a test that is live or has ended',
      );
    }

    const data: Prisma.TestUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.duration !== undefined) {
      data.duration = dto.duration;
    }
    if (dto.password !== undefined && dto.password !== '') {
      data.passwordHash = await hashPassword(dto.password);
    }
    if (dto.startTime !== undefined) {
      data.startTime = dto.startTime
        ? new Date(dto.startTime)
        : null;
    }
    if (dto.endTime !== undefined) {
      data.endTime = dto.endTime
        ? new Date(dto.endTime)
        : null;
    }
     

    return this.prisma.test.update({
      where: { id: testId },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        startTime: true,
        endTime: true,
        status: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
   

  async deleteTest(testId: number, userId: string) {
    const test = await this.prisma.test.findFirst({
      where: {
        id: testId,
        createdById: userId,
      },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found or you do not have permission',
      );
    }

    if (test._count.attempts > 0) {
      throw new BadRequestException(
        'Cannot delete a test that already has student attempts',
      );
    }

    await this.prisma.test.delete({
      where: { id: testId },
    });

    return { message: 'Test deleted' };
  }

  async getMyTests(userId: string) {
  return this.prisma.test.findMany({
    where: {
      createdById: userId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      duration: true,
      status: true,
      startTime: true,
      endTime: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

  async createQuestion(
    testId: number,
    dto: CreateQuestionDto,
    userId: string,
  ) {
    // Make sure the test exists and belongs to this admin/teacher
    const test = await this.prisma.test.findFirst({
      where: {
        id: testId,
        createdById: userId,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found or you do not have permission',
      );
    }

    return this.prisma.question.create({
      data: {
        testId,
        questionText: dto.questionText,
        marks: dto.marks,
        correctOption: dto.correctOption,
        status: 'DRAFT',

        options: {
          create: dto.options.map((option) => ({
            optionKey: option.optionKey,
            optionText: option.optionText,
          })),
        },
      },

      select: {
        id: true,
        testId: true,
        questionText: true,
        marks: true,
        status: true,
        correctOption: true,
        createdAt: true,

        options: {
          select: {
            id: true,
            optionKey: true,
            optionText: true,
          },
        },
      },
    });
  }

  async getQuestions(
    testId: number,
    userId: string,
  ) {
    const test = await this.prisma.test.findFirst({
      where: {
        id: testId,
        createdById: userId,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found or you do not have permission',
      );
    }

    return this.prisma.question.findMany({
      where: {
        testId,
      },

      include: {
        options: true,
      },

      orderBy: {
        id: 'asc',
      },
    });
  }

  async updateQuestion(
    questionId: number,
    dto: UpdateQuestionDto,
    userId: string,
  ) {
    const question =
      await this.prisma.question.findFirst({
        where: {
          id: questionId,
          test: {
            createdById: userId,
          },
        },
      });

    if (!question) {
      throw new NotFoundException(
        'Question not found or you do not have permission',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.options) {
        await tx.questionOption.deleteMany({
          where: {
            questionId,
          },
        });
      }

      return tx.question.update({
        where: {
          id: questionId,
        },

        data: {
          ...(dto.questionText !== undefined && {
            questionText: dto.questionText,
          }),

          ...(dto.marks !== undefined && {
            marks: dto.marks,
          }),

          ...(dto.correctOption !== undefined && {
            correctOption: dto.correctOption,
          }),

          ...(dto.options && {
            options: {
              create: dto.options.map((option) => ({
                optionKey: option.optionKey,
                optionText: option.optionText,
              })),
            },
          }),

          // Editing sends the question back to draft
          status: 'DRAFT',
        },

        include: {
          options: true,
        },
      });
    });
  }

  async deleteQuestion(
    questionId: number,
    userId: string,
  ) {
    const question =
      await this.prisma.question.findFirst({
        where: {
          id: questionId,
          test: {
            createdById: userId,
          },
        },
      });

    if (!question) {
      throw new NotFoundException(
        'Question not found or you do not have permission',
      );
    }

    await this.prisma.question.delete({
      where: {
        id: questionId,
      },
    });

    return {
      message: 'Question deleted successfully',
    };
  }

  async verifyQuestion(
    questionId: number,
    userId: string,
  ) {
    const question =
      await this.prisma.question.findFirst({
        where: {
          id: questionId,
          test: {
            createdById: userId,
          },
        },
      });

    if (!question) {
      throw new NotFoundException(
        'Question not found or you do not have permission',
      );
    }

    return this.prisma.question.update({
      where: {
        id: questionId,
      },

      data: {
        status: 'VERIFIED',
      },

      include: {
        options: true,
      },
    });
  }

  async verifyAllQuestions(testId: number, userId: string) {
    const test = await this.prisma.test.findFirst({
      where: {
        id: testId,
        createdById: userId,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found or you do not have permission',
      );
    }

    const result = await this.prisma.question.updateMany({
      where: {
        testId,
        status: {
          not: 'VERIFIED',
        },
      },
      data: {
        status: 'VERIFIED',
      },
    });

    return {
      message: `${result.count} question(s) verified`,
      count: result.count,
    };
  }

  async rejectQuestion(
    questionId: number,
    userId: string,
  ) {
    const question =
      await this.prisma.question.findFirst({
        where: {
          id: questionId,
          test: {
            createdById: userId,
          },
        },
      });

    if (!question) {
      throw new NotFoundException(
        'Question not found or you do not have permission',
      );
    }

    return this.prisma.question.update({
      where: {
        id: questionId,
      },

      data: {
        status: 'REJECTED',
      },

      include: {
        options: true,
      },
    });
  }

  async importQuestionsFromExcel(
    testId: number,
    buffer: Buffer,
    userId: string,
  ) {
    const test = await this.prisma.test.findFirst({
      where: {
        id: testId,
        createdById: userId,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found or you do not have permission',
      );
    }

    const questions = parseQuestionsFromExcel(buffer);

    if (questions.length === 0) {
      throw new BadRequestException(
        'Excel file contains no questions',
      );
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const createdQuestions = [];

        for (const question of questions) {
          const created = await tx.question.create({
            data: {
              testId,
              questionText: question.questionText,
              marks: question.marks,
              correctOption: question.correctOption,
              status: 'DRAFT',

              options: {
                create: question.options.map((option) => ({
                  optionKey: option.optionKey,
                  optionText: option.optionText,
                })),
              },
            },

            include: {
              options: true,
            },
          });

          createdQuestions.push(created);
        }

        return createdQuestions;
      },
    );

    return {
      message: 'Questions imported successfully',
      count: result.length,
      questions: result,
    };
  }

  async publishTest(
    testId: number,
    userId: string,
  ) {
    const test = await this.prisma.test.findFirst({
      where: {
        id: testId,
        createdById: userId,
      },
      include: {
        questions: true,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found or you do not have permission',
      );
    }

    if (test.questions.length === 0) {
      throw new BadRequestException(
        'Cannot publish a test without questions',
      );
    }

    const unverifiedQuestions =
      test.questions.filter(
        (question) =>
          question.status !== 'VERIFIED',
      );

    if (unverifiedQuestions.length > 0) {
      throw new BadRequestException(
        `Cannot publish. ${unverifiedQuestions.length} question(s) are not verified.`,
      );
    }

    return this.prisma.test.update({
      where: {
        id: testId,
      },
      data: {
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        status: true,
        startTime: true,
        endTime: true,
        createdById: true,
        updatedAt: true,
      },
    });
  }

  async getAvailableTests(studentId: string) {
    const tests = await this.prisma.test.findMany({
      where: {
        status: 'PUBLISHED',
      },

      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        _count: {
          select: { questions: true },
        },
        attempts: {
          where: { studentId },
          select: { id: true, status: true },
          take: 1,
        },
      },

      orderBy: {
        startTime: 'asc',
      },
    });

    return tests.map(({ attempts, ...test }) => ({
      ...test,
      attempt: attempts[0] ?? null,
    }));
  }

  async enterTest(
    testId: number,
    password: string | undefined,
    studentId: string,
  ) {
    const test = await this.prisma.test.findUnique({
      where: {
        id: testId,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found',
      );
    }

    if (test.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'This test is not available',
      );
    }

    const now = new Date();

    if (test.startTime && now < test.startTime) {
      throw new BadRequestException(
        'This test has not started yet',
      );
    }

    if (test.endTime && now > test.endTime) {
      throw new BadRequestException(
        'This test has already ended',
      );
    }

    // Look up the student's attempt first: submitted or
    // expired attempts are blocked, and an in-progress
    // attempt resumes without re-asking the password.
    const existingAttempt =
      await this.prisma.attempt.findUnique({
        where: {
          testId_studentId: {
            testId,
            studentId,
          },
        },
      });

    if (existingAttempt) {
      if (existingAttempt.status === 'SUBMITTED') {
        throw new BadRequestException(
          'You have already submitted this test',
        );
      }

      if (existingAttempt.status === 'EXPIRED') {
        throw new BadRequestException(
          'Your attempt has expired',
        );
      }

      return {
        message: 'Existing attempt found',
        attemptId: existingAttempt.id,
        startedAt: existingAttempt.startedAt,
        status: existingAttempt.status,
      };
    }

    if (!password) {
      throw new BadRequestException(
        'Test password is required',
      );
    }

    const passwordValid =
      await verifyPassword({
        hash: test.passwordHash,
        password,
      });

    if (!passwordValid) {
      throw new BadRequestException(
        'Invalid test password',
      );
    }

    try {
      const attempt = await this.prisma.$transaction(
        async (tx) => {
          const newAttempt = await tx.attempt.create({
            data: {
              testId,
              studentId,
              status: 'IN_PROGRESS',
            },
          });

          const questions = await tx.question.findMany({
            where: {
              testId,
              status: 'VERIFIED',
            },
            include: {
              options: true,
            },
          });

          for (const question of questions) {
            const snapshot =
              await tx.attemptQuestion.create({
                data: {
                  attemptId: newAttempt.id,
                  questionId: question.id,
                  questionText: question.questionText,
                  marks: question.marks,
                  correctOption:
                    question.correctOption ?? '',
                },
              });

            await tx.attemptQuestionOption.createMany({
              data: question.options.map((option) => ({
                attemptQuestionId: snapshot.id,
                optionKey: option.optionKey,
                optionText: option.optionText,
              })),
            });
          }

          return newAttempt;
        },
      );

      return {
        message: 'Test entered successfully',
        attemptId: attempt.id,
        startedAt: attempt.startedAt,
        duration: test.duration,
      };
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const retryAttempt =
          await this.prisma.attempt.findUnique({
            where: {
              testId_studentId: {
                testId,
                studentId,
              },
            },
          });

        if (retryAttempt) {
          if (retryAttempt.status === 'SUBMITTED') {
            throw new BadRequestException(
              'You have already submitted this test',
            );
          }

          if (retryAttempt.status === 'EXPIRED') {
            throw new BadRequestException(
              'Your attempt has expired',
            );
          }

          return {
            message: 'Existing attempt found',
            attemptId: retryAttempt.id,
            startedAt: retryAttempt.startedAt,
            status: retryAttempt.status,
          };
        }
      }

      throw error;
    }
  }

  async getAttemptQuestions(
    attemptId: number,
    studentId: string,
  ) {
    const { expiresAt } =
      await this.validateAttemptIsActive(
        attemptId,
        studentId,
      );

    const attempt =
      await this.prisma.attempt.findUniqueOrThrow({
        where: {
          id: attemptId,
        },
        include: {
          test: {
            select: {
              title: true,
              description: true,
            },
          },
          questions: {
            select: {
              id: true,
              questionId: true,
              questionText: true,
              marks: true,
              options: {
                select: {
                  optionKey: true,
                  optionText: true,
                },
                orderBy: {
                  id: 'asc',
                },
              },
            },
            orderBy: {
              id: 'asc',
            },
          },
          answers: {
            select: {
              questionId: true,
              selectedOption: true,
            },
          },
        },
      });

    return {
      attemptId: attempt.id,
      testId: attempt.testId,
      startedAt: attempt.startedAt,
      expiresAt,

      test: {
        title: attempt.test.title,
        description: attempt.test.description,
      },

      questions: attempt.questions.map((question) => ({
        id: question.id,
        questionId: question.questionId,
        questionText: question.questionText,
        marks: question.marks,

        selectedOption:
          attempt.answers.find(
            (answer) =>
              answer.questionId === question.questionId,
          )?.selectedOption ?? null,

        options: question.options.map((option) => ({
          optionKey: option.optionKey,
          optionText: option.optionText,
        })),
      })),
    };
  }

  async saveAnswer(
    attemptId: number,
    questionId: number,
    selectedOption: string,
    studentId: string,
  ) {
    await this.validateAttemptIsActive(
      attemptId,
      studentId,
    );

    const snapshotQuestion =
      await this.prisma.attemptQuestion.findUnique({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId,
          },
        },
        select: {
          options: {
            select: {
              optionKey: true,
            },
          },
        },
      });

    if (!snapshotQuestion) {
      throw new BadRequestException(
        'Question does not belong to this test',
      );
    }

    const validOption = snapshotQuestion.options.some(
      (option) =>
        option.optionKey ===
        selectedOption.toUpperCase(),
    );

    if (!validOption) {
      throw new BadRequestException(
        'Invalid option',
      );
    }

    await this.prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },

      create: {
        attemptId,
        questionId,
        selectedOption:
          selectedOption.toUpperCase(),
      },

      update: {
        selectedOption:
          selectedOption.toUpperCase(),
      },
    });

    return {
      message: 'Answer saved',
    };
  }

  async submitAttempt(
    attemptId: number,
    studentId: string,
  ) {
    await this.validateAttemptIsActive(
      attemptId,
      studentId,
    );

    const questions =
      await this.prisma.attemptQuestion.findMany({
        where: {
          attemptId,
        },
      });

    const answers = await this.prisma.answer.findMany({
      where: {
        attemptId,
      },
    });

    let score = 0;
    let totalMarks = 0;

    for (const question of questions) {
      totalMarks += question.marks;

      const answer = answers.find(
        (item) =>
          item.questionId === question.questionId,
      );

      if (
        answer &&
        answer.selectedOption.toUpperCase() ===
          question.correctOption.toUpperCase()
      ) {
        score += question.marks;
      }
    }

    const percentage =
      totalMarks > 0
        ? Number(
            ((score / totalMarks) * 100).toFixed(2),
          )
        : 0;

    await this.prisma.$transaction(async (tx) => {
      const currentAttempt =
        await tx.attempt.findUnique({
          where: {
            id: attemptId,
          },
        });

      if (
        !currentAttempt ||
        currentAttempt.status !== 'IN_PROGRESS'
      ) {
        throw new BadRequestException(
          'Attempt has already been submitted',
        );
      }

      await tx.attempt.update({
        where: {
          id: attemptId,
        },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      return tx.result.create({
        data: {
          attemptId,
          score,
          totalMarks,
          percentage,
        },
      });
    });

    return {
      message: 'Test submitted successfully',
    };
  }

  async getTestResults(
    testId: number,
    adminId: string,
  ) {
    const test = await this.prisma.test.findUnique({
      where: {
        id: testId,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found',
      );
    }

    if (test.createdById !== adminId) {
      throw new ForbiddenException(
        'You cannot view this test',
      );
    }

    const results =
      await this.prisma.result.findMany({
        where: {
          attempt: {
            testId,
          },
        },

        select: {
          id: true,
          score: true,
          totalMarks: true,
          percentage: true,
          createdAt: true,

          attempt: {
            select: {
              id: true,
              startedAt: true,
              submittedAt: true,

              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },

        orderBy: [
          {
            score: 'desc',
          },
          {
            createdAt: 'asc',
          },
        ],
      });

    return {
      test: {
        id: test.id,
        title: test.title,
        duration: test.duration,
      },

      totalStudents: results.length,

      results,
    };
  }

  async getLeaderboard(
    testId: number,
    adminId: string,
  ) {
    const test = await this.prisma.test.findUnique({
      where: {
        id: testId,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found',
      );
    }

    if (test.createdById !== adminId) {
      throw new ForbiddenException(
        'You cannot view this leaderboard',
      );
    }

    const results =
      await this.prisma.result.findMany({
        where: {
          attempt: {
            testId,
          },
        },

        select: {
          score: true,
          totalMarks: true,
          percentage: true,

          attempt: {
            select: {
              student: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },

        orderBy: [
          {
            score: 'desc',
          },
          {
            createdAt: 'asc',
          },
        ],
      });

    return results.map((result, index) => ({
      rank: index + 1,

      student: result.attempt.student,

      score: result.score,

      totalMarks: result.totalMarks,

      percentage: result.percentage,
    }));
  }

  async getTestReport(
    testId: number,
    adminId: string,
  ) {
    const test = await this.prisma.test.findUnique({
      where: {
        id: testId,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found',
      );
    }

    if (test.createdById !== adminId) {
      throw new ForbiddenException(
        'You cannot view this report',
      );
    }

    const attempts =
      await this.prisma.attempt.findMany({
        where: {
          testId,
        },

        select: {
          status: true,

          result: {
            select: {
              score: true,
              totalMarks: true,
              percentage: true,
            },
          },
        },
      });

    const submitted = attempts.filter(
      (a) => a.status === 'SUBMITTED',
    );

    const expired = attempts.filter(
      (a) => a.status === 'EXPIRED',
    );

    const inProgress = attempts.filter(
      (a) => a.status === 'IN_PROGRESS',
    );

    const scores = submitted
      .map((a) => a.result?.percentage)
      .filter(
        (score): score is number =>
          score !== undefined && score !== null,
      );

    const averageScore =
      scores.length > 0
        ? Number(
            (
              scores.reduce(
                (sum, value) => sum + value,
                0,
              ) / scores.length
            ).toFixed(2),
          )
        : 0;

    return {
      test: {
        id: test.id,
        title: test.title,
        duration: test.duration,
        status: test.status,
      },

      statistics: {
        totalStudents: attempts.length,

        submitted: submitted.length,

        expired: expired.length,

        inProgress: inProgress.length,

        averageScore,

        highestScore:
          scores.length > 0
            ? Math.max(...scores)
            : 0,

        lowestScore:
          scores.length > 0
            ? Math.min(...scores)
            : 0,
      },
    };
  }

  async exportResults(
    testId: number,
    adminId: string,
  ) {
    const test = await this.prisma.test.findUnique({
      where: {
        id: testId,
      },
    });

    if (!test) {
      throw new NotFoundException(
        'Test not found',
      );
    }

    if (test.createdById !== adminId) {
      throw new ForbiddenException(
        'You cannot export this test',
      );
    }

    const results =
      await this.prisma.result.findMany({
        where: {
          attempt: {
            testId,
          },
        },

        select: {
          score: true,
          totalMarks: true,
          percentage: true,

          attempt: {
            select: {
              submittedAt: true,

              student: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },

        orderBy: {
          score: 'desc',
        },
      });

    return results.map((result, index) => ({
      Rank: index + 1,

      Name: result.attempt.student.name,

      Email: result.attempt.student.email ?? '',

      Score: result.score,

      TotalMarks: result.totalMarks,

      Percentage: result.percentage,

      SubmittedAt:
        result.attempt.submittedAt?.toISOString() ?? '',
    }));
  }
}