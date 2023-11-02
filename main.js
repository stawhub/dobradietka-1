console.log("Skrypt main.js został załadowany")
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("clientDataForm").addEventListener("submit", function(event) {
document.getElementById("clientDataForm").addEventListener("submit", function(event) {
    event.preventDefault();
    
    // Pobierz dane z formularza
    const data = {
        age: document.getElementById("age").value,
        gender: document.getElementById("gender").value,
        weight: document.getElementById("weight").value,
        height: document.getElementById("height").value,
        activityLevel: document.getElementById("activityLevel").value,
        goal: document.getElementById("goal").value,
        email: document.getElementById("email").value
    };

    // Wyślij zapytanie do serwera
    fetch("/getDiet", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        // Wyświetl przypisaną kalorykę na stronie
        const resultMessage = `${data.message} Przypisana kaloryka: ${data.assignedCalories} kcal.`;
        document.getElementById("dietResult").textContent = resultMessage;
    });
});
});
});