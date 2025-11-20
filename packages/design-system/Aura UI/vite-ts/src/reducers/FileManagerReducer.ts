import dayjs from 'dayjs';
import { FileManagerState } from 'providers/FileManagerProvider';
import { FileType, FolderType } from 'types/file-manager';
import { User } from 'types/users';

export type FileManagerAction =
  | { type: 'ADD_FILE'; payload: FileType }
  | { type: 'ADD_FOLDER'; payload: FolderType }
  | { type: 'SELECT_FILE'; payload: FileType }
  | { type: 'DESELECT_FILE'; payload: FileType }
  | { type: 'DESELECT_ALL_FILES' }
  | { type: 'SET_ALL_FILES'; payload: (FileType | FolderType)[] }
  | { type: 'SELECT_ALL_FILES' }
  | { type: 'VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'SET_FILTER'; payload: 'all' | 'recent' | 'folder' | 'favorite' | 'shared' }
  | { type: 'SET_SORT_BY'; payload: 'none' | 'name' | 'size' | 'modified' | 'created' }
  | { type: 'TOGGLE_FAVORITE'; payload: number }
  | { type: 'UPDATE_SHARED_WITH'; payload: { fileId: number; users: User[] } }
  | { type: 'CHANGE_FOLDER_COLOR'; payload: { folderId: number; color: string } };

export const fileManagerReducer = (
  state: FileManagerState,
  action: FileManagerAction,
): FileManagerState => {
  switch (action.type) {
    case 'ADD_FILE':
      return {
        ...state,
        allFiles: [...state.allFiles, action.payload],
      };
    case 'ADD_FOLDER':
      return {
        ...state,
        allFiles: [...state.allFiles, action.payload],
      };
    case 'SELECT_FILE':
      return {
        ...state,
        selectedFiles: [...state.selectedFiles, action.payload],
      };
    case 'DESELECT_FILE':
      return {
        ...state,
        selectedFiles: state.selectedFiles.filter((id) => id !== action.payload),
      };
    case 'SET_ALL_FILES':
      return {
        ...state,
        allFiles: action.payload,
      };

    case 'SELECT_ALL_FILES':
      return {
        ...state,
        selectedFiles: [...state.allFiles],
      };
    case 'DESELECT_ALL_FILES':
      return {
        ...state,
        selectedFiles: [],
      };
    case 'VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
      };
    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload,
      };
    case 'SET_SORT_BY':
      return {
        ...state,
        sort: action.payload,
        allFiles: state.allFiles.sort((a, b) => {
          switch (action.payload) {
            case 'none':
              return a.id - b.id;
            case 'name':
              return a.name.localeCompare(b.name);
            case 'size':
              return a.size - b.size;
            case 'modified':
              return dayjs(a.modifiedAt).diff(dayjs(b.modifiedAt), 'second');
            case 'created':
              return dayjs(a.createdAt).diff(dayjs(b.createdAt), 'second');
          }
        }),
      };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        allFiles: state.allFiles.map((file) =>
          file.id === action.payload ? { ...file, favorite: !file.favorite } : file,
        ),
      };
    case 'UPDATE_SHARED_WITH':
      return {
        ...state,
        allFiles: state.allFiles.map((file) =>
          file.id === action.payload.fileId ? { ...file, sharedWith: action.payload.users } : file,
        ),
      };
    case 'CHANGE_FOLDER_COLOR':
      return {
        ...state,
        allFiles: state.allFiles.map((file) =>
          file.id === action.payload.folderId ? { ...file, color: action.payload.color } : file,
        ),
      };
    default:
      return state;
  }
};
