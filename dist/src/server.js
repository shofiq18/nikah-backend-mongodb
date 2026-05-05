import app from './app.js';
import config from './config/index.js';
import { seedSuperAdmin, cleanupData } from './app/utils/seed.js';
async function bootstrap() {
    await cleanupData();
    await seedSuperAdmin();
    let server;
    try {
        server = app.listen(config.port, () => {
            console.log(`🚀 Server is running on http://localhost:${config.port}`);
        });
        const exitHandler = () => {
            if (server) {
                server.close(() => {
                    console.log('Server closed gracefully.');
                    process.exit(1);
                });
            }
            else {
                process.exit(1);
            }
        };
        process.on('unhandledRejection', (error) => {
            console.log('Unhandled Rejection is detected, we are closing our server...');
            if (server) {
                server.close(() => {
                    console.log(error);
                    process.exit(1);
                });
            }
            else {
                process.exit(1);
            }
        });
    }
    catch (error) {
        console.error('Error during server startup:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map