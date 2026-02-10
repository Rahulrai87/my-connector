import { ModuleSchema } from './schema/module.schema';
import { RegionSchema } from './schema/region.schema';
import { ModuleController } from './controllers/module.controller';
import { RegionController } from './controllers/region.controller';
import { ModuleService } from './services/module.service';
import { RegionService } from './services/region.service';
import { PreloaderService } from './services/preloader.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: 'Config', schema: ConfigSchema },
      { name: 'FileProcess', schema: FileProcessSchema },
      { name: 'FileProcessArchive', schema: FileProcessArchiveSchema },
      { name: 'FileProcessDeleted', schema: FileProcessDeletedSchema },
      { name: 'Job', schema: JobSchema },
        { name: 'Module', schema: ModuleSchema },   // ✅
  { name: 'Region', schema: RegionSchema },
    ]),
  ],
  controllers: [NdConnectorController,ModuleController,
    RegionController],
  providers: [
 ConnectorService,
    SchedulerManagerService,
    ConfigWatcherService,
    SharePointService,
    KafkaProducerService,
    JobService,
    FileArchiverService,
    FileArchiverScheduler,
    ModuleService,
    RegionService,
    PreloaderService, 
  ],
})
export class NdConnectorModule {}
