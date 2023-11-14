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
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));
// Importowanie i użycie routera auth.js
const authRoutes = require('./routes/auth')(connection);
app.use('/auth', authRoutes);


// Importowanie logiki diety
const { calculateDietAndSendEmail } = dietLogic(connection, s3Client);

// Rejestracja
app.post('/register', async (req, res) => {
    // Logika rejestracji
});

// Logowanie
app.post('/login', async (req, res) => {
    // Logika logowania
});

// Płatność
app.post('/charge', async (req, res) => {
    // Logika płatności
});

// Obsługa sesji płatności
app.post('/create-checkout-session', async (req, res) => {
    // Logika sesji płatności
});

// Obsługa żądania diety
app.post('/getDiet', async (req, res) => {
    // Logika obsługi żądania diety
});

// Strony i inne ścieżki
app.get('/userProfile', (req, res) => {
    res.sendFile(__dirname + '/userProfile.html');
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
