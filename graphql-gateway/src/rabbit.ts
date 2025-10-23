import { Connection } from 'rabbitmq-client'

export const rabbit = new Connection({
    url: 'amqp://guest:guest@127.0.0.1:5672',
})

export const rpcClient = rabbit.createRPCClient({
    timeout: 10_000,
})

rabbit.createConsumer