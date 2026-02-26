import { prisma } from '@/lib/db';
import MessagesList from '@/components/admin/MessagesList';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  let messages = [];
  let dbError = false;

  try {
     // Utilisation de cast 'any' car le client Prisma peut ne pas être à jour
     messages = await (prisma as any).contactMessage.findMany({
       orderBy: { createdAt: 'desc' },
       take: 50
     });
  } catch (e) {
     console.error("DB Error (Admin Messages)", e);
     dbError = true;
  }

  // Convert Date objects to strings if needed, but the client component can handle Dates if passed from Server Component in Next.js (it serializes them).
  // However, to be safe, we can serialise. But Next.js handles Date objects in props from Server Components seamlessly usually.
  // Wait, no. Next.js passes props from Server to Client component as JSON. Date objects are NOT supported in JSON.
  // We MUST serialize dates.
  
  const serializedMessages = messages.map((msg: any) => ({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
  }));

  return <MessagesList initialMessages={serializedMessages} dbError={dbError} />;
}

