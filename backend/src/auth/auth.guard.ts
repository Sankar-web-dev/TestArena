import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import type { createAuth } from './auth.js';

type AuthInstance = ReturnType<typeof createAuth>;

export interface AuthenticatedRequest extends Request {
  user: AuthInstance['$Infer']['Session']['user'];
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('BETTER_AUTH')
    private readonly auth: AuthInstance,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const headers = new Headers();

    Object.entries(request.headers).forEach(
      ([key, value]) => {
        if (value) {
          headers.set(
            key,
            Array.isArray(value)
              ? value.join(',')
              : value,
          );
        }
      },
    );

    const session = await this.auth.api.getSession({
      headers,
    });

    if (!session) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    if (
      (session.user as { status?: string }).status ===
      'INACTIVE'
    ) {
      throw new UnauthorizedException(
        'This account has been deactivated',
      );
    }

    request.user = session.user;

    return true;
  }
}