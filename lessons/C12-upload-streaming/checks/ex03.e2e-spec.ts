import { http } from './_kit';
import { createProduct } from './_fixtures';
import { html, jpeg, png, sandbox, Sandbox, upload, webp } from './_img';
import { detectImageType, ImageMagicBytesValidator } from '../../src/uploads/image-magic-bytes.validator';

describe('C12 ex03 · kiểm kiểu file theo NỘI DUNG (magic bytes)', () => {
  describe('đơn vị', () => {
    it('detectImageType nhận đúng JPEG, PNG, WebP; từ chối còn lại', () => {
      expect(detectImageType(jpeg())).toBe('image/jpeg');
      expect(detectImageType(png())).toBe('image/png');
      expect(detectImageType(webp())).toBe('image/webp');
      expect(detectImageType(html())).toBeUndefined();
      expect(detectImageType(Buffer.alloc(0))).toBeUndefined();
      expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeUndefined(); // quá ngắn
      expect(detectImageType(Buffer.from('RIFF....WAVE'))).toBeUndefined(); // RIFF nhưng không phải WebP
      expect(detectImageType(Buffer.from('GIF89a'))).toBeUndefined();
    });
    it('ImageMagicBytesValidator.isValid dựa trên buffer, không dựa trên mimetype/tên file do client khai', () => {
      const v = new ImageMagicBytesValidator();
      expect(v.isValid({ buffer: html(), mimetype: 'image/png', originalname: 'a.png' } as Express.Multer.File)).toBe(false);
      expect(v.isValid({ buffer: png(), mimetype: 'text/plain', originalname: 'a.txt' } as Express.Multer.File)).toBe(true);
      expect(v.isValid(undefined)).toBe(false);
      expect(typeof (v as unknown as { buildErrorMessage(f?: unknown): string }).buildErrorMessage()).toBe('string');
    });
  });

  describe('qua HTTP', () => {
    let sb: Sandbox;
    beforeAll(async () => {
      sb = await sandbox();
    });
    afterAll(async () => {
      await sb.cleanup();
    });

    it.each([
      ['jpeg', () => jpeg(), 'image/jpeg'],
      ['png', () => png(), 'image/png'],
      ['webp', () => webp(), 'image/webp'],
    ])('nhận %s dù client khai Content-Type và tên file sai; Content-Type phục vụ lấy theo nội dung', async (_n, make, type) => {
      const p = await createProduct(sb.app);
      const res = await upload(sb.app, p.id, make(), { filename: 'tai-lieu.pdf', contentType: 'application/pdf' }).expect(201);
      expect(res.body.contentType).toBe(type);
      expect((await http(sb.app).get(`/v1/products/${p.id}/image`).expect(200)).headers['content-type']).toContain(type);
    });

    it('HTML giả làm ảnh (khai image/png, đuôi .png) → 415 và không lưu', async () => {
      const p = await createProduct(sb.app);
      const before = sb.files();
      const res = await upload(sb.app, p.id, html(), { filename: 'anh.png', contentType: 'image/png' }).expect(415);
      expect(res.headers['content-type']).toMatch(/problem\+json/);
      expect(res.body).toMatchObject({ type: 'urn:shop:error:unsupported-media-type', status: 415 });
      expect(sb.files()).toEqual(before);
    });

    it('SVG, GIF, PDF, file chạy được → 415 (SVG có thể chứa script)', async () => {
      const p = await createProduct(sb.app);
      for (const data of [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), Buffer.from('GIF89a....'), Buffer.from('%PDF-1.7'), Buffer.from('MZ\x90\x00')]) {
        await upload(sb.app, p.id, data).expect(415);
      }
    });

    it('sản phẩm không tồn tại + file sai kiểu: ưu tiên báo lỗi dữ liệu trước hay tài nguyên đều được, nhưng không lưu gì', async () => {
      const before = sb.files();
      const res = await upload(sb.app, 424242, html());
      expect([404, 415]).toContain(res.status);
      expect(sb.files()).toEqual(before);
    });
  });
});
