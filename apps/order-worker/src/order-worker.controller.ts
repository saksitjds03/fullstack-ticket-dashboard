import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { OrderWorkerService } from './order-worker.service';

@Controller()
export class OrderWorkerController {
  constructor(private readonly orderService: OrderWorkerService) {}

  @EventPattern('order_created')
  async handleOrderCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    // 1. ส่งงานให้ Service เอาไปยัดลง Redis
    await this.orderService.addOrderToBuffer(data);
    
    // 2. บอก RabbitMQ ว่า "ได้รับแล้ว" (Ack)
    // หมายเหตุ: ใน NestJS ถ้าฟังก์ชันทำงานจบไม่ Error มันจะ Ack ให้อัตโนมัติครับ
    // (แต่ถ้าอยากทำ Manual Ack ต้องตั้งค่าเพิ่ม ซึ่งข้ามไปก่อนได้)
    
    // console.log('📥 Buffer Order:', data.seatNumber);
  }
}