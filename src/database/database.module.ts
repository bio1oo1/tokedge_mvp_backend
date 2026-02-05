import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';
import firebaseConfig from '../config/firebase.config';
import databaseConfig from '../config/database.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(firebaseConfig), ConfigModule.forFeature(databaseConfig)],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
