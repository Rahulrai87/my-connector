import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";

export interface SharePointFileMeta {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  eTag?: string;
  version?: number | null;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  parentReference?: any;
}

export class SharePointGraphService {
  private client: Client;

  constructor(
    private tenantId: string,
    private clientId: string,
    private clientSecret: string,
  ) {
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
    );

    this.client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(
            "https://graph.microsoft.com/.default",
          );
          return token?.token ?? "";
        },
      },
    });
  }

  // =====================================================
  // MAIN ENTRY (WITH lastRunAt CONDITION)
  // =====================================================
  async syncFiles(
    siteId: string,
    listId: string,
    rootFolderId: string,
    lastRunAt: Date | null,
    acceptedExtensions: string[],
  ): Promise<SharePointFileMeta[]> {

    try {
      const driveId = await this.getDriveId(siteId, listId);
      const normalizedExt = this.normalizeExtensions(acceptedExtensions);

      // FULL SYNC
      if (!lastRunAt) {
        return await this.fetchRecursively(
          siteId,
          driveId,
          rootFolderId,
          null,
          normalizedExt,
        );
      }

      // INCREMENTAL SYNC
      return await this.fetchRecursively(
        siteId,
        driveId,
        rootFolderId,
        lastRunAt,
        normalizedExt,
      );

    } catch (error) {
      console.error("Sync failed:", error);
      return []; // never break server
    }
  }

  // =====================================================
  // GET DRIVE ID
  // =====================================================
  private async getDriveId(
    siteId: string,
    listId: string,
  ): Promise<string> {

    const response = await this.safeApiCall(() =>
      this.client
        .api(`/sites/${siteId}/lists/${listId}/drive`)
        .get()
    );

    if (!response?.id) {
      throw new Error("Drive not found for list");
    }

    return response.id;
  }

  // =====================================================
  // RECURSIVE FETCH (FULL OR INCREMENTAL)
  // =====================================================
  private async fetchRecursively(
    siteId: string,
    driveId: string,
    rootFolderId: string,
    modifiedAfter: Date | null,
    acceptedExtensions: string[],
  ): Promise<SharePointFileMeta[]> {

    const results: SharePointFileMeta[] = [];
    const stack: string[] = [rootFolderId];
    const filterISO = modifiedAfter?.toISOString();

    while (stack.length > 0) {

      const folderId = stack.pop()!;

      try {

        let response = await this.safeApiCall(() =>
          this.client
            .api(`/sites/${siteId}/drives/${driveId}/items/${folderId}/children`)
            .select("id,name,webUrl,size,eTag,createdDateTime,lastModifiedDateTime,folder,file,parentReference")
            .top(200)
            .get()
        );

        while (response) {

          for (const item of response.value || []) {

            // Traverse folders
            if (item.folder) {
              stack.push(item.id);
            }

            // Process files
            if (
              item.file &&
              this.isAcceptedExtension(item.name, acceptedExtensions) &&
              (
                !filterISO || // Full sync
                (
                  item.lastModifiedDateTime &&
                  item.lastModifiedDateTime > filterISO
                )
              )
            ) {
              results.push(this.mapToMeta(item));
            }
          }

          if (!response["@odata.nextLink"]) break;

          response = await this.safeApiCall(() =>
            this.client.api(response["@odata.nextLink"]).get()
          );
        }

      } catch (folderError) {
        console.error(`Folder failed: ${folderId}`, folderError);
        continue; // isolate folder failure
      }
    }

    return results;
  }

  // =====================================================
  // SAFE API CALL WITH RETRY
  // =====================================================
  private async safeApiCall<T>(
    fn: () => Promise<T>,
    retries = 3,
    delayMs = 1000,
  ): Promise<T> {

    try {
      return await fn();
    } catch (error: any) {

      const status = error?.statusCode || error?.status;

      if (
        retries > 0 &&
        (status === 429 || status >= 500)
      ) {
        const retryAfter =
          Number(error?.headers?.["retry-after"]) || 1;

        const backoff = delayMs * Math.pow(2, 3 - retries);

        await this.sleep(retryAfter * 1000 || backoff);

        return this.safeApiCall(fn, retries - 1, delayMs);
      }

      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =====================================================
  // EXTENSION HELPERS
  // =====================================================
  private normalizeExtensions(extensions: string[]): string[] {
    if (!extensions || extensions.length === 0) return [];

    return extensions.map(ext => {
      const lower = ext.toLowerCase().trim();
      return lower.startsWith(".") ? lower : `.${lower}`;
    });
  }

  private isAcceptedExtension(
    fileName?: string,
    acceptedExtensions?: string[],
  ): boolean {

    if (!fileName) return false;

    if (!acceptedExtensions || acceptedExtensions.length === 0)
      return true;

    const lower = fileName.toLowerCase();

    return acceptedExtensions.some(ext =>
      lower.endsWith(ext),
    );
  }

  // =====================================================
  // ETAG VERSION
  // =====================================================
  private extractVersionFromEtag(eTag?: string): number | null {
    if (!eTag) return null;

    const cleaned = eTag.replace(/"/g, "");
    const parts = cleaned.split(",");
    const versionPart = parts.length > 1 ? parts[1] : parts[0];
    const version = Number(versionPart);

    return isNaN(version) ? null : version;
  }

  // =====================================================
  // MAP
  // =====================================================
  private mapToMeta(item: any): SharePointFileMeta {
    return {
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      size: item.size,
      eTag: item.eTag,
      version: this.extractVersionFromEtag(item.eTag),
      createdDateTime: item.createdDateTime,
      lastModifiedDateTime: item.lastModifiedDateTime,
      parentReference: item.parentReference,
    };
  }
}
