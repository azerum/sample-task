import mongoose, { Schema, type InferSchemaType } from 'mongoose'

export const orderSchema = new Schema({
    createRequestId: {
        type: String,
        required: true,
        unique: true,
    },

    createdAtMs: {
        type: Number,
        required: true,
    },

    productName: {
        type: String,
        required: true,
    },

    paymentStatus: {
        type: String,
        enum: ['pending', 'succeeded', 'failed'],
        required: true,
    },

    sentCreatedEvent: {
        type: Boolean,
        required: true,
    }
})

orderSchema.index({ sentCreatedEvent: 1 }, {
    partialFilterExpression: {
        sentCreatedEvent: false,
    }
})

export type Order = InferSchemaType<typeof orderSchema>
export const OrderModel = mongoose.model('Order', orderSchema)
