import axios from 'axios';
import { GraphApiService } from '../connectors/sharepoint/graph/graph-api.service';

jest.mock('axios');

describe('GraphApiService', () => {
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    mockAxios.create.mockReturnThis();
  });

  it('resolves siteId', async () => {
    mockAxios.get.mockResolvedValueOnce({
      data: { id: 'site-123' },
    } as any);

    const api = new GraphApiService('token');
    const siteId = await api.getSiteId(
      'https://company.sharepoint.com/sites/hr',
    );

    expect(siteId).toBe('site-123');
    expect(mockAxios.get).toHaveBeenCalled();
  });

  it('handles paging correctly', async () => {
    mockAxios.get
      .mockResolvedValueOnce({
        data: {
          value: [{ id: 'f1' }],
          '@odata.nextLink':
            'https://graph.microsoft.com/v1.0/next',
        },
      } as any)
      .mockResolvedValueOnce({
        data: { value: [{ id: 'f2' }] },
      } as any);

    const api = new GraphApiService('token');
    const files = await api.listChildrenPaged(
      'drive1',
      'root',
    );

    expect(files).toHaveLength(2);
    expect(files[0].id).toBe('f1');
    expect(files[1].id).toBe('f2');
  });
});