require('dotenv').config({path:'./.env'});
const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const Stripe = require('stripe');
const stripe = Stripe(process.env.SECRET_KEY);
const { S3Client } = require("@aws-sdk/client-s3");
const dietLogic = require('./dietLogic');

// Konfiguracja klienta AWS S3
const s3Client = new S3Client({
    region: "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Połączenie z bazą danych
const connection = mysql.createConnection(process.env.JAWSDB_URL);
connection.connect(err => {
    if (err) {
        console.error('Błąd połączenia z bazą danych JawsDB:', err.stack);
        return;
    }
    console.log('Połączono z bazą danych JawsDB.');
});

// Inicjalizacja aplikacji Express
const app = express();
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET, // Odczytanie klucza z zmiennej środowiskowej
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Ustaw na `true` tylko jeśli używasz HTTPS
    
}))
console.log('utworzono sesję');

// Importowanie i użycie routera auth.js
const authRoutes = require('./routes/auth')(connection);
app.use('/auth', authRoutes);

// Importowanie i użycie routera payment.js
const paymentRoutes = require('./routes/payments')(connection, stripe);
app.use('/payment', paymentRoutes);

// Obsługa żądania diety
const dietLogicInstance = dietLogic(connection, s3Client);
app.post('/kalkulator', async (req, res) => {
    try {
        const userData = req.body;
        const dietResult = await dietLogicInstance.calculateDiet(userData);
        req.session.userData = userData; // Zapisz dane użytkownika w sesji
        req.session.dietResult = dietResult; // Zapisz wynik diety w sesji
        res.redirect('/login'); // Przekieruj do strony logowania
    } catch (error) {
        console.error('Błąd podczas obliczania diety:', error);
        res.status(500).send('Wystąpił błąd serwera.');
    }
});
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Logika po zalogowaniu
app.get('/login-success', (req, res) => {
    if (req.session.userData && req.session.dietResult) {
        res.redirect('/payment'); // Przekieruj do strony płatności
    } else {
        res.redirect('/kalkulator'); // Przekieruj z powrotem do kalkulatora
    }
});

// Logika po pomyślnej płatności
app.get('/payment-success', async (req, res) => {
    if (req.session.userData && req.session.dietResult) {
        try {
            await dietLogicInstance.sendDietEmailAfterPayment(req.session.userData.email, req.session.dietResult.assignedDiet);
            res.redirect('/userProfile'); // Przekieruj do profilu użytkownika
        } catch (error) {
            console.error('Błąd podczas wysyłania e-maila:', error);
            res.status(500).send('Wystąpił błąd serwera.');
        }
    } else {
        res.redirect('/kalkulator'); // Przekieruj z powrotem do kalkulatora
    }
});

// Strony i inne ścieżki
app.get('/userProfile', (req, res) => {
    if (req.session.userData) {
        res.sendFile(__dirname + '/userProfile.html');
    } else {
        res.redirect('/login'); // Przekieruj do logowania, jeśli użytkownik nie jest zalogowany
    }
});

app.get('/dobradietka', (req, res) => {
    res.sendFile(__dirname + '/dobradietka.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/kalkulator.html');
});

// Uruchomienie serwera
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});

module.exports = app;
