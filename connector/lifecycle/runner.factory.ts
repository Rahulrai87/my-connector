import { SharePointRunner } from '../connectors/sharepoint/sharepoint.runner';

export class RunnerFactory {
  constructor(private readonly sharepoint: SharePointRunner) {}

  get(type: string) {
    if (type === 'sharepoint') return this.sharepoint;
    throw new Error(`Unsupported connector type ${type}`);
  }
}

// import { SharePointRunner } from '../connectors/sharepoint/sharepoint.runner';
// import { S3Runner } from '../connectors/s3/s3.runner';

// export class RunnerFactory {
//   constructor(
//     private readonly sharepoint: SharePointRunner,
//     private readonly s3: S3Runner,
//   ) {}

//   get(type: string) {
//     if (type === 'sharepoint') return this.sharepoint;
//     if (type === 's3') return this.s3;
//     throw new Error(`Unsupported connector type: ${type}`);
//   }
// }