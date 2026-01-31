/**
 * 使用锁定的函数
 * @param fn 需要锁定的函数
 * @returns 锁定的函数
 */
export function useLockFn<
  T extends (...args: any[]) => Promise<any>,
>(fn: T): T {
  let locked = false

  return (async (...args: any[]) => {
    if (locked) {
      return
    }
    locked = true
    try {
      return await fn(...args)
    }
    finally {
      locked = false
    }
  }) as T
}
