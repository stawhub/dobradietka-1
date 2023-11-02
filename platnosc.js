var stripe = Stripe('pk_test_51Nfr3cIAZO7dV02UfODgCz2IFfgGykeoqHzMJRodQqZ02mvsNp3Atm2QHqIc8NqD95npQbK2ECpN5lXS6p1kUfGp00g3AM0lce'); 

console.log("Skrypt platnosc.js został załadowany");

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("checkout-button").addEventListener("click", function() {
        console.log("Formularz został wysłany");
    });

    fetch("/create-checkout-session", {
        method: "POST",
    })
    .then(function(response) {
        console.log("Otrzymano odpowiedź z serwera");
        if (!response.ok) {
            console.error("Błąd odpowiedzi serwera:", response.statusText);
        }
        return response.json();
    })
    .then(function(session) {
        console.log("Próbuję przekierować do Stripe z sesją:", session.id);
        return stripe.redirectToCheckout({ sessionId: session.id });
    })
    .then(function(result) {
        if (result.error) {
            console.error("Błąd podczas przekierowywania do Stripe:", result.error.message);
            alert(result.error.message);
        } else {
            console.log("Przekierowanie do Stripe zakończone sukcesem");
        }
    })
    .catch(function(error) {
        console.error("Wystąpił błąd w procesie płatności:", error);
    });
});
