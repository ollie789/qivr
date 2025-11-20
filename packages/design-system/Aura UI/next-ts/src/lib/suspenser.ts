export default function suspenser<T>(asyncFunction: () => Promise<T>) {
  let status: 'pending' | 'success' | 'error' = 'pending';
  let result: T;
  const promise = asyncFunction().then(
    (res: T) => {
      status = 'success';
      result = res;
    },
    (err: any) => {
      status = 'error';
      result = err;
    },
  );

  return {
    read() {
      if (status === 'pending') {
        throw promise;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
    },
  };
}
