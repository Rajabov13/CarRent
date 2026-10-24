import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Local state mirrored into the URL query string.
 *
 * React Router applies URL updates inside a transition, so deriving state
 * straight from `useSearchParams` loses quick successive edits (each edit
 * builds on a stale URL). Here edits go through a functional state update and
 * the URL follows; external URL changes (links, back button) re-seed the state.
 */
export function useUrlState<T>(read: (p: URLSearchParams) => T, write: (value: T, base: URLSearchParams) => URLSearchParams, deps: unknown[] = []) {
  const [params, setParams] = useSearchParams();
  const [value, setValue] = useState<T>(() => read(params));
  const written = useRef<string | null>(null);
  const readRef = useRef(read);
  readRef.current = read;
  const writeRef = useRef(write);
  writeRef.current = write;

  // URL changed by something other than us (link, back button) → re-seed. A render
  // that still shows an older URL (transition not yet caught up) is ignored.
  const search = params.toString();
  const depsKey = JSON.stringify(deps);
  const seededDeps = useRef(depsKey);
  useEffect(() => {
    const live = new URLSearchParams(window.location.search).toString();
    // A change in `deps` (e.g. the vehicle finished loading) always re-reads the URL.
    if (depsKey !== seededDeps.current) {
      seededDeps.current = depsKey;
      setValue(readRef.current(new URLSearchParams(live)));
      return;
    }
    if (search === live && search !== written.current) setValue(readRef.current(new URLSearchParams(search)));
  }, [search, depsKey]);

  // State changed → write the URL (based on the live location, never a stale copy).
  useEffect(() => {
    const live = new URLSearchParams(window.location.search);
    const next = writeRef.current(value, live).toString();
    written.current = next;
    if (next !== live.toString()) setParams(new URLSearchParams(next), { replace: true });
  }, [value, setParams]);

  const update = useCallback((fn: (prev: T) => T) => setValue(fn), []);
  return [value, update] as const;
}
