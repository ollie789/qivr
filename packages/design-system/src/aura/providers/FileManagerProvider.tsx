import { createContext, useContext, ReactNode } from 'react';

const FileManagerContext = createContext<any>(null);

export const FileManagerProvider = ({ children }: { children: ReactNode }) => {
  return <FileManagerContext.Provider value={{}}>{children}</FileManagerContext.Provider>;
};

export const useFileManager = () => useContext(FileManagerContext);
export default FileManagerProvider;
