import { Connection } from 'rabbitmq-client'

export const rabbit = new Connection({
    url: 'amqp://guest:guest@127.0.0.1:5672',
})
