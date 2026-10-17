export async function runMain(main, { exit = process.exit, log = console.error } = {}) {
  let code = 0;
  try {
    await main();
  } catch (err) {
    try {
      log(err);
    } catch {
      /* log hỏng cũng không được chặn việc thoát */
    }
    const c = err?.exitCode;
    code = Number.isInteger(c) && c >= 1 && c <= 255 ? c : 1;
  }
  exit(code);
  return code;
}
