import { eventsOrders, orderCreatedEventZod } from '@azerum/protocol'
import type { Connection } from 'rabbitmq-client'
import type { GatewayPubSub } from './GatewayPubSub.js'

export function subscribeToOrderCreated(
    rabbit: Connection,
    pubSub: GatewayPubSub
) {
    rabbit.createConsumer({
        queue: eventsOrders.gateway,

        queueOptions: {
            durable: false,
            exclusive: true,
        },

        qos: {
            // Tweak as needed
            prefetchCount: 10
        }
    }, async (message) => {
        const event = orderCreatedEventZod.parse(message.body)

        await pubSub.publish('orderCreated', {
            orderCreated: {
                __typename: 'OrderCreatedResponse',
                ...event,
            }
        })
    })
}
