const { ApolloServer, gql } = require('apollo-server');


const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
let mongo

async function context(){
    if(!mongo){
        mongo = await MongoClient.connect('mongodb://localhost:27017/myproject')
        mongo = mongo.db('myproject')
    }
    return { mongo }
}


// // Connection URL
// const url = 'mongodb://localhost:27017';

// // Database Name
// const dbName = 'myproject';

// // Create a new MongoClient
// const client = new MongoClient(url);

// Use connect method to connect to the Server
// async function context() {
// client.connect(function(err) {
//   assert.equal(null, err);
//   console.log(err)
//   console.log("Connected successfully to server - LOCAL MONGODB");
//   const db = client.db(dbName);
//   console.log( db.collection('books'))
//   client.close();
// });
// }





// const mongoose = require('mongoose');

// (async function () {
//     try {
//         mongoose.connect('mongodb://khaledkzy:emp123@ds241664.mlab.com:41664/gql-khaled', { useNewUrlParser: true })
//     } catch (e) {
//         console.error(e)
//     }
// })()

// mongoose.connection.once('open', () => {
//     console.log('conneted to database');
// });

// This is a (sample) collection of books we'll be able to query
// the GraphQL server for.  A more complete example might fetch
// from an existing data source like a REST API or database.
// const booksObj = [
//     {
//         title: 'Harry Potter and the Chamber of Secrets',
//         authorId: 1,
//         movieId: 1

//     },
//     {
//         title: 'Jurassic Park',
//         authorId: 2,
//         movieId: 2
//     },
// ];

const authorsObj = [
    {
        name: 'J.K. Rowling',
        id: 1
    },
    {
        name: 'Michael Crichton',
        id: 2
    }
];

// const moviesObj = [
//     {
//         name: 'Harry Potter and the Chamber of Secrets - Movie',
//         id: 1
//     },
//     {
//         name: 'Jurassic Park - Movie',
//         id: 2
//     }
// ];


// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
const typeDefs = gql`
  # Comments in GraphQL are defined with the hash (#) symbol.

  # This "Book" type can be used in other type declarations.
  type BookType {
    title: String
    author: AuthorType
    movie: MovieType
    _id: String
  }

  type AuthorType {
    name: String
    book: BookType
  }
  type MovieType {
    name: String
    book: BookType
  }


  # The "Query" type is the root of all GraphQL queries.
  # (A "Mutation" type will be covered later on.)
  type Query {
    books: [BookType]
    authors: [AuthorType]
    movies : [MovieType]
    booksConst: [BookType]
    book(_id: String): BookType
  }
  type Mutation {
      addBook(title: String!, authorId: Int!): BookType
  }
`;

// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
const resolvers = {
    Query: {
        booksConst: function () {
            return booksObj
        },
        books: async (parent, args, context) => {

            return await context.mongo.collection('books').find().toArray()
        },
        book: async (parent, args, context) => {
            // {
            //     book(_id: "5c5ace5d85102055117976e6"){
            //       title
            //     }
            //   }
            // console.log(args)

           return await context.mongo.collection('books').findOne(args.id)
        },
        // books: () => booksObj,
        authors:  async (parent, args, context) => await context.mongo.collection('author').find().toArray(),
        movies: async (parent, args, context) => await context.mongo.collection('movies').find().toArray(),
    },
    Mutation:{
        addBook: async (parent,args,context) => {
            // mutation{
            //     addBook(title: "googlex", authorId: 1){
            //   title
            //     }
            //   }
            console.log(args)
            const { title , authorId } = args
        const response =    await context.mongo.collection('books').insertOne({title,authorId})
        console.log(response)
            return response.ops[0]
        }
    },
    BookType: {
        // parent will be Book
        // SO it will go to the
        author: async (parent, args, context) => {
            return await context.mongo.collection('authors').findOne({id: parent.authorId})
        },
        movie: async (parent, args, context) => {
            return await context.mongo.collection('movies').findOne({id: parent.movieId})
        }
    },
    AuthorType: {
        book: (parent) => {
            console.log(parent)
            return async (parent, args, context) => await context.mongo.collection('books').find().toArray().find((book) => book.authorId === parent.id)
        }
    },
};

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({ typeDefs, resolvers, context });

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});