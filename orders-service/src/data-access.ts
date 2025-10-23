import type { CreateOrderRequest, OrderCreatedEvent } from '@azerum/protocol/out/orders.js'
import { OrderModel } from './mongo-schema.js'

export async function upsertOrder(
    request: CreateOrderRequest
): Promise<OrderCreatedEvent> {
    const createdAtMs = Date.now()

    const order = await OrderModel.findOneAndUpdate(
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
        },
    )

    return {
        orderId: order._id.toHexString(),
        createdAtMs,
    }
}

export async function markOrderCreateEventAsPublished(orderId: string) {
    await OrderModel.findOneAndUpdate(
        { _id: orderId },
        { sentCreatedEvent: true }
    )
}

export async function* getUnpublishedCreateEvents(): AsyncIterable<OrderCreatedEvent> {
    const docs = OrderModel.find(
        { sentCreatedEvent: false },
        { 
            _id: true,
            createdAtMs: true,
        }
    ).cursor()

    for await (const aDoc of docs) {
        yield {
            orderId: aDoc._id.toHexString(),
            createdAtMs: aDoc.createdAtMs,
        }
    }
}
