import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable global validation so DTO decorators work out of the box
  app.useGlobalPipes(new ValidationPipe());

  const PORT = process.env.PORT || 4001;
  await app.listen(PORT);
  console.log(`Mock ERP NestJS service running on port ${PORT}`);
}
bootstrap();