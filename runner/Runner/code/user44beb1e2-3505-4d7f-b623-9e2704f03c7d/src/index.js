const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/Database');
dotenv.config();
const app = express();
app.use(express.json());
connectDB();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));