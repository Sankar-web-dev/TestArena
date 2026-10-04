import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  const allowedOrigins = (
    process.env.FRONTEND_URL ??
    'http://localhost:3005,http://127.0.0.1:3005'
  )
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  await app.listen(Number(process.env.PORT) || 3006);
}
await bootstrap();
