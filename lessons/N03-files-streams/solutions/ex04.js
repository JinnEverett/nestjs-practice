import { Transform } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';

export function createCsvParser() {
  const decoder = new StringDecoder('utf8');
  let header = null;
  let rowNo = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  let pendingQuote = false; // vừa gặp " bên trong ngoặc: chưa biết là đóng hay là ""
  let fieldStarted = false; // đã có ký tự (hoặc ngoặc) trong trường hiện tại
  let rowHasContent = false;

  const endField = () => {
    row.push(field);
    field = '';
    fieldStarted = false;
  };
  const endRow = (push) => {
    endField();
    const blank = !rowHasContent;
    const cells = row;
    row = [];
    rowHasContent = false;
    if (blank) return;
    if (header === null) {
      header = cells;
      return;
    }
    rowNo++;
    if (cells.length > header.length) throw new Error(`Row ${rowNo} has more fields than header`);
    const obj = {};
    header.forEach((h, i) => { obj[h] = cells[i] ?? ''; });
    push(obj);
  };

  const feed = (text, push) => {
    for (const ch of text) {
      if (pendingQuote) {
        pendingQuote = false;
        if (ch === '"') { field += '"'; continue; }
        inQuotes = false; // dấu " trước đó là dấu đóng
      }
      if (inQuotes) {
        if (ch === '"') pendingQuote = true;
        else field += ch;
        continue;
      }
      if (ch === '"' && !fieldStarted) { inQuotes = true; fieldStarted = true; rowHasContent = true; continue; }
      if (ch === ',') { rowHasContent = true; endField(); continue; }
      if (ch === '\n') { endRow(push); continue; }
      if (ch === '\r') continue;
      field += ch;
      fieldStarted = true;
      rowHasContent = true;
    }
  };

  return new Transform({
    readableObjectMode: true,
    transform(chunk, _enc, cb) {
      try {
        feed(typeof chunk === 'string' ? chunk : decoder.write(chunk), (o) => this.push(o));
        cb();
      } catch (err) {
        cb(err);
      }
    },
    flush(cb) {
      try {
        feed(decoder.end(), (o) => this.push(o));
        if (pendingQuote) { pendingQuote = false; inQuotes = false; }
        if (rowHasContent || field !== '' || row.length > 0) endRow((o) => this.push(o));
        cb();
      } catch (err) {
        cb(err);
      }
    },
  });
}
