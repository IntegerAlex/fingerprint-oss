import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { persistSpans } from './service';

// Minimal validation for OTLP/HTTP JSON traces per spec
const AttributeValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  z.array(z.boolean())
]);

const Attributes = z.array(z.object({ key: z.string(), value: z.object({ stringValue: z.string().optional(), boolValue: z.boolean().optional(), intValue: z.string().optional(), doubleValue: z.number().optional(), arrayValue: z.object({ values: z.array(z.object({ stringValue: z.string().optional(), boolValue: z.boolean().optional(), intValue: z.string().optional(), doubleValue: z.number().optional() })) }).optional() }) }));

const Span = z.object({
  traceId: z.string(),
  spanId: z.string(),
  name: z.string(),
  kind: z.number().optional(),
  startTimeUnixNano: z.string(),
  endTimeUnixNano: z.string().optional(),
  attributes: Attributes.optional()
});

const ScopeSpans = z.object({ scope: z.object({ name: z.string().optional(), version: z.string().optional() }).optional(), spans: z.array(Span) });
const ResourceSpans = z.object({ resource: z.object({ attributes: Attributes.optional() }).optional(), scopeSpans: z.array(ScopeSpans) });
const ExportTraceServiceRequest = z.object({ resourceSpans: z.array(ResourceSpans) });

export const tracesRouter = Router();

tracesRouter.post('/', async (req: Request, res: Response) => {
  const parse = ExportTraceServiceRequest.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid OTLP trace payload' });
  }

  const { resourceSpans } = parse.data;
  const toPersist: Parameters<typeof persistSpans>[0] = [];

  for (const rs of resourceSpans) {
    const resource = rs.resource ?? null;
    for (const ss of rs.scopeSpans) {
      const scope = ss.scope ?? null;
      for (const s of ss.spans) {
        toPersist.push({
          traceId: s.traceId,
          spanId: s.spanId,
          name: s.name,
          kind: s.kind,
          startTimeUnixNano: s.startTimeUnixNano,
          endTimeUnixNano: s.endTimeUnixNano,
          attributes: (s.attributes as any) ?? null,
          resource: (resource as any) ?? null,
          scope: (scope as any) ?? null,
        });
      }
    }
  }

  await persistSpans(toPersist);
  return res.status(200).json({});
});


