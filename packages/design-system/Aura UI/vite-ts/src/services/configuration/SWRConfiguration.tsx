import { PropsWithChildren } from 'react';
import axiosFetcher from 'services/axios/axiosFetcher';
import { SWRConfig } from 'swr';

const SWRConfiguration = ({ children }: PropsWithChildren) => {
  return (
    <SWRConfig
      value={{
        fetcher: axiosFetcher,
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
};

export default SWRConfiguration;
