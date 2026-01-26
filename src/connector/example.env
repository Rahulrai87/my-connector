import { Injectable } from '@nestjs/common';

import { ConnectorStateRepository } from '../persistence/repositories/connector-state.repository';

/* =======================
   SHAREPOINT IMPORTS
======================= */
import { SharePointConnector } from '../implementations/sharepoint/sharepoint.connector';
import { SharePointAuthProvider } from '../implementations/sharepoint/sharepoint.auth';
import { SharePointGraphClient } from '../implementations/sharepoint/sharepoint.graph.client';
import { SharePointPreBuilder } from '../implementations/sharepoint/sharepoint.prebuilder';
import { SharePointRegistrationPreBuilder } from '../implementations/sharepoint/sharepoint.registration-prebuilder';

/* =======================
   S3 IMPORTS
======================= */
import { S3Connector } from '../implementations/s3/s3.connector';
import { S3StorageClient } from '../implementations/s3/s3.client';
import { S3PreBuilder } from '../implementations/s3/s3.prebuilder';

@Injectable()
export class ConnectorFactory {
  constructor(
    private readonly stateRepo: ConnectorStateRepository,
  ) {}

  /**
   * Runtime connector creation
   * Called ONLY by Runner
   */
  get(type: string, connector: any) {
    switch (type) {
      /* =======================
         SHAREPOINT CONNECTOR
      ======================= */
      case 'sharepoint': {
        const auth = new SharePointAuthProvider();
        const graph = new SharePointGraphClient(auth);

        const impl = new SharePointConnector(
          this.stateRepo,
          connector,
          graph,
        );

        // runtime validation
        impl.preBuilder = new SharePointPreBuilder(
          graph,
          connector,
        );

        return impl;
      }

      /* =======================
         S3 CONNECTOR
      ======================= */
      case 's3': {
        const region =
          connector.region || process.env.AWS_REGION || 'us-east-1';

        const s3Client = new S3StorageClient(region);

        const impl = new S3Connector(
          this.stateRepo,
          connector,
          s3Client,
        );

        // runtime validation
        impl.preBuilder = new S3PreBuilder(
          s3Client,
          connector,
        );

        return impl;
      }

      /* =======================
         UNSUPPORTED
      ======================= */
      default:
        throw new Error(
          `Unsupported connector type: ${type}`,
        );
    }
  }

  /**
   * Registration-time validation
   * Called ONLY during connector registration API
   */
  getRegistrationPreBuilder(type: string) {
    switch (type) {
      case 'sharepoint': {
        const auth = new SharePointAuthProvider();
        const graph = new SharePointGraphClient(auth);
        return new SharePointRegistrationPreBuilder(graph);
      }

      case 's3':
        // S3 registration validation is trivial (IAM handles auth)
        // runtime prebuilder is enough
        return null;

      default:
        return null;
    }
  }
}