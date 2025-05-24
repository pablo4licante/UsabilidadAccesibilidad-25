import app from './app';
import { connectDB } from './utils/db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
}).catch((err) => {
  console.error('Error al conectar a MongoDB:', err);
});
