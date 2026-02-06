import { registerAs } from '@nestjs/config';

export default registerAs('dataConnect', () => ({
  serviceId: process.env.DATA_CONNECT_SERVICE_ID || 'tokedge-access',
  location: process.env.DATA_CONNECT_LOCATION || 'us-central1',
  connector: process.env.DATA_CONNECT_CONNECTOR || 'default',
}));
