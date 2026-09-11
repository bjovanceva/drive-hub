import prisma from '../../utils/prisma'
import { requireOrdinaryUser } from '../../utils/authorization'
import { Prisma } from '~/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const currentUser = await requireOrdinaryUser(event)

  const body = await readBody<{
    type: 'PRIVATE' | 'GROUP'
    userIds: number[]
    name?: string
  }>(event)

  if (!body.type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conversation type is required'
    })
  }

  if (!Array.isArray(body.userIds)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'userIds must be an array'
    })
  }

  /*
   * Remove:
   * - duplicate IDs
   * - the current user's ID
   *
   * We add the current user ourselves later.
   */
  const otherUserIds = [
    ...new Set(
      body.userIds.filter(userId => userId !== currentUser.id)
    )
  ]

  /*
   * PRIVATE CHAT
   */
  if (body.type === 'PRIVATE') {
    if (otherUserIds.length !== 1) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'A private conversation must contain exactly one other user'
      })
    }

    const otherUserId = otherUserIds[0]

    if (otherUserId === undefined) {
      throw createError({
      statusCode: 400,
      statusMessage: 'A private conversation must contain exactly one other user'
  })
}

    const otherUser = await prisma.user.findUnique({
      where: {
        id: otherUserId
      },
      select: {
        id: true
      }
    })

    if (!otherUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    const privateKey = [
      currentUser.id,
      otherUserId
    ]
      .sort()
      .join(':')

    /*
     * If the private conversation already exists,
     * simply return it.
     */
    const existingConversation =
      await prisma.conversation.findUnique({
        where: {
          privateKey
        },

        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      })

    if (existingConversation) {
      return existingConversation
    }

    /*
     * Otherwise create it.
     */
    try {
      return await prisma.conversation.create({
        data: {
          type: 'PRIVATE',
          privateKey,

          participants: {
            create: [
              {
                userId: currentUser.id
              },
              {
                userId: otherUserId
              }
            ]
          }
        },

        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      })
    } catch (error) {
      /*
       * Two requests could arrive at exactly the same time.
       *
       * Because privateKey is @unique, only one can succeed.
       * If this request loses that race, fetch the conversation
       * that the other request created.
       */
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return prisma.conversation.findUnique({
          where: {
            privateKey
          },

          include: {
            participants: {
              include: {
                user: true
              }
            }
          }
        })
      }

      throw error
    }
  }

  /*
   * GROUP CHAT
   */
  if (body.type === 'GROUP') {
    if (!body.name?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Group name is required'
      })
    }

    if (otherUserIds.length < 1) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'A group conversation must contain at least one other user'
      })
    }

    /*
     * Check that every supplied user exists.
     */
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: otherUserIds
        }
      },

      select: {
        id: true
      }
    })

    if (users.length !== otherUserIds.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'One or more users were not found'
      })
    }

    const participantIds = [
      currentUser.id,
      ...otherUserIds
    ]

    return prisma.conversation.create({
      data: {
        type: 'GROUP',
        name: body.name.trim(),

        /*
         * privateKey intentionally stays null.
         *
         * This allows the same users to belong to multiple groups.
         */
        participants: {
          create: participantIds.map(userId => ({
            userId
          }))
        }
      },

      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    })
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Invalid conversation type'
  })
})