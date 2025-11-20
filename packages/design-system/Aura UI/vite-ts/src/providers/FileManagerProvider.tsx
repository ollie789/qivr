import {
  Dispatch,
  PropsWithChildren,
  createContext,
  use,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { useLocation, useParams } from 'react-router';
import { files } from 'data/file-manager';
import dayjs from 'dayjs';
import { FileManagerAction, fileManagerReducer } from 'reducers/FileManagerReducer';
import { FileType, FolderType } from 'types/file-manager';

export interface FileManagerState {
  recentFiles: (FileType | FolderType)[];
  allFiles: (FileType | FolderType)[];
  selectedFiles: (FileType | FolderType)[];
  viewMode: 'list' | 'grid';
  filter: 'all' | 'recent' | 'folder' | 'favorite' | 'shared';
  sort: 'none' | 'name' | 'size' | 'modified' | 'created';
}

interface FileManagerContextInterface extends FileManagerState {
  fileManagerDispatch: Dispatch<FileManagerAction>;
  isSidebarOpen: boolean;
  handleDrawer: (open: boolean) => void;
}

export const FileManagerContext = createContext({} as FileManagerContextInterface);

const initialState: FileManagerState = {
  recentFiles: files.filter((file) => dayjs().diff(dayjs(file.uploadedAt), 'hour') <= 1),
  allFiles: files,
  selectedFiles: [],
  viewMode: 'grid',
  filter: 'all',
  sort: 'none',
};

const isFolder = (file: FileType | FolderType): file is FolderType => file.type === 'folder';

const findFolderById = (
  folderArray: (FileType | FolderType)[],
  folderId: string,
): FolderType | null => {
  for (const file of folderArray) {
    if (isFolder(file) && file.id.toString() === folderId) {
      return file;
    }
    if (isFolder(file) && file.files) {
      const foundFolder = findFolderById(file.files, folderId);
      if (foundFolder) return foundFolder;
    }
  }

  return null;
};

const FileManagerProvider = ({ children }: PropsWithChildren) => {
  const [fileManagerState, fileManagerDispatch] = useReducer(fileManagerReducer, initialState);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { id } = useParams();
  const location = useLocation();

  const handleDrawer = (open: boolean) => {
    setIsSidebarOpen(open);
  };

  useEffect(() => {
    if (!id) {
      fileManagerDispatch({
        type: 'SET_ALL_FILES',
        payload: files,
      });
    } else {
      const folder = findFolderById(files, id);
      fileManagerDispatch({
        type: 'SET_ALL_FILES',
        payload: folder ? folder.files || [] : [],
      });
    }

    fileManagerDispatch({ type: 'DESELECT_ALL_FILES' });
  }, [id, location.pathname]);

  return (
    <FileManagerContext
      value={{
        ...fileManagerState,
        fileManagerDispatch,
        isSidebarOpen,
        handleDrawer,
      }}
    >
      {children}
    </FileManagerContext>
  );
};

export const useFileManager = () => use(FileManagerContext);

export default FileManagerProvider;
