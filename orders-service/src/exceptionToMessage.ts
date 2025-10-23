export function exceptionToMessage(exception: unknown): string {
    return exception instanceof Error ? exception.message : String(exception)
}
