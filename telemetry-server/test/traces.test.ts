import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { initDatabase } from '../src/storage/db';

const app = createApp();

describe('OTLP /v1/traces', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/otel';
    await initDatabase();
  });

  it('accepts minimal valid payload', async () => {
    const payload = { resourceSpans: [ { scopeSpans: [ { spans: [ { traceId: 'a', spanId: 'b', name: 'c', startTimeUnixNano: '1' } ] } ] } ] };
    const res = await request(app).post('/v1/traces').send(payload);
    expect(res.status).toBe(200);
  });
});


