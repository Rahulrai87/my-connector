@Injectable()
export class ConnectorService {
  constructor(
    @InjectModel('Config') private configModel: Model<any>,
    @InjectModel('FileProcess') private fileModel: Model<any>,
    private jobs: JobService,
    private sp: SharePointService,
    private kafka: KafkaProducerService,
  ) {}

  async safeRun(configId: string) {
    const now = new Date();
    const config = await this.configModel.findOneAndUpdate(
      {
        _id: configId,
        status: 'active',
        isDeleted: false,
        $or: [{ lockUntil: null }, { lockUntil: { $lte: now } }],
      },
      { lockUntil: new Date(now.getTime() + 10 * 60 * 1000) },
      { new: true },
    );
    if (!config) return;

    try {
      await this.run(config);
    } finally {
      await this.configModel.updateOne(
        { _id: configId },
        { $unset: { lockUntil: '' } },
      );
    }
  }

  async run(config: any) {
    const job = await this.jobs.start(config._id);
    try {
      const files = await this.sp.fetchFiles(config);

      for (const file of files) {
        await this.fileModel.updateOne(
          { folderId: config.folderId, fileId: file.id },
          {
            $set: {
              folderId: config.folderId,
              fileId: file.id,
              name: file.name,
              extension: file.name.split('.').pop(),
              size: file.size,
              eTag: file.eTag,
              webUrl: file.webUrl,
              lastModifiedDateTime: file.lastModifiedDateTime,
              status: FileStatus.SCHEDULED,
              metadata: file,
            },
          },
          { upsert: true },
        );

        await this.kafka.send(
          process.env.KAFKA_DOC_TOPIC,
          `${config.folderId}:${file.id}`,
          {
            folderId: config.folderId,
            fileId: file.id,
            moduleId: config.moduleId,
            regionId: config.regionId,
          },
        );

        await this.jobs.pushFile(job._id, file, true);
      }

      await this.configModel.updateOne(
        { _id: config._id },
        { lastRunAt: new Date() },
      );

      await this.jobs.complete(job._id);
    } catch (e) {
      await this.jobs.fail(job._id, e.message);
    }
  }
}
