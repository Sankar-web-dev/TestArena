import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { createAuth } from '../auth/auth.js';
import type { CreateStudentDto } from './dto/create-student.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { ListUsersDto } from './dto/list-users.dto.js';
import {
  parseStudentsFromExcel,
  type ParsedStudentRow,
} from './excel/student-import-parser.js';

type AuthInstance = ReturnType<typeof createAuth>;

/** Fields that are always safe to return — never secrets. */
const SAFE_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/**
 * Default credential issued to every admin-created /
 * imported student account. Students change it (and their
 * username) themselves after first sign-in.
 */
const STUDENT_DEFAULT_PASSWORD = 'Saec@1234';

/** "John Doe" -> "john.doe"; empty/odd names -> "student". */
function usernameBase(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 24) || 'student';
  // Keep it >= 3 chars to match the username convention.
  return base.length < 3 ? `${base}01` : base;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('BETTER_AUTH')
    private readonly auth: AuthInstance,
  ) {}

  // ---------- creation (Better Auth sign-up flow) ----------

  /**
   * Creates a user through Better Auth's sign-up endpoint so
   * credentials are hashed and stored exactly like a normal
   * registration, then forces the server-side role. The
   * transient sign-up session is removed — an admin creating
   * an account must never inherit it.
   */
  private async createManagedUser(input: {
    name: string;
    username: string;
    email: string;
    password: string;
  }) {
    const email = input.email.toLowerCase();
    const username = input.username.toLowerCase();

    const [emailTaken, usernameTaken] = await Promise.all([
      this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { username },
        select: { id: true },
      }),
    ]);

    if (emailTaken) {
      throw new ConflictException('Email already exists');
    }
    if (usernameTaken) {
      throw new ConflictException('Username already exists');
    }

    let userId: string;

    try {
      const result = await this.auth.api.signUpEmail({
        body: {
          name: input.name,
          email,
          password: input.password,
          username,
        },
      });
      userId = result.user.id;
    } catch (error) {
      const code = (
        error as { body?: { code?: string } } | undefined
      )?.body?.code;

      if (code === 'USER_ALREADY_EXISTS') {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException(
        'Could not create account',
      );
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'STUDENT', username },
      select: SAFE_USER_SELECT,
    });

    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return user;
  }

  /**
   * Picks the first available username derived from the
   * name: base, base2, base3, … `reserved` seeds it with
   * usernames already taken (DB + same-batch imports).
   */
  private uniqueUsernameFromName(
    name: string,
    reserved: Set<string>,
  ): string {
    const base = usernameBase(name);
    let candidate = base;
    for (let i = 2; reserved.has(candidate); i++) {
      candidate = `${base}${i}`.slice(0, 30);
    }
    return candidate;
  }

  async createStudent(dto: CreateStudentDto) {
    const taken = new Set(
      (
        await this.prisma.user.findMany({
          where: {
            username: { startsWith: usernameBase(dto.name) },
          },
          select: { username: true },
        })
      )
        .map((u) => u.username)
        .filter((u): u is string => !!u),
    );

    return this.createManagedUser(
      {
        name: dto.name,
        username: this.uniqueUsernameFromName(
          dto.name,
          taken,
        ),
        email: dto.email,
        password: STUDENT_DEFAULT_PASSWORD,
      },
    );
  }

  // ---------- listing ----------

  async listUsers(query: ListUsersDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(
      100,
      Math.max(1, query.limit ?? 20),
    );

    const where: Prisma.UserWhereInput = {
      role: 'STUDENT',
    };

    if (query.status) {
      where.status = query.status;
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...SAFE_USER_SELECT,
          _count: { select: { attempts: true } },
        },
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ---------- detail ----------

  private async findStudentOrFail(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: 'STUDENT' },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Student not found');
    }

    return user;
  }

  async getStudent(id: string) {
    const student = await this.prisma.user.findFirst({
      where: { id, role: 'STUDENT' },
      select: {
        ...SAFE_USER_SELECT,
        attempts: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            startedAt: true,
            submittedAt: true,
            test: {
              select: { id: true, title: true },
            },
            result: {
              select: {
                score: true,
                totalMarks: true,
                percentage: true,
              },
            },
          },
        },
        _count: { select: { attempts: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const [submittedCount, average] = await Promise.all([
      this.prisma.attempt.count({
        where: { studentId: id, status: 'SUBMITTED' },
      }),
      this.prisma.result.aggregate({
        _avg: { percentage: true },
        where: { attempt: { studentId: id } },
      }),
    ]);

    const { _count, attempts, ...profile } = student;

    return {
      ...profile,
      stats: {
        attemptCount: _count.attempts,
        submittedCount,
        averagePercentage: average._avg.percentage,
      },
      recentAttempts: attempts,
    };
  }

  // ---------- update ----------

  async updateUser(id: string, dto: UpdateUserDto) {
    await this.findStudentOrFail(id);

    if (dto.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username.toLowerCase() },
        select: { id: true },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Username already exists',
        );
      }
    }

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
        select: { id: true },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.username !== undefined)
      data.username = dto.username.toLowerCase();
    if (dto.email !== undefined)
      data.email = dto.email.toLowerCase();

    return this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_USER_SELECT,
    });
  }

  // ---------- status ----------

  async setStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
    adminId: string,
  ) {
    if (id === adminId && status === 'INACTIVE') {
      throw new BadRequestException(
        'You cannot deactivate your own account',
      );
    }

    await this.findStudentOrFail(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: SAFE_USER_SELECT,
    });

    if (status === 'INACTIVE') {
      // Kill any live sessions immediately — the sign-in
      // hook also blocks future logins.
      await this.prisma.session.deleteMany({
        where: { userId: id },
      });
    }

    return user;
  }

  // ---------- password reset ----------

  async resetPassword(id: string, password: string) {
    await this.findStudentOrFail(id);

    const account = await this.prisma.account.findFirst({
      where: { userId: id, providerId: 'credential' },
      select: { id: true },
    });

    if (!account) {
      throw new BadRequestException(
        'This account has no password credential',
      );
    }

    const hashed = await hashPassword(password);

    await this.prisma.account.update({
      where: { id: account.id },
      data: { password: hashed },
    });

    // Invalidate every session so the old password (or a
    // compromised session) can't keep working.
    await this.prisma.session.deleteMany({
      where: { userId: id },
    });

    return { message: 'Password reset successfully' };
  }

  // ---------- excel import ----------

  private validateImportRow(
    row: ParsedStudentRow,
    seenEmails: Map<string, number>,
    dbEmails: Set<string>,
  ): ImportError[] {
    const errors: ImportError[] = [];
    const push = (field: string, message: string) =>
      errors.push({ row: row.row, field, message });

    if (row.name.length < 2) {
      push('name', 'Name is required (min 2 characters)');
    }
    if (!row.email.includes('@')) {
      push('email', 'Invalid email address');
    }

    if (seenEmails.has(row.email)) {
      push(
        'email',
        `Duplicate email in file (row ${seenEmails.get(row.email)})`,
      );
    } else {
      seenEmails.set(row.email, row.row);
    }

    if (dbEmails.has(row.email)) {
      push('email', 'Email already exists');
    }

    return errors;
  }

  /**
   * dryRun=true  → per-row validation only (preview).
   * dryRun=false → creates each valid row via Better Auth.
   * Partial success is explicit: every failure is reported
   * with its row number; passwords never leave the service.
   */
  async importStudents(buffer: Buffer, dryRun: boolean) {
    let rows: ParsedStudentRow[];

    try {
      rows = parseStudentsFromExcel(buffer);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Could not parse Excel file',
      );
    }

    if (rows.length === 0) {
      throw new BadRequestException(
        'Excel file contains no student rows',
      );
    }

    const emails = [...new Set(rows.map((r) => r.email))];

    const [existingEmails, existingUsernames] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { email: { in: emails } },
          select: { email: true },
        }),
        // Prefetch usernames that could collide with the
        // ones we're about to generate from names.
        this.prisma.user.findMany({
          where: {
            OR: [...new Set(rows.map((r) => usernameBase(r.name)))].map(
              (base) => ({ username: { startsWith: base } }),
            ),
          },
          select: { username: true },
        }),
      ]);

    const dbEmails = new Set(existingEmails.map((u) => u.email));
    const takenUsernames = new Set(
      existingUsernames
        .map((u) => u.username)
        .filter((u): u is string => !!u),
    );

    const seenEmails = new Map<string, number>();
    const allErrors: ImportError[] = [];

    const preview = rows.map((row) => {
      const errors = this.validateImportRow(
        row,
        seenEmails,
        dbEmails,
      );
      allErrors.push(...errors);
      return {
        row: row.row,
        name: row.name,
        email: row.email,
        valid: errors.length === 0,
        message:
          errors[0]?.message ??
          (errors.length > 0
            ? `${errors.length} issues`
            : 'Ready to import'),
      };
    });

    if (dryRun) {
      return {
        totalRows: rows.length,
        valid: preview.filter((r) => r.valid).length,
        invalid: preview.filter((r) => !r.valid).length,
        rows: preview,
      };
    }

    let created = 0;

    for (const row of preview) {
      if (!row.valid) continue;

      const source = rows.find((r) => r.row === row.row);
      if (!source) continue;

      const username = this.uniqueUsernameFromName(
        source.name,
        takenUsernames,
      );
      takenUsernames.add(username);

      try {
        await this.createManagedUser(
          {
            name: source.name,
            username,
            email: source.email,
            password: STUDENT_DEFAULT_PASSWORD,
          },
        );
        created++;
      } catch (error) {
        allErrors.push({
          row: row.row,
          field: 'account',
          message:
            error instanceof ConflictException
              ? error.message
              : 'Could not create account',
        });
      }
    }

    return {
      totalRows: rows.length,
      created,
      failed: rows.length - created,
      errors: allErrors,
    };
  }

  importTemplate(): Buffer {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['name', 'email'],
      ['John Doe', 'john@example.com'],
      ['Jane Doe', 'jane@example.com'],
    ]);

    worksheet['!cols'] = [{ wch: 20 }, { wch: 26 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Students',
    );

    return XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;
  }

  // ---------- dashboard stats ----------

  async adminStats() {
    const [total, published, drafts, questions, students] =
      await Promise.all([
        this.prisma.test.count(),
        this.prisma.test.count({
          where: {
            status: { in: ['PUBLISHED', 'LIVE', 'ENDED'] },
          },
        }),
        this.prisma.test.count({
          where: { status: { in: ['DRAFT', 'READY'] } },
        }),
        this.prisma.question.count(),
        this.prisma.user.count({
          where: { role: 'STUDENT' },
        }),
      ]);

    return {
      tests: { total, published, drafts },
      questions,
      students,
    };
  }
}
