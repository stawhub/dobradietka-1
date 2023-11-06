// Konfiguracja środowiska i importy
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const mysql = require('mysql');

// Inicjalizacja aplikacji Express
const app = express();
const PORT = process.env.PORT || 3000;

// Konfiguracja sesji
const sessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Ustaw na true jeśli używasz HTTPS
};
app.use(session(sessionOptions));

// Konfiguracja połączenia z bazą danych
const dbOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};
const connection = mysql.createConnection(dbOptions);
connection.connect();

// Konfiguracja klienta S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Middleware do obsługi danych formularza i plików statycznych
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Serwowanie plików statycznych z folderu 'public'

// Routy
const authRouter = require('./routes/auth')(connection, bcrypt);
const dietRouter = require('./routes/diet')(connection, s3Client, getSignedUrl, nodemailer);


app.use('/auth', authRouter);
app.use('/diet', dietRouter);

// Start serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
