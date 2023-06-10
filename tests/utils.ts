/**
 * Filters out desired keys from an object.
 */
export function filter<T extends object, KS extends keyof T>(obj: T, keys: KS[]): Pick<T, KS> {
  const result: any = {}
  for (const key of keys) {
    result[key] = obj[key]
  }
  return result
}
