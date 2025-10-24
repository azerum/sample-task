import { GenericContainer } from "testcontainers"

export interface RabbitResource extends AsyncDisposable {
    readonly url: string
}

export async function useRabbitmq(): Promise<RabbitResource> {
    const container = await new GenericContainer("rabbitmq:4.1.4-alpine")
        .withExposedPorts(5672)
        .withReuse()
        .start()

    const url = `amqp://guest:guest@${container.getHost()}:${container.getMappedPort(5672)}`

    return {
        url,
        
        async [Symbol.asyncDispose]() {
            await container.stop()
        },
    }
}
