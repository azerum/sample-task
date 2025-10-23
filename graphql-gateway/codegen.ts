import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: './schema.graphql',

  generates: {
    './src/graphql.generated.ts': {
      plugins: [
        'typescript',
        'typescript-resolvers'
      ],

      config: {
        useTypeImports: true,

        // Better types for resolvers
        // Credits to: https://github.com/dotansimha/graphql-code-generator/issues/1219#issuecomment-842796074
        //
        // By default return types of resolvers require all fields. However, 
        // for nested object types, we usually define resolvers separately.
        //
        // E.g. instead of defining 
        //
        // ```
        // const resolvers = {
        //   Query: {
        //     users: () => [{ username: 'Bob', posts: [...] }] 
        //   }
        // }
        // ```
        //
        // We do:
        //
        // ```
        // const resolvers = {
        //   Query: {
        //     users: () => [{ username: 'Bob' }] 
        //   },
        //
        //   User: {
        //     posts: () => [...]
        //   }
        // }
        // ```
        //
        // This config makes inner object types (including ones in arrays)
        // optional (by adding `| undefined`)
        //
        // Finally, it also allows resolver fns to be async

        resolverTypeWrapperSignature: `
          Promisable<T extends { __typename: string } ? { [K in keyof T]: DeepLazy<T[K]> } : T>

          export type DeepLazy<T> = 
            T extends { __typename: string } | Array<{ __typename: string }>
              ? { [K in keyof T]: DeepLazy<T[K]> } | undefined
            : T extends Scalars[keyof Scalars]
              ? T
            : T extends { [K in string | number]: any }
              ? { [K in keyof T]: DeepLazy<T[K]> }
            : T
            
          export type Promisable<T> = Promise<T> | T
        `,

        nonOptionalTypename: true,

        customResolverFn: `
          (
            parent: UnwrapPromise<ResolverTypeWrapper<TParent>>, 
            args: TArgs, 
            context: TContext, 
            info: GraphQLResolveInfo
          ) => Promisable<TResult>;

          export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
        `
      }
    }
  }
}

export default config
