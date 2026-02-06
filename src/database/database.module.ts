import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataConnectService } from './data-connect.service';
import firebaseConfig from '../config/firebase.config';
import dataConnectConfig from '../config/data-connect.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(firebaseConfig),
    ConfigModule.forFeature(dataConnectConfig),
  ],
  providers: [DataConnectService],
  exports: [DataConnectService],
})
export class DatabaseModule {}
