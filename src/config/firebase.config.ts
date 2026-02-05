import { registerAs } from '@nestjs/config';
import * as serviceAccount from './serviceAccount.json';
export default registerAs('firebase', () => ({
  serviceAccount,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
}));
