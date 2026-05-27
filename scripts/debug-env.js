import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('PLAYWRIGHT_ADMIN_EMAIL:', process.env.PLAYWRIGHT_ADMIN_EMAIL);
console.log('PLAYWRIGHT_STAFF_EMAIL:', process.env.PLAYWRIGHT_STAFF_EMAIL);
// Do NOT print passwords
console.log('PLAYWRIGHT_ADMIN_PASSWORD length:', process.env.PLAYWRIGHT_ADMIN_PASSWORD?.length || 0);
console.log('PLAYWRIGHT_STAFF_PASSWORD length:', process.env.PLAYWRIGHT_STAFF_PASSWORD?.length || 0);
