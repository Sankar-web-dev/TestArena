import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  
  @Get('api/health')
  getHealth() {
    return {
      success: true,
      message: 'NestJS backend is working!',
    };
  }
}
