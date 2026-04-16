import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose'; // <--- 1. Import
import { Ticket, TicketSchema } from './ticket.schema'; // <--- 2. Import

@Module({
  imports: [
    // 3. ต่อ MongoDB
    MongooseModule.forRoot('mongodb://localhost:27017/ticket_db'),
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),

    ClientsModule.register([
      {
        name: 'ORDER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'order_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}