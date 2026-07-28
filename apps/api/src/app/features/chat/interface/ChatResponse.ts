export interface ChatSource {
  documentTitle: string;
  sectionTitle: string;
  sourcePath: string;
}

export interface ChatResponse {
  reply: string;
  sources: ChatSource[];
}
