/* v8 ignore file */
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({ prefix: 'API' }),
  });
  logger.log('Nest instance created');

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: [configService.get<string>('CLIENT_URL')!],
  });
  logger.log('CORS enabled');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out properties that do not have decorators in the DTO
      transform: true, // Automatically transforms payloads to match DTO types
    }),
  );

  const port = configService.get<string>('PORT')!;
  const host = configService.get<string>('HOST')!;
  await app.listen(port, host);
  logger.log(`App running at http://${host}:${port}`);
}

bootstrap().catch((error: unknown) => {
  // oxlint-disable-next-line no-console
  console.error('Application failed to start:', error);
  process.exit(1);
});
