type Task<T> = () => PromiseLike<T>;

export class AsyncBuffer<T> {
  private readonly _limit: number;
  private readonly _buffer: Array<PromiseLike<T>> = [];

  public constructor(limit: number) {
    this._limit = limit;
  }

  get length(): number {
    return this._buffer.length;
  }

  public add(task: Task<T>): PromiseLike<T> {
    if (this.length >= this._limit) {
      // TODO: Use SentryError
      return Promise.reject(new Error('Not adding task due to buffer limit reached.'));
    }

    const taskResult = task();

    taskResult.then(
      result => {
        this._remove(taskResult);
        return result;
      },
      error => {
        this._remove(taskResult);
        return error;
      },
    );

    this._buffer.push(taskResult);

    return taskResult;
  }

  public drain(timeout: number): PromiseLike<boolean> {
    return new Promise<boolean>(resolve => {
      const capturedSetTimeout = setTimeout(() => resolve(false), timeout);

      Promise.all(this._buffer).then(
        () => {
          clearTimeout(capturedSetTimeout);
          resolve(true);
        },
        () => {
          resolve(true);
        },
      );
    });
  }

  private _remove(bufferedTask: PromiseLike<T>): void {
    this._buffer.splice(this._buffer.indexOf(bufferedTask), 1);
  }
}
