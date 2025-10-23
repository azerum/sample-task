import { reqOrdersServiceCreateOrder, type CreateOrderResponse, createOrderRequestZod, type OrderCreatedEvent, eventsOrders } from '@azerum/protocol'
import { upsertOrder, markOrderCreateEventAsPublished, getUnpublishedCreateEvents } from './data-access.js'
import { exceptionToMessage } from './exceptionToMessage.js'
import { rabbit } from './rabbit.js'

export async function ordersCreator() {
    void publishRemainingEvents()

    rabbit.createConsumer({
        queue: reqOrdersServiceCreateOrder,

        queueOptions: {
            durable: true,
        },

        qos: {
            // Tweak as needed
            prefetchCount: 2,
        },
    }, async (message, reply) => {
        const response = await handleRequest(message.body)
        await reply(response)
    })
}

const publisher = rabbit.createPublisher({
    confirm: true,
})

async function handleRequest(body: unknown): Promise<CreateOrderResponse> {
    try {
        const orderId = await handleRequestOrThrow(body)
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
async function handleRequestOrThrow(body: unknown): Promise<string> {
    const request = createOrderRequestZod.parse(body)
    console.log('Parsed', request)

    const createdEvent = await upsertOrder(request)
    console.log('Upserted')

    await publishEvent(createdEvent)
    console.log('Published')

    return createdEvent.orderId
}

async function publishEvent(event: OrderCreatedEvent) {
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

async function publishRemainingEvents() {
    const events = getUnpublishedCreateEvents()

    // Tweak concurrency as needed
    const concurrency = 10
    const workersPromises = Array(concurrency).fill(0).map(() => worker(events))

    await Promise.all(workersPromises)

    async function worker(events: AsyncIterable<OrderCreatedEvent>) {
        for await (const e of events) {
            await publishEvent(e)
        }
    }
}
