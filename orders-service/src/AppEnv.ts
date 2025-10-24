import { type EnvSchema, type EnvType } from 'ts-dotenv'

export const appEnvSchema = {
    RABBITMQ_URL: {
        type: String,
        default: 'amqp://guest:guest@localhost:5672'
    },

    MONGODB_URL: {
        type: String,
        default: 'mongodb://localhost:27017'
    },
} satisfies EnvSchema

export type AppEnv = EnvType<typeof appEnvSchema>
