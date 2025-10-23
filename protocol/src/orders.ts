import z, {} from 'zod'

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

export const reqOrdersServiceCreateOrder = 'req.orders-service.create-order'

export const orderCreatedEventZod = z.object({
    orderId: z.string(),
    createdAtMs: z.number(),
})

export type OrderCreatedEvent = z.infer<typeof orderCreatedEventZod>

export const eventsOrders = {
    gateway: 'events.orders.gateway',
    paymentsService: 'events.orders.payments-service'
} as const
