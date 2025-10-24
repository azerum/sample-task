import { ordersCreator } from './ordersCreator.js'
import { makeRabbit } from './rabbit.js'
import { connectToDb, disconnectFromDb } from './data-access.js'
import { paymentStatusUpdater } from './paymentStatusUpdater.js'
import { deferAsync } from './utils/deferAsync.js'
import { publishUnpublishedEvents } from './publishUnpublishedEvents.js'

export async function start() {
    await connectToDb()
    await using _db = deferAsync(disconnectFromDb)

    const rabbit = makeRabbit()
    await using _rabbit = deferAsync(() => rabbit.close())

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
