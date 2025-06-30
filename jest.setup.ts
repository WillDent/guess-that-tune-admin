import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder in Node.js
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  // @ts-ignore
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  // @ts-ignore
  globalThis.TextDecoder = TextDecoder;
}

// Polyfill fetch, Request, and Response for Node.js (Jest)
import { fetch, Request, Response, Headers } from 'undici'

if (!globalThis.fetch) globalThis.fetch = fetch as any
if (!globalThis.Request) globalThis.Request = Request as any
if (!globalThis.Response) globalThis.Response = Response as any
if (!globalThis.Headers) globalThis.Headers = Headers as any 