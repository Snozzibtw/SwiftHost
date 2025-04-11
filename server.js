// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency, description, metadata } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            description,
            metadata,
            // In a real app, you might want to add more options here
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('Error creating payment intent:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});