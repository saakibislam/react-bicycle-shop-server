const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()

const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.be9iv.mongodb.net/${process.env.DB}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {

    try {
        await client.connect();

        const database = client.db('bicycleRide');
        const bicycleCollection = database.collection('bicycles');
        const orderCollection = database.collection('orders');
        const usersCollection = database.collection('users');

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

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })

        app.put('/users', async (req, res) => {
            const user = req.body;

            const filter = { email: user.email };
            const options = { upset: true };
            const updateDoc = { $set: user };

            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);

        })

        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            console.log(result);
            res.json(result);
        })

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
    }
    finally {
        // client.close();

    }
}
run().catch(console.dir)

app.listen(port, () => {
    console.log('Server running at ', port);
})