import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Request } from 'express';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // whitelistは、auth.dto.tsに含まれないフィールドを省く
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // reactからのアクセスを許可
  app.enableCors({
    credentials: true,
    origin: ['http://localhost:3000'],
  });
  // frontから受け取ったcookieを解析するため
  app.use(cookieParser());
  app.use(
    csurf({
      cookie: {
        httpOnly: true,
        sameSite: 'none',
        secure: true, //Postmanからアクセスするときはfalse
      },
      value: (req: Request) => {
        return req.header('csrf-token');
      },
    }),
  );
  await app.listen(process.env.PORT || 3001);
}
void bootstrap();
