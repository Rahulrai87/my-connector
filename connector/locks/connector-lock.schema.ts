import { Schema } from 'mongoose';

export const ConnectorLockSchema = new Schema({
  connectorId: { type: String, required: true, index: true },
  runId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// TTL index → auto unlock if process crashes
ConnectorLockSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

// Only one lock per connector
ConnectorLockSchema.index(
  { connectorId: 1 },
  { unique: true },
);