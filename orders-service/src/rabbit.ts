import { Connection } from 'rabbitmq-client'

export function makeRabbit(url: string,) {
    const connection = new Connection({ url })

    return Object.assign(connection, {
        [Symbol.asyncDispose]: () => connection.close()
    })
}

export function makeOrdersEventPublisher(rabbit: Connection) {
    const publisher = rabbit.createPublisher({ 
        confirm: true,
    })

    return Object.assign(publisher, {
        [Symbol.asyncDispose]: () => publisher.close()
    })
}
