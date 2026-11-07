require('dotenv').config();
const db = require('./config/db');
const createApp = require('./app');
const app = createApp({ db, jwtSecret: process.env.JWT_SECRET });

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server berjalan di port ${port}`));
