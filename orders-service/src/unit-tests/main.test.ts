import { expect, test } from 'vitest'
import { useAppWithDeps } from './useAppWithDeps.js'
import { makeRabbit } from '../rabbit.js'
import { createOrder, eventsOrders, orderCreatedEventZod } from '@azerum/protocol'
import { deferAsync } from '../utils/deferAsync.js'

test('Happy path', async () => {
    await using app = await useAppWithDeps()
    await using rabbit = makeRabbit(app.rabbit.url)

    await rabbit.queueDeclare(eventsOrders.paymentsService)
    
    const rpcClient = rabbit.createRPCClient()
    await using _ = deferAsync(() => rpcClient.close())

    const response = await createOrder(rpcClient, {
        requestId: '1',
        productName: 'Foo',
    })

    expect.assert(response.type === 'Ok')
    
    const rawEvent = await rabbit.basicGet(eventsOrders.paymentsService)
    const event = orderCreatedEventZod.parse(rawEvent?.body)

    expect(event.orderId).toBe(response.orderId)
}, 5 * 60_000)
