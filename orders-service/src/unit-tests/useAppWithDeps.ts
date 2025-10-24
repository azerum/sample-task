import { AsyncDisposableStack } from '@whatwg-node/disposablestack'
import { useApp } from './useApp.js'
import { useMongoDb } from './useMongoDb.js'
import { useRabbitmq } from './useRabbitmq.js'

export async function useAppWithDeps() {
    // Note: if this function throws before returning, any created
    // resources are disposed
    //
    // If it does return, it returns AsyncDisposable that disposes all resources

    await using stack = new AsyncDisposableStack()

    const mongo = stack.use(await useMongoDb())
    const rabbit = stack.use(await useRabbitmq())

    stack.use(await useApp({
        args: [],

        env: {
            RABBITMQ_URL: rabbit.url,
            MONGODB_URL: mongo.url,
        }
    }))

    const moved = stack.move()

    return {
        mongo,
        rabbit,

        async [Symbol.asyncDispose]() {
            await moved[Symbol.asyncDispose]()
        }
    }
}
