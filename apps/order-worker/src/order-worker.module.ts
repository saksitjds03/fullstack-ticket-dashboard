import { Module } from '@nestjs/common';
import { OrderWorkerController } from './order-worker.controller';
import { OrderWorkerService } from './order-worker.service';
import { MongooseModule } from '@nestjs/mongoose'; // <--- 1. Import
import { ScheduleModule } from '@nestjs/schedule'; // <--- 2. Import
import { Ticket, TicketSchema } from './ticket.schema';

@Module({
  imports: [
    // เชื่อมต่อ MongoDB (ที่ Docker เปิดไว้ที่ localhost:27017)
    MongooseModule.forRoot('mongodb://localhost:27017/ticket_db'),
    
    // ลงทะเบียน Schema
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),

    // เปิดใช้งานระบบตั้งเวลา (Cron)
    ScheduleModule.forRoot(),
  ],
  controllers: [OrderWorkerController],
  providers: [OrderWorkerService],
})
export class OrderWorkerModule {}