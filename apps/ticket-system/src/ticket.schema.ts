import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TicketDocument = HydratedDocument<Ticket>;

@Schema()
export class Ticket {
  @Prop()
  seatNumber: string;

  @Prop()
  userId: string;

  @Prop()
  status: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);