import { connectToDatabase } from "./config/database.js";
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import xss from 'xss-clean';  // ✅ Changed from require
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import userRouter from "./routes/user.js"
import orderRouter from "./routes/order.js"
import customerRouter from "./routes/customer.js"
import { createClient } from 'redis';
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware BEFORE routes
app.use(cors());
app.use(express.json());
app.use(xss());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use(limiter);

app.use('/user',userRouter)
app.use('/order',orderRouter)
app.use('/customer',customerRouter)



export const redisClient = createClient({ url: 'redis://localhost:6379' });

redisClient.connect()
    .then(() => console.log('✅ Connected to Redis'))
    .catch(err => console.error('❌ Redis connection error:', err));

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