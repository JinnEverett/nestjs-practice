// Đoạn mã bài 🔮 ex05 (cũng nằm trong exercises.md). Check chạy thật để lấy kết quả đúng.
export const EX05_SNIPPET = `
describe('mock semantics', () => {
  const fn = jest.fn();

  it('t1', () => {
    fn.mockReturnValue(1);
    jest.clearAllMocks();
    expect(fn()).toBe(1);
  });

  it('t2', () => {
    jest.resetAllMocks();
    expect(fn()).toBeUndefined();
  });

  it('t3', () => {
    fn.mockResolvedValue(5);
    expect(fn()).toBe(5);
  });

  it('t4', () => {
    expect({ a: 1, b: undefined }).toEqual({ a: 1 });
  });

  it('t5', () => {
    expect({ a: 1, b: undefined }).toStrictEqual({ a: 1 });
  });

  it('t6', () => {
    const f = jest.fn().mockReturnValueOnce(1).mockReturnValue(2);
    expect([f(), f(), f()]).toEqual([1, 2, 2]);
  });

  it('t7', () => {
    const g = jest.fn();
    expect(g).not.toHaveBeenCalled();
    g();
    g(1);
    expect(g).toHaveBeenCalledWith();
    expect(g).toHaveBeenCalledTimes(1);
  });

  it('t8', async () => {
    await expect(Promise.reject(new Error('x'))).rejects.toThrow('y');
  });
});
`;
