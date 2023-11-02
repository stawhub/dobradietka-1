


require('dotenv').config({path:'./.env'});
const bcrypt = require('bcryptjs');
const Stripe = require('stripe');
const stripe = Stripe(process.env.SECRET_KEY);
const session = require('express-session');
const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const mysql = require('mysql');


// Zmiana tutaj: Używamy zmiennej środowiskowej JAWSDB_URL do połączenia
const connection = mysql.createConnection(process.env.JAWSDB_URL);

connection.connect(err => {
  if (err) {
    console.error('Błąd połączenia z bazą danych JawsDB:', err.stack);
    return;
  }
  console.log('Połączono z bazą danych JawsDB.');
});

  connection.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    birthdate DATE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15)
  )
`, (err, results) => {
  if (err) throw err;
  console.log("Tabela użytkowników została utworzona lub już istnieje.");

  // Sprawdź, czy kolumna hasPurchasedDiet istnieje
  connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'hasPurchasedDiet'
  `, (err, results) => {
      if (err) throw err;

      // Jeśli kolumna nie istnieje, dodaj ją
      if (results.length === 0) {
          connection.query(`
              ALTER TABLE users ADD hasPurchasedDiet BOOLEAN DEFAULT FALSE
          `, (err, results) => {
              if (err) throw err;
              console.log("Kolumna 'hasPurchasedDiet' została dodana do tabeli 'users'.");
          });
      }
  });
});

app.use(express.static(__dirname));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.post('/charge', async (req, res) => {
    const token = req.body.stripeToken;
    const amount = 4500;

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
app.post('/register', (req, res) => {
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

app.post('/login', (req, res) => {
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
        res.redirect('/platnosc.html');
    });
});


app.post('/redirectToLogin', (req, res) => {
    // Tutaj możemy przetworzyć dane z formularza, jeśli to konieczne
    // Następnie przekierowujemy użytkownika na stronę logowania
    res.redirect('/login.html');
});
app.post('/getDiet', (req, res) => {
    const { email } = req.body;
    req.session.email = email;
    req.session.dietData = req.body;
    res.redirect('/login.html');
});

app.get('/login', (req, res) => {
    const email = req.session.email || '';
    res.redirect(`/login.html?email=${encodeURIComponent(email)}`);
});

app.post('/login', (req, res) => {
    res.redirect('/payment');
});

app.get('/payment', (req, res) => {
    res.send('Strona płatności');
});

app.post('/payment', async (req, res) => {
    sendDietToEmail(req.session.dietData, req.session.dietData.email);
    res.redirect('/userProfile');
});

app.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'blik'], // dodaj potrzebne metody płatności
            line_items: [{
                price_data: {
                    currency: 'pln',
                    product_data: {
                        name: 'Twoja usługa/dieta',
                    },
                    unit_amount: 4500, // cena w groszach, np. 45.00 PLN
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: 'https://dobradietka-38e3caf0141a.herokuapp.com/userProfile',
            cancel_url: 'https://your-website.com/cancel',
        });
        res.json({ id: session.id });
    } catch (error) {
        console.error("Błąd podczas tworzenia sesji płatności:", error);
        res.status(500).json({ error: 'Nie udało się utworzyć sesji płatności' });
    }
});
function sendDietToEmail(dietData, email) {
    const { age, gender, weight, height, activityLevel, goal } = dietData;

    let BMR;
    if (gender === "male") {
        BMR = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        BMR = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    let activityMultiplier;
    switch (activityLevel) {
        case 'low':
            activityMultiplier = 1.2;
            break;
        case 'medium':
            activityMultiplier = 1.375;
            break;
        case 'high':
            activityMultiplier = 1.55;
            break;
        default:
            activityMultiplier = 1.2;
    }

    let caloricNeed = Math.round(BMR * activityMultiplier);

    if (goal === "lose") {
        Math.round(caloricNeed -= 500);
    } else if (goal === "gain") {
        Math.round(caloricNeed += 500);
    }

    let assignedDiet;
    if (goal === "lose") {
        if (caloricNeed <= 1750) {
            assignedDiet = 1500;
        } else if (caloricNeed <= 2250) {
            assignedDiet = 2000;
        } else if (caloricNeed <= 2750) {
            assignedDiet = 2500;
        } else if (caloricNeed <= 3250) {
            assignedDiet = 3000;
        } else {
            assignedDiet = 3500;
        }
    } else if (goal === "gain") {
        if (caloricNeed <= 2250) {
            assignedDiet = 2500;
        } else if (caloricNeed <= 2750) {
            assignedDiet = 3000;
        } else {
            assignedDiet = 3500;
        }
    }

    const dietPath = `F:/Projekty/BotDDietka/diets/${assignedDiet}.pdf`;

    const transporter = nodemailer.createTransport({
        host: 'trenerstawicki.atthost24.pl',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: 'kontakt@trenerstawickionline.pl',
        to: email,
        subject: 'Twoja dieta',
        text: 'Oto Twoja dieta!',
        attachments: [
            {
                path: dietPath
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Dieta wysłana na e-mail!');
        }
    });
}

app.get('/userProfile', (req, res) => {
    res.send('Profil użytkownika');
});

app.get('/dobradietka', (req, res) => {
    res.sendFile(__dirname + '/dobradietka.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/kalkulator.html');
});
