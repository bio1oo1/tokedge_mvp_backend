import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private firebaseApp: admin.app.App;
  private pgPool: Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Initialize Firebase Admin
    const firebaseConfig = this.configService.get('firebase');
    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig.serviceAccount as admin.ServiceAccount),
        databaseURL: firebaseConfig.databaseURL,
      });
    } else {
      this.firebaseApp = admin.app();
    }

    // Initialize PostgreSQL Pool
    const dbConfig = this.configService.get('database');
    this.pgPool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
    });
  }

  getFirebaseApp(): admin.app.App {
    return this.firebaseApp;
  }

  getPgPool(): Pool {
    return this.pgPool;
  }

  async onModuleDestroy() {
    await this.pgPool?.end();
  }
}
