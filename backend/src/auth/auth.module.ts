import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthController } from './auth.controller.js';
import { createAuth } from './auth.js';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    {
      provide: 'BETTER_AUTH',
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => {
        return createAuth(prisma);
      },
    },
  ],
  exports: ['BETTER_AUTH'],
})
export class AuthModule {}