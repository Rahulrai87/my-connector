
@Injectable()
export class JobService {
  constructor(@InjectModel('Job') private model: Model<any>) {}

  start(configId: string) {
    return this.model.create({
      configId,
      status: JobStatus.RUNNING,
    });
  }

  async pushFile(jobId: string, file: any, success = true) {
    await this.model.updateOne(
      { _id: jobId },
      {
        $push: {
          fileList: {
            fileId: file.id,
            webUrl: file.webUrl,
            name: file.name,
            size: file.size,
          },
        },
        $inc: {
          totalFiles: 1,
          successFiles: success ? 1 : 0,
          failedFiles: success ? 0 : 1,
        },
      },
    );
  }

  complete(jobId: string) {
    return this.model.updateOne(
      { _id: jobId },
      { status: JobStatus.COMPLETED },
    );
  }

  fail(jobId: string, error: string) {
    return this.model.updateOne(
      { _id: jobId },
      { status: JobStatus.FAILED, error },
    );
  }
}
// abc
