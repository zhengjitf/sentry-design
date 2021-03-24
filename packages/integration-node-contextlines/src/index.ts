import { readFileSync } from 'fs';

import { ClientLike, Integration, StackFrame } from '@sentry/types';
import { snipLine } from '@sentry/utils';
import { LRUMap } from 'lru_map';

const DEFAULT_LINES_OF_CONTEXT: number = 7;
const FILE_CONTENT_CACHE = new LRUMap<string, string | null>(100);

// TODO: Write some performance tests for LRU/Promise memory issue.

/**
 * Resets the file cache. Exists for testing purposes.
 * @hidden
 */
export function resetFileContentCache(): void {
  FILE_CONTENT_CACHE.clear();
}

/** Add node modules / packages to the event */
export class ContextLines implements Integration {
  public name = this.constructor.name;

  public install(client: ClientLike): void {
    const linesOfContext =
      (client.options as { frameContextLines?: number }).frameContextLines ?? DEFAULT_LINES_OF_CONTEXT;

    client.addEventProcessor(event => {
      const frames = event.exception?.values?.[0].stacktrace?.frames;

      if (frames) {
        const filenames: string[] = [];

        for (const frame of frames) {
          if (frame.filename && !filenames.includes(frame.filename)) {
            filenames.push(frame.filename);
          }
        }

        const sourceFiles = readSourceFiles(filenames);

        for (const frame of frames) {
          if (frame.filename && sourceFiles[frame.filename]) {
            try {
              const lines = (sourceFiles[frame.filename] as string).split('\n');
              addContextToFrame(lines, frame, linesOfContext);
            } catch (e) {
              // anomaly, being defensive in case
              // unlikely to ever happen in practice but can definitely happen in theory
            }
          }
        }

        return event;
      }

      return event;
    });
  }
}

/**
 * This function adds context (pre/post/line) lines to the provided frame
 *
 * @param lines string[] containing all lines
 * @param frame StackFrame that will be mutated
 * @param linesOfContext number of context lines we want to add pre/post
 */
function addContextToFrame(lines: string[], frame: StackFrame, linesOfContext: number = 5): void {
  const lineno = frame.lineno || 0;
  const maxLines = lines.length;
  const sourceLine = Math.max(Math.min(maxLines, lineno - 1), 0);

  frame.pre_context = lines
    .slice(Math.max(0, sourceLine - linesOfContext), sourceLine)
    .map((line: string) => snipLine(line, 0));

  frame.context_line = snipLine(lines[Math.min(maxLines - 1, sourceLine)], frame.colno || 0);

  frame.post_context = lines
    .slice(Math.min(sourceLine + 1, maxLines), sourceLine + 1 + linesOfContext)
    .map((line: string) => snipLine(line, 0));
}

/**
 * This function reads file contents and caches them in a global LRU cache.
 *
 * @param filenames Array of filepaths to read content from.
 */
function readSourceFiles(filenames: string[]): Record<string, string | null> {
  // we're relying on filenames being de-duped already
  if (!filenames.length) {
    return {};
  }

  const sourceFiles: Record<string, string | null> = {};

  for (const filename of filenames) {
    const cache = FILE_CONTENT_CACHE.get(filename);
    // We have a cache hit
    if (cache !== undefined) {
      // If stored value is null, it means that we already tried, but couldnt read the content of the file. Skip.
      if (cache === null) {
        continue;
      }

      // Otherwise content is there, so reuse cached value.
      sourceFiles[filename] = cache;
      continue;
    }

    let content: string | null;
    try {
      content = readFileSync(filename, 'utf8');
    } catch (_e) {
      content = null;
    }

    FILE_CONTENT_CACHE.set(filename, content);
    sourceFiles[filename] = content;
  }

  return sourceFiles;
}
