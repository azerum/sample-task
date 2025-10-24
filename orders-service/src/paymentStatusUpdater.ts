import type { Connection } from 'rabbitmq-client'

export async function paymentStatusUpdater(
    _rabbit: Connection,
    _signal: AbortSignal
) {
    // TODO
}
