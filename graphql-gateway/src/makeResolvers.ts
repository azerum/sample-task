import { createOrder } from '@azerum/protocol'
import type { Resolvers } from './graphql.generated.js'
import type { Connection } from 'rabbitmq-client'
import { pubSubAsyncIterator, type GatewayPubSub } from './GatewayPubSub.js'
import type { Context } from './Context.js'

export function makeResolvers(
    rabbit: Connection, 
    pubSub: GatewayPubSub,
): Resolvers<Context> {
    const rpcClient = rabbit.createRPCClient({
        timeout: 10_000,
    })

    return {
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
        },

        Subscription: {
            orderCreated: {
                subscribe: () => pubSubAsyncIterator(pubSub, ['orderCreated']) 
            }
        }
    }
}

