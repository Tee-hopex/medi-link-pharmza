import { prisma } from '../../lib/prisma'

export async function getChannels(userId: string) {
  return prisma.channel.findMany({
    where: {
      OR: [{ isPrivate: false }, { members: { some: { userId } } }],
    },
    include: {
      _count: { select: { members: true, messages: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: { firstName: true } } } },
      members: { where: { userId }, select: { id: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function joinChannel(userId: string, channelId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) throw new Error('Channel not found')
  return prisma.channelMember.upsert({
    where: { channelId_userId: { channelId, userId } },
    create: { channelId, userId },
    update: {},
  })
}

export async function getMessages(userId: string, channelId: string, cursor?: string, limit = 50) {
  const member = await prisma.channelMember.findUnique({ where: { channelId_userId: { channelId, userId } } })
  if (!member) throw new Error('Not a member of this channel')

  return prisma.message.findMany({
    where: { channelId, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function sendMessage(userId: string, channelId: string, content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') {
  const member = await prisma.channelMember.findUnique({ where: { channelId_userId: { channelId, userId } } })
  if (!member) throw new Error('Not a member of this channel')

  return prisma.message.create({
    data: { channelId, senderId: userId, content, type },
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  })
}
