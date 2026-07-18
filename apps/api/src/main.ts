import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  const port = Number(process.env.PORT ?? 3001);

  app.setGlobalPrefix(globalPrefix);
  await app.listen(port);

  Logger.log(`API listening on http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
