import { IBookFindResult, IBookFindArgs, IBookAddArgs, IBookAddResult } from '@jms-1/mongodb-graphql-server-sample'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import gql from 'graphql-tag'
import fetch from 'node-fetch'

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: createHttpLink({ fetch: fetch as any, uri: 'http://localhost:4000' }),
})

async function run(): Promise<void> {
    try {
        const add = await client.mutate<{ books: { add: IBookAddResult } }, IBookAddArgs>({
            mutation: gql`
                mutation($data: BookInput!) {
                    books {
                        add(data: $data) {
                            _id
                        }
                    }
                }
            `,
            variables: {
                data: {
                    _id: undefined,
                    author: 'Dr. Jochen Manns',
                    reviews: [{ from: 'https://www.psimarron.net' }],
                    title: 'What will never happen',
                    type: 'Adult',
                    year: 2020,
                },
            },
        })

        console.log(add.data.books.add._id)

        const find = await client.query<{ books: { find: IBookFindResult } }, IBookFindArgs>({
            query: gql`
                query($pageSize: Int, $filter: BookFilterInput) {
                    books {
                        find(pageSize: $pageSize, filter: $filter) {
                            _id
                            author
                            title
                            type
                            reviews {
                                from
                            }
                        }
                    }
                }
            `,
            variables: {
                filter: {
                    Or: [{ author: { Eq: 'client-demo' } }, { year: { Gte: 2000 } }],
                    type: { In: ['Adult'] },
                },
                pageSize: 5,
            },
        })

        for (const book of find.data.books.find.items) {
            console.log(`${book.author}: ${book.title} [${book._id}]`)
        }
    } catch (error) {
        console.log(error.message)
    }
}

run()
