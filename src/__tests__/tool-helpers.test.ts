import { describe, it, expect } from 'vitest';
import { wrapTextResponse, wrapErrorResponse } from '../tool-helpers.js';

describe('wrapTextResponse', () => {
  it('wraps data as formatted JSON', () => {
    const result = wrapTextResponse({ foo: 1 });
    expect(result).toEqual({
      content: [{ type: 'text', text: '{\n  "foo": 1\n}' }],
    });
  });

  it('handles arrays', () => {
    const result = wrapTextResponse([1, 2, 3]);
    expect(result.content[0].text).toBe('[\n  1,\n  2,\n  3\n]');
  });
});

describe('wrapErrorResponse', () => {
  it('wraps Error instance', () => {
    const result = wrapErrorResponse(new Error('fail'));
    expect(result).toEqual({
      content: [{ type: 'text', text: 'Error: fail' }],
      isError: true,
    });
  });

  it('wraps string error', () => {
    const result = wrapErrorResponse('something broke');
    expect(result).toEqual({
      content: [{ type: 'text', text: 'Error: something broke' }],
      isError: true,
    });
  });
});
