const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000;

// Middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@atlascluster.fui4cy3.mongodb.net/${process.env.DB}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {

    try {
        await client.connect();

        const database = client.db('Bicycle-Shop');
        const bicycleCollection = database.collection('bicycles');
        const orderCollection = database.collection('orders');
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection('reviews');

        app.get('/', async (req, res) => {
            res.send('Bicycle Ride Server Running')
        })

        // exploring products
        app.get('/explore', async (req, res) => {
            const cursor = bicycleCollection.find({});
            const result = await cursor.toArray();
            res.json(result)
        })

        // details by products id
        app.get('/explore/:requestedId', async (req, res) => {
            const cycleId = req.params.requestedId;
            const query = { _id: ObjectId(cycleId) };
            const result = await bicycleCollection.findOne(query);
            res.json(result);
        })

        // receiving order and store ind DB
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = orderCollection.insertOne(order);
            res.json(result)
        })

        // manage orders (showing all orders)
        app.get('/allorders', async (req, res) => {
            const requestedEmail = req.query.email;
            const query = { buyerEmail: requestedEmail }

            const cursor = orderCollection.find(query);
            const result = await cursor.toArray();

            res.json(result);
        })

        // cancel order
        app.delete('/cancel', async (req, res) => {
            const requestedId = req.query.orderId;
            const query = { _id: ObjectId(requestedId) };

            const result = await orderCollection.deleteOne(query);

            res.json('delete success')
        })

        // saving register users to database
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })

        // saving logged in users to database
        app.put('/users', async (req, res) => {
            const user = req.body;

            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };

            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        // making admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        // check an user has admin role
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

        // admin adding products to database
        app.post('/addProduct', async (req, res) => {
            const product = req.body;
            const result = await bicycleCollection.insertOne(product);
            res.json(result)
        })

        // get reviews from database
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const result = await cursor.toArray();
            res.json(result);
        })

        // take review from user
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        })
    }
    finally {
        // client.close();

    }
}
run().catch(console.dir)

app.listen(port, () => {
    console.log('Server running at ', port);
})