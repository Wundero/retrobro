import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const roomRouter = createTRPCRouter({
  createRoom: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        categories: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, categories } = input;
      const user = ctx.session.user;
      const room = await ctx.prisma.room.create({
        data: {
          name,
          categories: {
            createMany: {
              data: categories?.map((name) => ({ name })) ?? [],
            },
          },
          owner: {
            connect: {
              id: user.id,
            },
          },
          members: {
            connect: {
              id: user.id,
            },
          },
        },
        include: {
          categories: true,
          owner: true,
          members: true,
          cards: true,
          polls: true,
        },
      });
      return room;
    }),
  updateRoom: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        mutable: z.boolean().optional(),
        anonymous: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.room.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }
      if (room.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not the owner of this room",
        });
      }
      const updatedRoom = await ctx.prisma.room.update({
        where: {
          id: input.id,
        },
        data: {
          mutable: input.mutable,
          anonymous: input.anonymous,
        },
        include: {
          categories: true,
          owner: true,
          members: true,
          cards: true,
          polls: true,
        },
      });
      return updatedRoom;
    }),
  deleteRoom: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.room.findUnique({
        where: {
          id: input,
        },
      });
      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }
      if (room.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not the owner of this room",
        });
      }
      const deletedRoom = await ctx.prisma.room.delete({
        where: {
          id: input,
        },
      });
      return deletedRoom;
    }),
  joinRoom: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.room.findUnique({
        where: {
          id: input,
        },
        include: {
          members: {
            select: {
              id: true,
            },
          },
        },
      });
      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }
      if (room.members.some((member) => member.id === ctx.session.user.id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already joined this room",
        });
      }
      const user = ctx.session.user;
      const updatedRoom = await ctx.prisma.room.update({
        where: {
          id: input,
        },
        data: {
          members: {
            connect: {
              id: user.id,
            },
          },
        },
        include: {
          categories: true,
          owner: true,
          members: true,
          cards: true,
          polls: true,
        },
      });
      return updatedRoom;
    }),
  leaveRoom: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.room.findUnique({
        where: {
          id: input,
        },
        include: {
          members: {
            select: {
              id: true,
            },
          },
        },
      });
      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }
      if (!room.members.some((member) => member.id === ctx.session.user.id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have not joined this room",
        });
      }
      const user = ctx.session.user;
      const updatedRoom = await ctx.prisma.room.update({
        where: {
          id: input,
        },
        data: {
          members: {
            disconnect: {
              id: user.id,
            },
          },
        },
        include: {
          categories: true,
          owner: true,
          members: true,
          cards: true,
          polls: true,
        },
      });
      return updatedRoom;
    }),
  getRoom: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const room = await ctx.prisma.room.findUnique({
      where: {
        id: input,
      },
      include: {
        categories: true,
        owner: true,
        members: true,
        cards: true,
        polls: true,
      },
    });
    if (!room) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Room not found",
      });
    }
    return room;
  }),
  createCategory: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        name: z.string(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.room.findUnique({
        where: {
          id: input.roomId,
        },
      });
      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }
      if (room.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not the owner of this room",
        });
      }
      const category = await ctx.prisma.category.create({
        data: {
          name: input.name,
          color: input.color,
          room: {
            connect: {
              id: input.roomId,
            },
          },
        },
      });
      return category;
    }),
  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findUnique({
        where: {
          id: input.id,
        },
        include: {
          room: true,
        },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      if (category.room.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not the owner of this room",
        });
      }
      const updatedCategory = await ctx.prisma.category.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          color: input.color,
        },
      });
      return updatedCategory;
    }),
  deleteCategory: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findUnique({
        where: {
          id: input,
        },
        include: {
          room: true,
        },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      if (category.room.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not the owner of this room",
        });
      }
      const deletedCategory = await ctx.prisma.category.delete({
        where: {
          id: input,
        },
      });
      return deletedCategory;
    }),
  createCard: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        categoryId: z.string(),
        text: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.room.findUnique({
        where: {
          id: input.roomId,
        },
        include: {
          members: true,
        },
      });
      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }
      if (!room.members.some((member) => member.id === ctx.session.user.id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have not joined this room",
        });
      }
      const card = await ctx.prisma.card.create({
        data: {
          text: input.text,
          creator: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          category: {
            connect: {
              id: input.categoryId,
            },
          },
          room: {
            connect: {
              id: input.roomId,
            },
          },
        },
      });
      return card;
    }),
  updateCard: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        text: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const card = await ctx.prisma.card.findUnique({
        where: {
          id: input.id,
        },
        include: {
          room: true,
        },
      });
      if (!card) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Card not found",
        });
      }
      if (
        card.room.ownerId !== ctx.session.user.id &&
        card.creatorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot edit this card",
        });
      }
      const updatedCard = await ctx.prisma.card.update({
        where: {
          id: input.id,
        },
        data: {
          text: input.text,
        },
      });
      return updatedCard;
    }),
  deleteCard: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const card = await ctx.prisma.card.findUnique({
        where: {
          id: input,
        },
        include: {
          room: true,
        },
      });
      if (!card) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Card not found",
        });
      }
      if (
        card.room.ownerId !== ctx.session.user.id &&
        card.creatorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot delete this card",
        });
      }
      const deletedCard = await ctx.prisma.card.delete({
        where: {
          id: input,
        },
      });
      return deletedCard;
    }),
});
