const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const SQL_QUERY_USER_SELECTION = 'SELECT * FROM users WHERE email = ?'
const SQL_QUERY_USER_INSERTION = 'INSERT INTO users (first_name, last_name, birthdate, email, password, phone) VALUES (?, ?, ?, ?, ?, ?)'

module.exports = function(connection) {
    // Rejestracja użytkownika
    router.post('/register', (req, res) => {
        const { firstName, lastName, birthdate, email, password, phone } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 8);

        connection.query(SQL_QUERY_USER_INSERTION,
        [firstName, lastName, birthdate, email, hashedPassword, phone], (err, results) => {
            if (err) {
                console.error('Błąd podczas rejestracji:', err);
                return res.status(500).send('Błąd serwera.');
            }
            res.redirect('/login.html'); // Upewnij się, że ta strona istnieje
        });
    });

    // Logowanie użytkownika
    router.post('/login', (req, res) => {
        const { email, password } = req.body;
    
        connection.query(SQL_QUERY_USER_SELECTION, [email], (err, results) => {
            if (err) {
                console.error('Błąd podczas logowania:', err);
                return res.status(500).json({ error: 'Błąd serwera.' });
            }
    
            const user = results[0];
            if (!user) {
                return res.status(400).json({ error: 'Nieprawidłowy adres e-mail lub hasło.' });
            }
    
            const passwordIsValid = bcrypt.compareSync(password, user.password);
            if (!passwordIsValid) {
                return res.status(400).json({ error: 'Nieprawidłowy adres e-mail lub hasło.' });
            }
    
            req.session.userId = user.id;
            req.session.userData = user
            console.log('Stan sesji po zalogowaniu:', req.session);
            res.json({ success: true, redirectUrl: user.hasPurchasedDiet ? '/userProfile' : '/platnosc.html' });
        });
    });

    return router;
};
