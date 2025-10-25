import { ApolloServer } from '@apollo/server'
import { readFileSync } from 'fs'
import path from 'path'
import { expressMiddleware } from '@as-integrations/express5'
import express from 'express'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/use/ws'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeResolvers } from './makeResolvers.js'
import { subscribeToOrderCreated } from './subscribeToOrderCreated.js'
import { type GatewayPubSub } from './GatewayPubSub.js'
import { rabbit } from './rabbit.js'
import { PubSub } from 'graphql-subscriptions'

const typeDefs = readFileSync(
    path.resolve(import.meta.dirname, '../schema.graphql'),
    'utf-8'
)

const pubSub: GatewayPubSub = new PubSub()

subscribeToOrderCreated(rabbit, pubSub)
const resolvers = makeResolvers(rabbit, pubSub)

const schema = makeExecutableSchema({ typeDefs, resolvers })

const app = express()
const httpServer = createServer(app)

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/subscriptions',
})

const serverCleanup = useServer({ schema }, wsServer)

const server = new ApolloServer({
    schema,
    introspection: true,

    plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),

        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose()
                    },
                }
            },
        }
    ]
})

await server.start()

app.use('/graphql', express.json(), expressMiddleware(server, {
    context: async () => ({ userId: 'Bob' })
}))

httpServer.listen(8080)
