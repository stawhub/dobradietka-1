// dietLogic.js
const nodemailer = require('nodemailer');
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

module.exports = function(connection, s3Client) {
    async function calculateDietAndSendEmail(userData) {
        const { age, gender, weight, height, activityLevel, goal, email } = userData;

        // Wylicz zapotrzebowanie kaloryczne
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
            caloricNeed -= 500;
        } else if (goal === "gain") {
            caloricNeed += 500;
        }

        // Przypisz odpowiednią dietę
        let assignedDiet;
        // ... (logika przypisania diety na podstawie caloricNeed)

        // Pobierz link do diety z AWS S3
        const dietKey = `diets/${assignedDiet}.pdf`;
        const dietUrl = await getPresignedUrl('your-bucket-name', dietKey);

        // Wyślij e-mail z dietą
        await sendDietEmail(email, dietUrl);

        // Zaktualizuj informacje o użytkowniku w bazie danych
        connection.query('UPDATE users SET hasPurchasedDiet = TRUE WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('Błąd aktualizacji użytkownika:', err);
            }
        });

        return dietUrl; // Można zwrócić URL do wykorzystania na stronie użytkownika
    }

    async function getPresignedUrl(bucketName, objectKey) {
        const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
        const expires = 60 * 5; // Link ważny przez 5 minut

        try {
            const url = await getSignedUrl(s3Client, command, { expiresIn: expires });
            return url;
        } catch (err) {
            console.error("Error creating presigned URL", err);
            throw err;
        }
    }

    async function sendDietEmail(email, dietUrl) {
        const transporter = nodemailer.createTransport({
            host: 'your-smtp-host',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: 'kontakt@example.com',
            to: email,
            subject: 'Twoja dieta',
            text: 'Oto Twoja dieta!',
            attachments: [
                { path: dietUrl }
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

    return {
        calculateDietAndSendEmail
    };
};
