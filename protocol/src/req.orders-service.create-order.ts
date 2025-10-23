import { z } from 'zod'
import type { RPCClient } from 'rabbitmq-client'

export async function createOrder(
    rpcClient: RPCClient, 
    request: CreateOrderRequest
): Promise<CreateOrderResponse> {
    const resMsg = await rpcClient.send(reqOrdersServiceCreateOrder, request)
    return createOrderResponseZod.parse(resMsg.body)
}

export const reqOrdersServiceCreateOrder = 'req.orders-service.create-order'

export const createOrderRequestZod = z.object({
    requestId: z.string(),
    productName: z.string(),
})

export type CreateOrderRequest = z.infer<typeof createOrderRequestZod>

export const createOrderResponseZod = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('Ok'),
        orderId: z.string(),
    }),

    z.object({
        type: z.literal('Error'),
        message: z.string(),
    })
])

export type CreateOrderResponse = z.infer<typeof createOrderResponseZod>
