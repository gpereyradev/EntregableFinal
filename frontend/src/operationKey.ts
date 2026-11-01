/** One user intent keeps its key across retries; a completed intent releases it. */
export function createOperationKey() {
  let last = { body: '', key: '' };
  return Object.assign(
    (payload: unknown): string => {
      const body = JSON.stringify(payload);
      if (last.body !== body) last = { body, key: crypto.randomUUID() };
      return last.key;
    },
    { complete: () => { last = { body: '', key: '' }; } },
  );
}
