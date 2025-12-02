import { connectToDatabase } from "./config/database.js";
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import xss from 'xss-clean';  // ✅ Changed from require
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ✅ Changed all requires to imports
//import user from "./routes/user.js";
//import product from "./routes/product.js";
//import payment from "./routes/payment.js";
//import health from "./routes/health.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware BEFORE routes
app.use(cors());
app.use(express.json());
app.use(xss());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use(limiter);

// ✅ Routes (removed duplicates)
//app.use('/user', user);
//app.use('/product', product);
//app.use('/payment', payment);
//app.use('/health', health);

// ✅ Initialize MongoDB and start server
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to connect to the database', error);
    process.exit(1);
  });