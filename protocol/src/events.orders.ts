import { z } from 'zod'

export const orderCreatedEventZod = z.object({
    orderId: z.string(),
    createdAtMs: z.number(),
})

export type OrderCreatedEvent = z.infer<typeof orderCreatedEventZod>

export const eventsOrders = {
    gateway: 'events.orders.gateway',
    paymentsService: 'events.orders.payments-service'
} as const
