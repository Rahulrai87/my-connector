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
  // MAIN ENTRY METHOD
  // =====================================================
  async syncFilesBasedOnLastRun(
    siteId: string,
    listId: string,
    rootFolderId: string, // driveItem.id of folder
    lastRunAt: Date | null,
    acceptedExtensions: string[],
  ): Promise<SharePointFileMeta[]> {

    const driveId = await this.getDriveId(siteId, listId);

    const normalizedExtensions =
      this.normalizeExtensions(acceptedExtensions);

    return this.fetchFilesRecursivelyFromFolder(
      siteId,
      driveId,
      rootFolderId,
      lastRunAt,
      normalizedExtensions,
    );
  }

  // =====================================================
  // GET DRIVE ID
  // =====================================================
  private async getDriveId(
    siteId: string,
    listId: string,
  ): Promise<string> {

    const drive = await this.client
      .api(`/sites/${siteId}/lists/${listId}/drive`)
      .get();

    return drive.id;
  }

  // =====================================================
  // RECURSIVE TRAVERSAL FROM FOLDER ID
  // =====================================================
  private async fetchFilesRecursivelyFromFolder(
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

      const currentFolderId = stack.pop()!;

      let response = await this.client
        .api(`/sites/${siteId}/drives/${driveId}/items/${currentFolderId}/children`)
        .select("id,name,webUrl,size,eTag,createdDateTime,lastModifiedDateTime,folder,file,parentReference")
        .top(200)
        .get();

      while (true) {

        for (const item of response.value) {

          // If folder → traverse deeper
          if (item.folder) {
            stack.push(item.id);
          }

          // If file → apply extension + date filter
          if (
            item.file &&
            this.isAcceptedExtension(item.name, acceptedExtensions) &&
            (!filterISO ||
              (item.lastModifiedDateTime &&
               item.lastModifiedDateTime > filterISO))
          ) {
            results.push(this.mapToMeta(item));
          }
        }

        if (!response["@odata.nextLink"]) break;

        response = await this.client
          .api(response["@odata.nextLink"])
          .get();
      }
    }

    return results;
  }

  // =====================================================
  // EXTENSION NORMALIZER
  // =====================================================
  private normalizeExtensions(extensions: string[]): string[] {
    if (!extensions || extensions.length === 0) return [];

    return extensions.map(ext => {
      const lower = ext.toLowerCase().trim();
      return lower.startsWith(".") ? lower : `.${lower}`;
    });
  }

  // =====================================================
  // EXTENSION CHECK
  // =====================================================
  private isAcceptedExtension(
    fileName?: string,
    acceptedExtensions?: string[],
  ): boolean {

    if (!fileName) return false;

    if (!acceptedExtensions || acceptedExtensions.length === 0)
      return true;

    const lowerName = fileName.toLowerCase();

    return acceptedExtensions.some(ext =>
      lowerName.endsWith(ext),
    );
  }

  // =====================================================
  // ETAG VERSION EXTRACTOR
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
  // MAP RESPONSE
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
