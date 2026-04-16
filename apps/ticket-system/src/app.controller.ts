import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket } from './ticket.schema';

@Controller()
export class AppController {
  constructor(
    @Inject('ORDER_SERVICE') private client: ClientProxy,
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
  ) {}

  @Get()
  getHello() {
    return {
      message: 'Welcome to the Ticket System API!',
      available_endpoints: [
        'GET /tickets',
        'GET /stats',
        'POST /buy-ticket'
      ]
    };
  }

  // 1. จองตั๋ว
  @Post('buy-ticket')
  buyTicket(@Body() body: any) {
    this.client.emit('order_created', body);
    return { status: 'pending', message: 'รับคำสั่งซื้อแล้วจ้า' };
  }

  // 2. ดูสถิติรวม
  @Get('stats')
  async getStats() {
    const total = await this.ticketModel.countDocuments();
    const lastTickets = await this.ticketModel
      .find()
      .sort({ timestamp: -1 })
      .limit(10)
      .exec();

    return { total, lastTickets };
  }

  // 3. ค้นหาตั๋ว (ที่เพิ่งเพิ่ม)
  @Get('tickets')
async findAllTickets(
  @Query('search') search: string,
  @Query('page') page: number = 1,      // รับเลขหน้า (Default = 1)
  @Query('limit') limit: number = 20,   // รับจำนวนต่อหน้า (Default = 20)
) {
  const filter = search
    ? {
        $or: [
          { userId: { $regex: search, $options: 'i' } },
          { seatNumber: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  // คำนวณจุดที่จะข้าม (Skip)
  const skip = (page - 1) * limit;

  // 1. ดึงข้อมูลตามหน้า
  const data = await this.ticketModel
    .find(filter)
    .sort({ timestamp: -1 })
    .skip(skip)      // ข้ามไป...
    .limit(limit)    // หยิบมาแค่...
    .exec();

  // 2. นับจำนวนทั้งหมด (เพื่อให้รู้ว่ามีกี่หน้า)
  const total = await this.ticketModel.countDocuments(filter);

  // ส่งกลับไปพร้อมข้อมูลหน้า
  return {
    data,
    total,
    page: Number(page),
    lastPage: Math.ceil(total / limit),
  };
}
}