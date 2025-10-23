import type { Resolvers } from './graphql.generated.js'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { readFileSync } from 'fs'
import path from 'path'
import { rpcClient } from './rabbit.js'
import { createOrder } from '@azerum/protocol'

const typeDefs = readFileSync(
    path.resolve(import.meta.dirname, '../schema.graphql'),
    'utf-8'
)

interface Context {
    userId: string
}

const resolvers: Resolvers<Context> = {
    Query: {
        order: async (_source, _args) => {
            throw new Error('Not implemented')
        }
    },

    Mutation: {
        createOrder: async (_source, args, context) => {
            const response = await createOrder(rpcClient, {
                requestId: `${context.userId}.${args.input.requestId}`,
                productName: args.input.productName,
            })

            switch (response.type) {
                case 'Ok': {
                    return response.orderId
                }

                case 'Error': {
                    throw new Error(response.message)
                }
            }
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
})

startStandaloneServer<Context>(server, {
    listen: {
        port: 8080
    },

    context: async () => ({ userId: 'Bob' }),
})
