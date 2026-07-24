import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const webOrigin = configService.getOrThrow<string>('WEB_ORIGIN');
  const globalPrefix = 'api';
  const port = Number(process.env.PORT ?? 3001);

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({ origin: webOrigin });
  await app.listen(port);

  Logger.log(`API listening on http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
