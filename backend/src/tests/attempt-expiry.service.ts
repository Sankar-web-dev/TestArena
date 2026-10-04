import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AttemptExpiryService {
  private readonly logger = new Logger(
    AttemptExpiryService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Cron('*/30 * * * * *')
  async expireAttempts() {
    const attempts =
      await this.prisma.attempt.findMany({
        where: {
          status: 'IN_PROGRESS',
        },

        include: {
          test: {
            select: {
              duration: true,
            },
          },
        },
      });

    const now = Date.now();

    let expiredCount = 0;

    for (const attempt of attempts) {
      const expiresAt =
        attempt.startedAt.getTime() +
        attempt.test.duration * 60 * 1000;

      if (now >= expiresAt) {
        await this.prisma.attempt.update({
          where: {
            id: attempt.id,
          },

          data: {
            status: 'EXPIRED',
            submittedAt: new Date(),
          },
        });

        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.log(
        `Expired ${expiredCount} attempt(s)`,
      );
    }
  }
}
