// Giả lập phần API Cloudflare D1 mà Worker dùng (prepare/bind/first/all/run) trên node:sqlite.
// Chỉ dùng cho kiểm thử và máy chủ chạy thử cục bộ; trên Cloudflare Worker dùng binding D1 thật.
import { DatabaseSync } from 'node:sqlite';

export function createD1(file = ':memory:') {
  const database = new DatabaseSync(file);
  const statement = (sql, params = []) => ({
    bind: (...values) => statement(sql, values.map(value => (value === undefined ? null : value))),
    first: async column => {
      const row = database.prepare(sql).get(...params);
      if (!row) return null;
      const plain = { ...row };
      return column ? plain[column] : plain;
    },
    all: async () => ({ results: database.prepare(sql).all(...params).map(row => ({ ...row })) }),
    run: async () => {
      const result = database.prepare(sql).run(...params);
      return { success: true, meta: { changes: Number(result.changes) } };
    },
  });
  return { prepare: sql => statement(sql), close: () => database.close() };
}
