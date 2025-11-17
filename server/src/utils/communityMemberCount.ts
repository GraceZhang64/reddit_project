import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Update community member count when a user first interacts with a community
 * (posts or comments). Only increments if this is the user's first interaction.
 */
export async function updateCommunityMemberCount(
  communityId: number,
  userId: string
): Promise<void> {
  try {
    // Check if user has ever posted or commented in this community before
    const [hasPosted, hasCommented] = await Promise.all([
      prisma.post.findFirst({
        where: {
          communityId,
          authorId: userId,
        },
        select: { id: true },
      }),
      prisma.comment.findFirst({
        where: {
          post: { communityId },
          authorId: userId,
        },
        select: { id: true },
      }),
    ]);

    // If this is the user's first interaction, increment member count
    if (!hasPosted && !hasCommented) {
      // Use raw SQL since migration may not be applied yet
      await prisma.$executeRaw`
        UPDATE communities 
        SET member_count = COALESCE(member_count, 0) + 1
        WHERE id = ${communityId}
      `;
    }
  } catch (error) {
    console.error('Error updating community member count:', error);
    // Don't throw - member count update shouldn't fail the main operation
  }
}

