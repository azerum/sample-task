import { eventsOrders, reqOrdersServiceCreateOrder, type CreateOrderRequest } from '@azerum/protocol'
import { rabbit } from './rabbit.js'

rabbit.createConsumer({
    queue: eventsOrders.paymentsService,
}, async m => {
    console.log(m.body)
})

const rpc = rabbit.createRPCClient()

const req: CreateOrderRequest = {
    requestId: '1',
    productName: 'Foobar'
}

await rpc.send(reqOrdersServiceCreateOrder, req)
