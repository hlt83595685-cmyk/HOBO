export interface FileData {
  name: string;
  type: string;
  size: number;
  base64: string;
  url: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface AnalysisState {
  status: AnalysisStatus;
  text: string;
  error?: string;
}

export interface IllustrationState {
  status: AnalysisStatus;
  imageUrl?: string;
  prompt?: string;
  error?: string;
}

export interface ExtractedAsset {
  type: 'Figure' | 'Table';
  pageNumber: number;
  description: string;
}

export interface AssetsState {
  status: AnalysisStatus;
  data: ExtractedAsset[];
  error?: string;
}