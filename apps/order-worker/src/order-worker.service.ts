import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createClient } from 'redis';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Ticket } from './ticket.schema';

@Injectable()
export class OrderWorkerService implements OnModuleInit {
  private redisClient;

  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
  ) {}

  // เริ่มทำงานทันทีที่แอปเปิด (เหมือน startWorker เดิม)
  async onModuleInit() {
    this.redisClient = createClient({ url: 'redis://localhost:6379' });
    this.redisClient.on('error', (err) => console.log('Redis Error', err));
    await this.redisClient.connect();
    console.log('✅ Connected to Redis (NestJS)');
  }

  // ฟังก์ชันรับงาน (Consumer เรียกใช้)
  async addOrderToBuffer(data: any) {
    const ticketData = JSON.stringify({
      seatNumber: data.seatNumber,
      userId: data.userId,
      status: 'BOOKED',
      timestamp: new Date(),
    });

    // ยัดใส่ Redis ถังหลัก
    await this.redisClient.rPush('ticket_buffer', ticketData);
  }

  // ฟังก์ชันรถเก็บขยะ (ทำงานทุก 10 วินาที)
  @Cron('*/10 * * * * *') // หรือใช้ CronExpression.EVERY_10_SECONDS
  async flushBuffer() {
    const len = await this.redisClient.lLen('ticket_buffer');
    if (len === 0) return;

    console.log(`⏰ CronJob woke up! Found ${len} items.`);
    
    // ท่าไม้ตาย: Rename ถัง (Atomic)
    const TEMP_KEY = `processing_${Date.now()}`;
    await this.redisClient.rename('ticket_buffer', TEMP_KEY);

    // ดึงข้อมูลมา
    const items = await this.redisClient.lRange(TEMP_KEY, 0, -1);
    
    if (items.length > 0) {
      const bulkData = items.map((item) => JSON.parse(item));
      
      // บันทึกลง Mongo
      await this.ticketModel.insertMany(bulkData);
      console.log(`✅ Saved ${items.length} tickets to MongoDB (NestJS Style)`);
    }

    // ลบถังชั่วคราว
    await this.redisClient.del(TEMP_KEY);
  }
}