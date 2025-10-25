import type { CreateOrderRequest, OrderCreatedEvent } from '@azerum/protocol'
import { OrderModel } from './mongo-schema.js'

export type UpsertOrderResult = 
    | { type: 'AlreadyExists', id: string }
    | { type: 'Created', event: OrderCreatedEvent }

export async function upsertOrder(
    request: CreateOrderRequest
): Promise<UpsertOrderResult> {
    const createdAtMs = Date.now()

    const result = await OrderModel.findOneAndUpdate(
        { createRequestId: request.requestId },

        {
            $setOnInsert: {
                createRequestId: request.requestId,
                productName: request.productName,
                createdAtMs,
                sentCreatedEvent: false,
            }
        },

        {
            upsert: true,
            returnDocument: 'after',
            projection: { _id: true },
            includeResultMetadata: true,
        },
    )

    if (result.value === null) {
        throw new Error(`Should not happen: findOneAndUpdate returned null. requestId: ${request.requestId}`)
    }

    if (result.lastErrorObject?.updatedExisting === true) {
        return { 
            type: 'AlreadyExists', 
            id: result.value._id.toHexString() 
        }
    }

    return {
        type: 'Created',

        event: {
            orderId: result.value._id.toHexString(),
            createdAtMs,
        }
    }
}

export async function markOrderCreateEventAsPublished(orderId: string) {
    await OrderModel.findOneAndUpdate(
        { _id: orderId },
        { sentCreatedEvent: true }
    )
}

export async function* getUnpublishedOrderCreatedEvents(
    signal?: AbortSignal
): AsyncIterable<OrderCreatedEvent> {
    signal?.throwIfAborted()

    const docs = OrderModel.find(
        { sentCreatedEvent: false },
        { 
            _id: true,
            createdAtMs: true,
        }
    ).cursor({
        lean: true,
    })

    for await (const aDoc of docs) {
        signal?.throwIfAborted()

        yield {
            orderId: aDoc._id.toHexString(),
            createdAtMs: aDoc.createdAtMs,
        }
    }
}
