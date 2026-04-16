import 'module-alias/register';
import app from './src/app';
import config from './src/config';
import connectDB from './src/config/db';
import monitoringService from './src/services/monitoringService';
import { autoRegisterAllWebhooks } from './src/services/webhookStartupService';

// Connect Database before starting server
connectDB().then(async () => {
    // Tự động đăng ký webhooks Shopify sau khi DB sẵn sàng
    await autoRegisterAllWebhooks();
});

app.listen(config.PORT, () => {
    console.log(`✅ Node.js Backend (TypeScript) running on port ${config.PORT}`);
    monitoringService.start();
});

