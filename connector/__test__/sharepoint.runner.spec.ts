import { SharePointRunner } from '../connectors/sharepoint/sharepoint.runner';

describe('SharePointRunner', () => {
  const mockQueue = {
    publish: jest.fn(),
  };

  const mockStateRepo = {
    loadAll: jest.fn(),
    save: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockMetrics = {
    increment: jest.fn(),
    timing: jest.fn(),
  };

  const mockTracer = {
    trace: async (_: string, fn: any) => fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emits CREATED for new files', async () => {
    mockStateRepo.loadAll.mockResolvedValue(new Map());

    const runner = new SharePointRunner(
      mockQueue as any,
      mockStateRepo as any,
      mockLogger as any,
      mockMetrics as any,
      mockTracer as any,
    );

    await runner.execute({
      connectorId: 'c1',
      runId: 'r1',
      scan: async () => [
        {
          id: 'f1',
          name: 'doc.txt',
          eTag: 'e1',
          size: 100,
          lastModifiedDateTime: 'now',
        },
      ],
    });

    expect(mockQueue.publish).toHaveBeenCalledWith(
      'connector.files',
      expect.objectContaining({
        eventType: 'CREATED',
      }),
    );
  });

  it('emits UPDATED when fingerprint changes', async () => {
    mockStateRepo.loadAll.mockResolvedValue(
      new Map([['f1', 'oldfp']]),
    );

    const runner = new SharePointRunner(
      mockQueue as any,
      mockStateRepo as any,
      mockLogger as any,
      mockMetrics as any,
      mockTracer as any,
    );

    await runner.execute({
      connectorId: 'c1',
      runId: 'r1',
      scan: async () => [
        {
          id: 'f1',
          name: 'doc.txt',
          eTag: 'new',
          size: 200,
          lastModifiedDateTime: 'now',
        },
      ],
    });

    expect(mockQueue.publish).toHaveBeenCalledWith(
      'connector.files',
      expect.objectContaining({
        eventType: 'UPDATED',
      }),
    );
  });

  it('emits DELETED when file disappears', async () => {
    mockStateRepo.loadAll.mockResolvedValue(
      new Map([['f1', 'fp1']]),
    );

    const runner = new SharePointRunner(
      mockQueue as any,
      mockStateRepo as any,
      mockLogger as any,
      mockMetrics as any,
      mockTracer as any,
    );

    await runner.execute({
      connectorId: 'c1',
      runId: 'r1',
      scan: async () => [],
    });

    expect(mockQueue.publish).toHaveBeenCalledWith(
      'connector.files',
      expect.objectContaining({
        eventType: 'DELETED',
      }),
    );
  });
});