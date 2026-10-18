import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ApiProblems } from '../common/swagger/api-errors.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Đặt hàng (giá lấy từ sản phẩm tại thời điểm đặt)' })
  @ApiCreatedResponse({ type: Order, description: 'Tạo thành công; header Location trỏ tới đơn' })
  @ApiProblems(400, 409, 422)
  async create(@Body() dto: CreateOrderDto, @Res({ passthrough: true }) res: Response) {
    const order = await this.orders.create(dto);
    res.location(`/v1/orders/${order.id}`);
    return order;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn hàng' })
  @ApiOkResponse({ type: Order })
  @ApiProblems(400, 404)
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.orders.findById(id);
  }
}
