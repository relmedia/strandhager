import './env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody makes the original request bytes available, which the Vipps
  // webhook needs to verify the HMAC signature.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://strandhager-web.vercel.app',
      'https://strandhager-admin.vercel.app',
      process.env.WEB_ORIGIN,
      process.env.ADMIN_ORIGIN,
    ]
      .filter((origin): origin is string => Boolean(origin))
      // Origins never carry a trailing slash; forgive it in the env values.
      .map((origin) => origin.replace(/\/+$/, '')),
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

bootstrap();
