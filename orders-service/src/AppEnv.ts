import { type EnvSchema, type EnvType } from 'ts-dotenv'

export const appEnvSchema = {
    RABBITMQ_URL: String,
    MONGODB_URL: String,
} satisfies EnvSchema

export type AppEnv = EnvType<typeof appEnvSchema>
