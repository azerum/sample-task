import { GenericContainer } from "testcontainers"

export interface MongoResource extends AsyncDisposable {
    readonly url: string
}

export async function useMongoDb(): Promise<MongoResource> {
    const container = await new GenericContainer("mongo:8.0.15-noble")
        .withExposedPorts(27017)
        .withTmpFs({ '/data/db': 'rw' })
        .start()

    return {
        url: `mongodb://${container.getHost()}:${container.getMappedPort(27017)}`,

        async [Symbol.asyncDispose]() {
            await container.stop()
        },
    }
}
