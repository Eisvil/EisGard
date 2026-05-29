import { z } from 'zod';

// Zod v4 z.string().uuid() validates RFC 4122 strictly (version 1–8, variant 8–b).
// Seed data uses hand-crafted UUIDs with version 0 (e.g. 11111111-0003-0000-0000-000000000000).
// This helper accepts any UUID-format string (8-4-4-4-12 hex groups) without version/variant checks.
export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    'Invalid UUID'
  );
