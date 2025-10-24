import type { OrderCreatedEvent } from '@azerum/protocol'
import { getUnpublishedOrderCreatedEvents } from './data-access.js'
import { publishEvent } from './ordersCreator.js'
import { makeOrdersEventPublisher } from './rabbit.js'
import type { Connection, Publisher } from 'rabbitmq-client'
import { catchAbortError } from './utils/exitOnAbortError.js'

export async function publishUnpublishedEvents(
    rabbit: Connection,
    signal?: AbortSignal
) {
    await using publisher = makeOrdersEventPublisher(rabbit)
    const events = getUnpublishedOrderCreatedEvents(signal)

    // Tweak concurrency as needed
    const concurrency = 10

    const workersPromises = Array(concurrency).fill(0)
        .map(() => worker(publisher, events))

    await Promise.all(workersPromises)
}

async function worker(
    publisher: Publisher,
    events: AsyncIterable<OrderCreatedEvent>
) {
    await catchAbortError(async () => {
        for await (const e of events) {
            await publishEvent(publisher, e)
        }
    })
}
