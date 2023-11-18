// payment.js
const express = require('express');
const Stripe = require('stripe');
const stripe = Stripe(process.env.SECRET_KEY);
const router = express.Router();

module.exports = function() {
    // Obsługa płatności
    router.post('/charge', async (req, res) => {
        const token = req.body.stripeToken;
        const amount = 4500; // Kwota w groszach, np. 45.00 PLN

        try {
            const charge = await stripe.charges.create({
                amount: amount,
                currency: 'pln',
                description: 'Opłata za dietę',
                source: token,
            });
            res.send('Płatność zakończona sukcesem!');
        } catch (error) {
            console.error("Błąd płatności:", error);
            res.status(500).send('Wystąpił błąd podczas płatności.');
        }
    });

    // Tworzenie sesji płatności
    router.post('/create-checkout-session', async (req, res) => {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card', 'blik'], // Dodaj potrzebne metody płatności
                line_items: [{
                    price_data: {
                        currency: 'pln',
                        product_data: {
                            name: 'Twoja dieta',
                        },
                        unit_amount: 4500, // Cena w groszach, np. 45.00 PLN
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${process.env.BASE_URL}/userProfile`, // URL przekierowania po udanej płatności
                cancel_url: process.env.BASE_URL, // URL przekierowania po anulowaniu płatności
            });
            res.json({ id: session.id });
        } catch (error) {
            console.error("Błąd podczas tworzenia sesji płatności:", error);
            res.status(500).json({ error: 'Nie udało się utworzyć sesji płatności' });
        }
    });

    return router;
};
