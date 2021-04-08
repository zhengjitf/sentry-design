import * as fs from 'fs';

import { SentryEvent, StackFrame } from '@sentry/types';

import { ContextLines, addContextToFrame } from '../src/index';

jest.mock('fs');
(fs.readFileSync as jest.Mock).mockReturnValue('hi');

// NOTE: We are not clearing cache between individual tests. Make sure to use unique frame filenames.

describe('ContextLines', () => {
  const contextLines = new ContextLines();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('caches the same file', () => {
    const event: SentryEvent = {
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                {
                  filename: '/var/task/same1.js',
                },
              ],
            },
          },
        ],
      },
    };
    contextLines.process(event);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    // Calls to readFile shouldn't increase if there is no new error
    contextLines.process(event);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });

  test('fallbacks to reading file if missed cache hit', () => {
    const event1: SentryEvent = {
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                {
                  filename: '/var/task/fallback1.js',
                },
                {
                  filename: '/var/task/fallback1.js',
                },
                {
                  filename: '/var/task/fallback3.js',
                },
              ],
            },
          },
        ],
      },
    };

    const event2: SentryEvent = {
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                {
                  filename: '/var/task/fallback1.js',
                },
                {
                  filename: '/var/task/fallback2.js',
                },
                {
                  filename: '/var/task/fallback3.js',
                },
              ],
            },
          },
        ],
      },
    };

    // fallback1.js [miss], fallback1.js [hit], fallback3.js [miss]
    contextLines.process(event1);
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    // fallback1.js [hit], fallback2.js [miss], fallback3.js [hit]
    contextLines.process(event2);
    expect(fs.readFileSync).toHaveBeenCalledTimes(3);
  });

  test('works with file:// protocol', () => {
    const event: SentryEvent = {
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                {
                  filename: 'file:///var/task/file1.js',
                },
              ],
            },
          },
        ],
      },
    };
    contextLines.process(event);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });

  test('null value (reading error) is treated as cache hit', () => {
    const event: SentryEvent = {
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                {
                  filename: '/var/task/null1.js',
                },
                {
                  filename: '/var/task/null1.js',
                },
              ],
            },
          },
        ],
      },
    };
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(null);
    contextLines.process(event);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });

  describe('addContextToFrame', () => {
    const lines = [
      '1: a',
      '2: b',
      '3: c',
      '4: d',
      '5: e',
      '6: f',
      '7: g',
      '8: h',
      '9: i',
      '10: j',
      '11: k',
      '12: l',
      '13: m',
      '14: n',
    ];

    test('start of file', () => {
      const frame: StackFrame = {
        lineno: 0,
      };
      addContextToFrame(lines, frame, 5);
      expect(frame.pre_context).toEqual([]);
      expect(frame.context_line).toEqual('1: a');
      expect(frame.post_context).toEqual(['2: b', '3: c', '4: d', '5: e', '6: f']);
    });

    test('mid of file', () => {
      const frame: StackFrame = {
        lineno: 4,
      };
      addContextToFrame(lines, frame, 5);
      expect(frame.pre_context).toEqual(['1: a', '2: b', '3: c']);
      expect(frame.context_line).toEqual('4: d');
      expect(frame.post_context).toEqual(['5: e', '6: f', '7: g', '8: h', '9: i']);
    });

    test('end of file', () => {
      const frame: StackFrame = {
        lineno: 14,
      };
      addContextToFrame(lines, frame, 5);
      expect(frame.pre_context).toEqual(['9: i', '10: j', '11: k', '12: l', '13: m']);
      expect(frame.context_line).toEqual('14: n');
      expect(frame.post_context).toEqual([]);
    });

    test('negative', () => {
      const frame: StackFrame = {
        lineno: -1,
      };
      addContextToFrame(lines, frame, 5);
      expect(frame.pre_context).toEqual([]);
      expect(frame.context_line).toEqual('1: a');
      expect(frame.post_context).toEqual(['2: b', '3: c', '4: d', '5: e', '6: f']);
    });

    test('overshoot', () => {
      const frame: StackFrame = {
        lineno: 999,
      };
      addContextToFrame(lines, frame, 5);
      expect(frame.pre_context).toEqual(['10: j', '11: k', '12: l', '13: m', '14: n']);
      expect(frame.context_line).toEqual('14: n');
      expect(frame.post_context).toEqual([]);
    });
  });
});
