import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @AdminOnly()
  async create(@Body() dto: CreateOrderDto, @Res({ passthrough: true }) res: Response) {
    const order = await this.orders.create(dto);
    res.location(`/v1/orders/${order.id}`);
    return order;
  }

  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.orders.findById(id);
  }
}
