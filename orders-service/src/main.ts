import { ordersCreator } from './ordersCreator.js'
import { makeRabbit } from './rabbit.js'
import { paymentStatusUpdater } from './paymentStatusUpdater.js'
import { publishUnpublishedEvents } from './publishUnpublishedEvents.js'
import { load } from 'ts-dotenv'
import { appEnvSchema } from './AppEnv.js'
import mongoose from 'mongoose'
import { deferAsync } from './utils/deferAsync.js'

void main()

async function main() {
    const appEnv = load(appEnvSchema)

    await mongoose.connect(appEnv.MONGODB_URL)
    await using _mongo = deferAsync(() => mongoose.disconnect())

    await using rabbit = makeRabbit(appEnv.RABBITMQ_URL)

    const signal = sigintOrSigtermSignal() 

    await Promise.all([
        ordersCreator(rabbit, signal),
        paymentStatusUpdater(rabbit, signal),
        publishUnpublishedEvents(rabbit, signal),
    ])  
}

function sigintOrSigtermSignal() {
    const controller = new AbortController()

    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, () => {
            console.error(`Handling ${signal}`)
            controller.abort(new Error(`Got ${signal}`))
        })
    }

    return controller.signal
}
