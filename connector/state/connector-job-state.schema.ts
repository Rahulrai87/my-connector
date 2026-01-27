import { Schema } from 'mongoose';

export const ConnectorJobStateSchema = new Schema({
  connectorId: { type: String, index: true },
  bucketId: { type: Number, index: true },

  // Map<fileId, fingerprint>
  files: {
    type: Map,
    of: String,
    default: {},
  },

  updatedAt: { type: Date, default: Date.now },
});

// One document per connector per bucket
ConnectorJobStateSchema.index(
  { connectorId: 1, bucketId: 1 },
  { unique: true },
);