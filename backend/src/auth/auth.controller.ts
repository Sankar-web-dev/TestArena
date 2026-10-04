import {
  All,
  Controller,
  Get,
  Inject,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Request, Response } from 'express';
import type { createAuth } from './auth.js';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';
import { Roles } from './roles.decorator.js';

@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject('BETTER_AUTH')
    private readonly auth: ReturnType<typeof createAuth>,
  ) {}

  // IMPORTANT: Put specific route BEFORE wildcard
  @Get('protected-test')
  @UseGuards(AuthGuard)
  async protectedTest(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Authentication successful',
      user: req.user,
    };
  }
  @Get('me')
  async getMe(@Req() req: Request) {
    const headers = new Headers();

    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(
          key,
          Array.isArray(value) ? value.join(',') : value,
        );
      }
    });

    const session = await this.auth.api.getSession({
      headers,
    });

    if (!session) {
      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user: session.user,
      session: session.session,
    };
  }

  @Get('admin-test')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminTest(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Admin authorization successful',
      user: req.user,
    };
  }

  @Put('setup-admin')
  @UseGuards(AuthGuard)
  async setupAdmin(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;

    if (!userId) {
      return {
        message: 'You must be logged in',
      };
    }

    return {
      message: 'Temporary admin setup endpoint',
      userId,
    };
  }

  // Better Auth routes must stay LAST
  @All('*splat')
  async handleAuth(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const url = new URL(
      req.originalUrl,
      `${req.protocol}://${req.get('host')}`,
    );

    const headers = new Headers();

    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(
          key,
          Array.isArray(value) ? value.join(',') : value,
        );
      }
    });

    const request = new Request(url, {
      method: req.method,
      headers,
      body:
        req.method !== 'GET' && req.method !== 'HEAD'
          ? JSON.stringify(req.body)
          : undefined,
    });

    const response = await this.auth.handler(request);

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);

    return res.send(await response.text());
  }
}