import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  // @ts-ignore
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  // @ts-ignore
  globalThis.TextDecoder = TextDecoder;
}

// @ts-ignore
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill';

if (typeof globalThis.ReadableStream === 'undefined') {
  // @ts-ignore
  globalThis.ReadableStream = ReadableStream;
}
if (typeof globalThis.WritableStream === 'undefined') {
  // @ts-ignore
  globalThis.WritableStream = WritableStream;
}
if (typeof globalThis.TransformStream === 'undefined') {
  // @ts-ignore
  globalThis.TransformStream = TransformStream;
}

try {
  // @ts-ignore
  if (typeof globalThis.MessageChannel === 'undefined') {
    // @ts-ignore
    globalThis.MessageChannel = require('worker_threads').MessageChannel;
  }
  // @ts-ignore
  if (typeof globalThis.MessagePort === 'undefined') {
    // @ts-ignore
    globalThis.MessagePort = require('worker_threads').MessagePort;
  }
} catch (e) {
  // worker_threads may not be available in all environments
} 