// client-side-payment.js
const stripePublicKey = 'pk_live_51Nfr3cIAZO7dV02UsjYLguZJLCzIXfcUZfzOXcGlDkr5N4zXmcHMKg4ZNXqA4qowl215SuJeXFzqaojkMu4zYLaf00cIJx3cjP';
async function initiatePaymentProcess() {
    try {
        const response = await fetch('/payment/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ /* dane, jeśli są potrzebne */ })
        });

        const session = await response.json();

        if (response.ok) {
            // Przekierowanie do Stripe Checkout
            const stripe = Stripe('twoj_publiczny_klucz_stripe');
            stripe.redirectToCheckout({ sessionId: session.id });
        } else {
            throw new Error('Problem z utworzeniem sesji płatności');
        }
    } catch (error) {
        console.error('Błąd inicjowania procesu płatności:', error);
        alert('Nie udało się zainicjować płatności. Spróbuj ponownie później.');
    }
}
