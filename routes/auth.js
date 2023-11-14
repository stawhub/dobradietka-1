// auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

module.exports = function(connection) {
    // Rejestracja użytkownika
    router.post('/register', (req, res) => {
        const { firstName, lastName, birthdate, email, password, phone } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 8);

        connection.query('INSERT INTO users (first_name, last_name, birthdate, email, password, phone) VALUES (?, ?, ?, ?, ?, ?)', 
        [firstName, lastName, birthdate, email, hashedPassword, phone], (err, results) => {
            if (err) {
                return res.status(400).send('Błąd podczas rejestracji: ' + err.message);
            }
            res.redirect('/login.html');
        });
    });

    // Logowanie użytkownika
    router.post('/auth/login', (req, res) => {
        const { email, password } = req.body;

        connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) {
                return res.status(500).send('Błąd serwera.');
            }

            const user = results[0];
            if (!user) {
                return res.status(400).send('Nieprawidłowy adres e-mail lub hasło.');
            }

            const passwordIsValid = bcrypt.compareSync(password, user.password);
            if (!passwordIsValid) {
                return res.status(400).send('Nieprawidłowy adres e-mail lub hasło.');
            }

            req.session.userId = user.id;
            // Sprawdź, czy użytkownik już zakupił dietę
            if (user.hasPurchasedDiet) {
                res.redirect('/userProfile');
            } else {
                res.redirect('/platnosc.html');
            }
        });
    });

    return router;
};

