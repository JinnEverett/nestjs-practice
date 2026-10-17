import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Req,
  Res,
  StreamableFile,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ApiProblems } from '../common/swagger/api-errors.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { ProductsService } from '../products/products.service';
import { detectImageType, ImageMagicBytesValidator } from './image-magic-bytes.validator';
import { ProductImagesService } from './product-images.service';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

@ApiTags('products')
@Controller({ path: 'products/:id/image', version: '1' })
export class ProductImagesController {
  constructor(
    private readonly products: ProductsService,
    private readonly images: ProductImagesService,
  ) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Tải ảnh sản phẩm lên (JPEG/PNG/WebP, tối đa 2MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiCreatedResponse({ description: 'Đã lưu ảnh; Location trỏ tới ảnh', schema: { type: 'object', properties: { productId: { type: 'integer' }, imageUrl: { type: 'string' }, contentType: { type: 'string' }, size: { type: 'integer' } } } })
  @ApiProblems(400, 404, 413, 415)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // giữ trong RAM (tối đa 2MB) để kiểm tra xong mới ghi: lỗi thì không để file mồ côi trên đĩa
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0, parts: 1 },
    }),
  )
  async upload(
    @Param('id', ParseIdPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        validators: [], // kiểu file kiểm riêng ở dưới để trả 415
      }),
    )
    file: Express.Multer.File,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (file.size === 0) throw new UnsupportedMediaTypeException('File rỗng');
    if (!new ImageMagicBytesValidator().isValid(file)) throw new UnsupportedMediaTypeException(new ImageMagicBytesValidator().buildErrorMessage());
    await this.products.findOne(id); // 404 nếu không có sản phẩm, TRƯỚC khi ghi bất cứ thứ gì
    const stored = await this.images.save(id, file.buffer, detectImageType(file.buffer)!);
    res.location(`/v1/products/${id}/image`);
    return { productId: id, imageUrl: `/v1/products/${id}/image`, contentType: stored.contentType, size: stored.size };
  }

  @Get()
  @ApiOperation({ summary: 'Tải ảnh sản phẩm (stream)' })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  @ApiOkResponse({ description: 'Nội dung ảnh', content: { 'image/*': { schema: { type: 'string', format: 'binary' } } } })
  @ApiProblems(400, 404)
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'public, max-age=0, must-revalidate')
  async download(@Param('id', ParseIdPipe) id: number, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.products.findOne(id);
    const image = await this.images.find(id);
    if (!image) throw new NotFoundException(`Sản phẩm #${id} chưa có ảnh`);
    res.setHeader('ETag', image.etag);
    if (req.headers['if-none-match'] === image.etag) {
      res.status(HttpStatus.NOT_MODIFIED);
      return;
    }
    return new StreamableFile(image.stream(), { type: image.contentType, length: image.size, disposition: 'inline' });
  }

  @Delete()
  @AdminOnly()
  @ApiOperation({ summary: 'Xóa ảnh sản phẩm' })
  @ApiProblems(400, 404)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    await this.products.findOne(id);
    if (!(await this.images.remove(id))) throw new NotFoundException(`Sản phẩm #${id} chưa có ảnh`);
  }
}
