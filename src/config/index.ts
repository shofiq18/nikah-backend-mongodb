import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

console.log('--- Config Loaded ---');
console.log('JWT Expires In:', process.env.JWT_EXPIRES_IN);

export default {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    jwt_secret: process.env.JWT_SECRET,
    jwt_expires_in: process.env.JWT_EXPIRES_IN,
    email_host: process.env.EMAIL_HOST,
    email_port: process.env.EMAIL_PORT,
    email_user: process.env.EMAIL_USER,
    email_pass: process.env.EMAIL_PASS,
    cloudinary_name: process.env.CLOUDINARY_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
}