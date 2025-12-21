import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  const config = new DocumentBuilder()
    .setTitle('Portfolio Management Dashboard API')
    .setDescription('Manulife assessment - portfolio management dashboard')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/swagger', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    console.log('\n========================================');
    console.log('🚀 PORTFOLIO MANAGEMENT DASHBOARD API');
    console.log('========================================');
    console.log(`✅ API is running on: http://localhost:${port}/api`);
    console.log(
      `📔 Swagger is running on: http://localhost:${port}/api/swagger`,
    );
    console.log('========================================\n');
  });
}
bootstrap();
