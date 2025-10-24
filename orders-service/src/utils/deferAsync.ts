export function deferAsync(fn: () => Promise<unknown>): AsyncDisposable {
    return {
        async [Symbol.asyncDispose]() {
            await fn()
        }
    }
}