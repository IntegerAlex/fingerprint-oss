import { getPool } from '../storage/db';

type Json = Record<string, any> | null;

export type PersistSpanInput = {
  traceId: string;
  spanId: string;
  name: string;
  kind?: number;
  startTimeUnixNano: string;
  endTimeUnixNano?: string;
  attributes?: Json;
  resource?: Json;
  scope?: Json;
};

export async function persistSpans(spans: PersistSpanInput[]): Promise<void> {
  if (spans.length === 0) return;
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const text = `
      INSERT INTO spans (
        trace_id, span_id, name, kind, start_time_unix_nano, end_time_unix_nano, attributes, resource, scope
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `;
    for (const s of spans) {
      await client.query(text, [
        s.traceId,
        s.spanId,
        s.name,
        s.kind ?? null,
        s.startTimeUnixNano,
        s.endTimeUnixNano ?? null,
        s.attributes ?? null,
        s.resource ?? null,
        s.scope ?? null,
      ]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}


