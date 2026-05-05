import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const res = await prisma.$runCommandRaw({
            find: "User",
            filter: { photos: { $exists: true, $ne: [] } }
        });
        console.log('Found users with photos:', res.cursor.firstBatch.length);
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=check-data.js.map