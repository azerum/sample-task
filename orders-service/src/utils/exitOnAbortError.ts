/**
 * Wraps `fn`. If `fn` throws AbortError (one thrown by AbortSignal.throwIfAborted()),
 * returns `undefined` instead of throwing
 */
export async function catchAbortError(fn: () => Promise<void>) {
    try {
        await fn()
    }
    catch (exception) {
        if (looksLikeAbortError(exception)) {
            return
        }

        throw exception
    }
}

function looksLikeAbortError(exception: unknown): boolean {
    return exception instanceof Error && exception.name === 'AbortError'
}
