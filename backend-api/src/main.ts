import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    console.log('\n========================================');
    console.log('🚀 PORTFOLIO MANAGEMENT DASHBOARD API');
    console.log('========================================');
    console.log(`✅ API is running on: http://localhost:${port}/api`);
    console.log('========================================\n');
  });
}
bootstrap();
