import { NestFactory } from '@nestjs/core';
import { OrderWorkerModule } from './order-worker.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // เปลี่ยนจาก create() เป็น createMicroservice()
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrderWorkerModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'order_queue',
        queueOptions: {
          durable: false
        },
      },
    },
  );
  
  await app.listen();
  console.log('🐰 Worker is listening for RabbitMQ messages...');
}
bootstrap();