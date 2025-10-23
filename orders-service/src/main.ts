import mongoose from 'mongoose'
import { ordersCreator } from './ordersCreator.js'

void main()

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/orders-service')

    await Promise.all([
        ordersCreator(),
        paymentStatusUpdater(),
    ])   
}

async function paymentStatusUpdater() {

}
