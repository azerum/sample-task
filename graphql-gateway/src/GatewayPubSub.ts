import type { PubSub } from 'graphql-subscriptions'
import type { OrderCreatedResponse } from './graphql.generated.js'

export type GatewayPubSub = PubSub<{
    orderCreated: {
        orderCreated: OrderCreatedResponse
    },

    paymentStatusChanged: {
        paymentStatusChanged: number
    }
}>

/**
 * Strongly-typed wrapper for `pubSub.asyncIterableIterator()`
 */
export function pubSubAsyncIterator<
    TEvents extends Record<string, unknown>,
    K extends Extract<keyof TEvents, string>
>(
    pubSub: PubSub<TEvents>,
    triggers: K[],
): AsyncIterableIterator<TEvents[K]> {
    return pubSub.asyncIterableIterator(triggers)
}
