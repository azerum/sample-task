import { Connection } from 'rabbitmq-client'

export function makeRabbit() {
    return new Connection({
        url: 'amqp://guest:guest@127.0.0.1:5672'
    })
}

export function makeOrdersEventPublisher(rabbit: Connection) {
    return rabbit.createPublisher({ 
        confirm: true,
    })
}
