// Minimal Server-Sent Events client over fetch(). EventSource can't send an
// Authorization header, and Mercure 1.x refuses tokens in the URL.

/**
 * Open an SSE stream and dispatch named events until it ends.
 * Resolves when the server closes the stream; rejects on HTTP or network errors.
 *
 * @param {string} url
 * @param {object} opts
 * @param {string} opts.token        Bearer token
 * @param {AbortSignal} opts.signal  abort to close the stream
 * @param {() => void} [opts.onOpen]
 * @param {Record<string, (e: {data: string, lastEventId: string}) => void>} opts.handlers
 */
export const openSseStream = async (url, { token, signal, onOpen, handlers }) => {
  const res = await fetch(url, {
    headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal,
  });
  if (!res.ok || !res.body) {
    const err = new Error(`Event stream failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  onOpen?.();

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  const dispatch = (block) => {
    let event = 'message';
    let id = '';
    const data = [];
    for (const raw of block.split('\n')) {
      const line = raw.replace(/\r$/, '');
      if (!line || line.startsWith(':')) continue; // comment / heartbeat
      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
      if (field === 'event') event = value;
      else if (field === 'data') data.push(value);
      else if (field === 'id') id = value;
    }
    if (data.length) handlers[event]?.({ data: data.join('\n'), lastEventId: id });
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    let end;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      dispatch(buffer.slice(0, end));
      buffer = buffer.slice(end + 2);
    }
  }
};
