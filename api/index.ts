import app from '../src/app.js';
import { seedSuperAdmin } from '../src/app/utils/seed.js';

// Seed admin (this runs once when the function instance is initialized)
// Note: In serverless, this might run multiple times across different instances,
// but the seed function handles existence checks.
seedSuperAdmin();

export default app;
