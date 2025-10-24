import { reqOrdersServiceCreateOrder, type CreateOrderResponse, createOrderRequestZod, type OrderCreatedEvent, eventsOrders } from '@azerum/protocol'
import { upsertOrder, markOrderCreateEventAsPublished } from './data-access.js'
import { exceptionToMessage } from './exceptionToMessage.js'
import { once } from 'events'
import type { Publisher, Connection } from 'rabbitmq-client'

export async function ordersCreator(
    rabbit: Connection,
    signal: AbortSignal
) {
    const publisher = rabbit.createPublisher({
        confirm: true,
    })

    const consumer = rabbit.createConsumer({
        queue: reqOrdersServiceCreateOrder,

        queueOptions: {
            durable: true,
        },

        qos: {
            // Tweak as needed
            prefetchCount: 2,
        },
    }, async (message, reply) => {
        const response = await handleRequest(publisher, message.body)
        await reply(response)
    })

    await once(signal, 'abort')
    await consumer.close()
    await publisher.close()
}

async function handleRequest(
    publisher: Publisher,
    body: unknown
): Promise<CreateOrderResponse> {
    try {
        const orderId = await handleRequestOrThrow(publisher, body)
        return { type: 'Ok', orderId }
    }
    catch (exception) {
        return {
            type: 'Error',
            message: exceptionToMessage(exception),
        }
    }
}

/**
 * @returns Order ID
 */
async function handleRequestOrThrow(
    publisher: Publisher,
    body: unknown
): Promise<string> {
    const request = createOrderRequestZod.parse(body)

    const createdEvent = await upsertOrder(request)
    await publishEvent(publisher, createdEvent)

    return createdEvent.orderId
}

export async function publishEvent(publisher: Publisher, event: OrderCreatedEvent) {
    const toGateway = publisher.send(
        {
            routingKey: eventsOrders.gateway,
            mandatory: false,
        },

        event
    )

    const toPaymentsService = publisher.send(
        {
            routingKey: eventsOrders.paymentsService,
            mandatory: true,
        },

        event
    )

    // TODO: retry errors few times
    await Promise.all([toGateway, toPaymentsService])

    await markOrderCreateEventAsPublished(event.orderId)
}
