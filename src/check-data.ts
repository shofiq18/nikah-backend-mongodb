import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const res: any = await (prisma as any).$runCommandRaw({
            find: "User",
            filter: { photos: { $exists: true, $ne: [] } }
        });
        console.log('Found users with photos:', res.cursor.firstBatch.length);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
