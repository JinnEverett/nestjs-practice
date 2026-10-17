import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { REQUEST_ID_MUTANTS, HTTP_LOGGER_MUTANTS } from './_mutants';

jest.setTimeout(600_000);

describe('Q03 ex06 · middleware', () => {
  describe('src/common/middleware/request-id.middleware.spec.ts', () => {
    const SPEC = 'src/common/middleware/request-id.middleware.spec.ts';
    it(`có ${SPEC}`, () => {
      expect(fileExists(...SPEC.split('/'))).toBe(true);
    });
    it('spec xanh trên code của bạn và phủ >= 85% nhánh', async () => {
      const r = await runSpec(SPEC, { coverageFor: ['src/common/middleware/request-id.middleware.ts'] });
      expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
      expect(r.branchPct).toBeGreaterThanOrEqual(85);
    });
    it('spec bắt được >= 80% lỗi cài sẵn', async () => {
      const { survived, killed } = await survivors(SPEC, 'src/common/middleware/request-id.middleware.ts', '_ref_request_id.ts', REQUEST_ID_MUTANTS);
      const need = Math.ceil(REQUEST_ID_MUTANTS.length * 0.8);
      if (killed < need) throw new Error(`Chỉ bắt ${killed}/${REQUEST_ID_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
    });
  });

  describe('src/common/middleware/http-logger.middleware.spec.ts', () => {
    const SPEC = 'src/common/middleware/http-logger.middleware.spec.ts';
    it(`có ${SPEC}`, () => {
      expect(fileExists(...SPEC.split('/'))).toBe(true);
    });
    it('spec xanh trên code của bạn và phủ >= 85% nhánh', async () => {
      const r = await runSpec(SPEC, { coverageFor: ['src/common/middleware/http-logger.middleware.ts'] });
      expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
      expect(r.branchPct).toBeGreaterThanOrEqual(85);
    });
    it('spec bắt được >= 80% lỗi cài sẵn', async () => {
      const { survived, killed } = await survivors(SPEC, 'src/common/middleware/http-logger.middleware.ts', '_ref_http_logger.ts', HTTP_LOGGER_MUTANTS);
      const need = Math.ceil(HTTP_LOGGER_MUTANTS.length * 0.8);
      if (killed < need) throw new Error(`Chỉ bắt ${killed}/${HTTP_LOGGER_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
    });
  });

});
