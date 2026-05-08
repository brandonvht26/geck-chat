export interface ShareDocumentPayload {
  itemId: string;
  email: string;
  permission: 'read' | 'edit';
}

export interface ShareDocumentResponse {
  ok: boolean;
  msg: string;
  sharedWith: Array<{ userId: string; permission: string }>;
}

export type DownloadProgressCallback = (progress: number) => void;
