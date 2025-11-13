/* eslint-disable @typescript-eslint/no-explicit-any */
const isObject = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const merge = <T extends Record<string, any>, U extends Record<string, any> | undefined>(
  target: T,
  source: U
): T & (U extends undefined ? Record<string, never> : U) => {
  if (!source) {
    return target as T & (U extends undefined ? Record<string, never> : U);
  }

  const result: Record<string, any> = { ...target };

  Object.keys(source).forEach((key) => {
    const targetValue = (result as any)[key];
    const sourceValue = (source as any)[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      result[key] = [...targetValue, ...sourceValue];
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      result[key] = merge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  });

  return result as T & (U extends undefined ? Record<string, never> : U);
};

export default merge;
