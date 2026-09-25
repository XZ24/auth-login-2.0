import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: '*' });

  // Serve the built frontend from ../dist if it exists
  const distPath = path.resolve(__dirname, '..', '..', 'dist');
  if (fs.existsSync(distPath)) {
    app.useStaticAssets(distPath);
  }

  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}
bootstrap();
