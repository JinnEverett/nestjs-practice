import { Body, Controller, Get, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @Res({ passthrough: true }) res: Response) {
    const order = await this.orders.create(dto);
    res.location(`/v1/orders/${order.id}`);
    return order;
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orders.findById(id);
  }
}
