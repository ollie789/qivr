import { User } from './users';

export interface FileStructureItem {
  name: string;
  type: 'file' | 'folder' | 'section';
  icon?: string;
  status?: 'new' | 'modified' | 'deleted' | 'shared';
  children?: FileStructureItem[];
}

export interface StorageSegment {
  title: string;
  files: number;
  size: number;
}

export interface FileShareType {
  id: number;
  user: User;
  permission: 'owner' | 'viewer' | 'editor';
}

export interface FileType {
  id: number;
  name: string;
  src?: string;
  type: 'file' | 'folder';
  extension?: string;
  favorite: boolean;
  savedIn: string;
  size: number;
  location: string;
  uploadedAt: string;
  modifiedAt: string;
  openedAt: string;
  createdAt: string;
  shared: FileShareType[];
}

export interface FolderType extends FileType {
  type: 'folder';
  extension?: never;
  files?: (FileType | FolderType)[];
  color?: string;
}
