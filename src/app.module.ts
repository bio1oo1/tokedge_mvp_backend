import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { WalletModule } from './wallet/wallet.module';
import { InviteModule } from './invite/invite.module';
import firebaseConfig from './config/firebase.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [firebaseConfig, databaseConfig],
    }),
    DatabaseModule,
    WalletModule,
    InviteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
