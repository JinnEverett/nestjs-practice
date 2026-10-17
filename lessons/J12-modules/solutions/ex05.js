// ex05 · loadPlugins — đáp án best practice
//
// - Validate tên bằng allow-list regex TRƯỚC khi đụng tới filesystem → '../secret' không bao giờ được import.
// - `new URL(`${name}.js`, baseUrl)` ghép đường an toàn, chạy đúng trên Windows lẫn Linux (không ghép chuỗi path).
// - Promise.all → nạp song song; một plugin lỗi → cả lệnh lỗi (fail fast khi khởi động app).
// - Bọc lỗi import bằng Error có ngữ cảnh + cause; kiểm hình dạng plugin (duck typing) → TypeError.
// - Trả Map giữ thứ tự names.
const PLUGIN_NAME = /^[a-z0-9-]+$/;

async function loadOne(name, baseUrl) {
  if (!PLUGIN_NAME.test(name)) throw new Error(`Invalid plugin name: ${JSON.stringify(name)}`);
  let mod;
  try {
    mod = await import(new URL(`${name}.js`, baseUrl).href);
  } catch (cause) {
    throw new Error(`Plugin "${name}" could not be loaded`, { cause });
  }
  const plugin = mod.default;
  if (typeof plugin?.register !== 'function') throw new TypeError(`Plugin "${name}" must default-export an object with register()`);
  return [name, plugin];
}

export async function loadPlugins(names, baseUrl) {
  return new Map(await Promise.all(names.map((name) => loadOne(name, baseUrl))));
}
