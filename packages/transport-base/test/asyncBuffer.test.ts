import { AsyncBuffer } from '../src/asyncBuffer';

describe('AsyncBuffer', () => {
  describe('add()', () => {
    test('should add task when there is free slot', async () => {
      const buffer = new AsyncBuffer<void>(10);
      void buffer.add(
        () => new Promise<void>(resolve => resolve()),
      );
      expect(buffer.length).toEqual(1);
    });

    test('should throw when buffer is full', async () => {
      const buffer = new AsyncBuffer<void>(1);
      const taskResult = new Promise<void>(resolve => resolve());
      const task = () => taskResult;
      expect(buffer.add(task)).toEqual(taskResult);
      void expect(
        buffer.add(
          () => new Promise<void>(resolve => resolve()),
        ),
      ).rejects.toThrowError('Not adding task due to buffer limit reached.');
      expect(buffer.length).toEqual(1);
    });

    test('should not execute added task when buffer is full', async () => {
      const buffer = new AsyncBuffer<void>(1);
      const firstTask = () => new Promise<void>(resolve => resolve());
      const secondTask = jest.fn();
      void buffer.add(firstTask);
      await expect(buffer.add(secondTask)).rejects.toThrowError('Not adding task due to buffer limit reached.');
      expect(secondTask).not.toHaveBeenCalled();
    });

    test('should remove resolved task from buffer', async () => {
      expect.assertions(2);
      const buffer = new AsyncBuffer<void>(10);
      const task = () => new Promise<void>(resolve => resolve());
      void buffer.add(task);
      expect(buffer.length).toEqual(1);
      await task;
      expect(buffer.length).toEqual(0);
    });

    test('should remove rejected task from buffer', async () => {
      expect.assertions(2);
      const buffer = new AsyncBuffer<void>(10);
      const taskResult = new Promise<void>((_resolve, reject) => reject());
      const task = () => taskResult;
      void buffer.add(task);
      expect(buffer.length).toEqual(1);
      try {
        await taskResult;
      } catch (_) {
        expect(buffer.length).toEqual(0);
      }
    });

    test('should allow for promise chaining directly onto the call', async () => {
      expect.assertions(2);
      const buffer = new AsyncBuffer<string>(10);
      const okTask = () => new Promise<string>(resolve => resolve('ok'));
      const failTask = () => new Promise<string>((_resolve, reject) => reject(new Error('fail')));
      await expect(buffer.add(okTask)).resolves.toEqual('ok');
      await expect(buffer.add(failTask)).rejects.toThrowError('fail');
    });
  });

  describe('drain()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    test('should return `true` if resolves all buffered tasks before reaching timeout', async () => {
      expect.assertions(3);
      const buffer = new AsyncBuffer<void>(10);
      for (let i = 0; i < 5; i++) {
        void buffer.add(
          () => new Promise<void>(resolve => resolve()),
        );
      }
      expect(buffer.length).toEqual(5);
      buffer.drain(1000).then(drained => {
        expect(drained).toEqual(true);
        expect(buffer.length).toEqual(0);
      }, undefined);
      jest.advanceTimersByTime(250);
    });

    test('should return `false` if did not resolve all buffered tasks before reaching timeout', async () => {
      expect.assertions(3);
      const buffer = new AsyncBuffer<void>(10);
      for (let i = 0; i < 5; i++) {
        void buffer.add(
          () => new Promise<void>(resolve => setTimeout(resolve, i * 100)),
        );
      }
      expect(buffer.length).toEqual(5);
      buffer.drain(250).then(drained => {
        expect(drained).toEqual(false);
        expect(buffer.length).toEqual(2);
      }, undefined);
      jest.advanceTimersByTime(250);
    });

    test('should return `true` if buffer is empty', async () => {
      expect.assertions(3);
      const buffer = new AsyncBuffer<void>(10);
      expect(buffer.length).toEqual(0);
      buffer.drain(1000).then(drained => {
        expect(drained).toEqual(true);
        expect(buffer.length).toEqual(0);
      }, undefined);
      jest.advanceTimersByTime(250);
    });

    test('should fail-safe with a `true` value if any buffered task rejects', async () => {
      expect.assertions(2);
      const buffer = new AsyncBuffer<void>(10);
      void buffer.add(
        () => new Promise<void>(resolve => resolve()),
      );
      void buffer.add(
        () => new Promise<void>((_resolve, reject) => reject()),
      );
      buffer.drain(1000).then(drained => {
        expect(drained).toEqual(true);
        expect(buffer.length).toEqual(0);
      }, undefined);
      jest.advanceTimersByTime(250);
    });
  });
});
