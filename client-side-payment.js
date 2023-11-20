var stripe = Stripe('pk_test_51Nfr3cIAZO7dV02UfODgCz2IFfgGykeoqHzMJRodQqZ02mvsNp3Atm2QHqIc8NqD95npQbK2ECpN5lXS6p1kUfGp00g3AM0lce');

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
            stripe.redirectToCheckout({ sessionId: session.id });
        } else {
            throw new Error('Problem z utworzeniem sesji płatności');
        }
    } catch (error) {
        console.error('Błąd inicjowania procesu płatności:', error);
        alert('Nie udało się zainicjować płatności. Spróbuj ponownie później.');
    }
}
