import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '../auth/auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { UsersService } from './users.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ListUsersDto } from './dto/list-users.dto.js';

@Controller('api/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ---------- dashboard ----------

  @Get('dashboard/stats')
  adminStats() {
    return this.usersService.adminStats();
  }

  // ---------- students ----------

  @Post('students')
  createStudent(@Body() dto: CreateStudentDto) {
    return this.usersService.createStudent(dto);
  }

  @Get('students/import-template')
  importTemplate(@Res() res: Response) {
    const buffer = this.usersService.importTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="student-import-template.xlsx"',
    );
    res.send(buffer);
  }

  @Get('students')
  listStudents(@Query() query: ListUsersDto) {
    return this.usersService.listUsers(query);
  }

  @Get('students/:id')
  getStudent(@Param('id') id: string) {
    return this.usersService.getStudent(id);
  }

  @Patch('students/:id')
  updateStudent(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  @Patch('students/:id/status')
  updateStudentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.setStatus(
      id,
      dto.status,
      req.user.id,
    );
  }

  @Post('students/:id/reset-password')
  resetStudentPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(
      id,
      dto.password,
    );
  }

  @Post('students/import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  importStudents(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('dryRun') dryRun: string | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'An Excel file is required',
      );
    }

    return this.usersService.importStudents(
      file.buffer,
      dryRun === 'true',
    );
  }

}
