import { AxiosRequestConfig } from 'axios';
import axiosInstance from './axiosInstance';

const axiosFetcher = async (
  args: string | [string, AxiosRequestConfig],
  extraArg?: {
    arg: any;
  },
) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance({
    url,
    method: config?.method || 'get',
    data: extraArg?.arg,
    ...config,
  });

  return res;
};

export default axiosFetcher;
