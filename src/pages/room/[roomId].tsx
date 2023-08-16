import type {
  InferGetServerSidePropsType,
  GetServerSideProps,
  GetServerSidePropsContext,
} from "next";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import { createTRPCContext } from "~/server/api/trpc";
import { api } from "~/utils/api";

export const getServerSideProps = async (
  context: GetServerSidePropsContext<{ roomId: string }>
) => {
  const id = context.params?.roomId;
  if (!id) {
    return {
      redirect: {
        destination: "/",
        permanent: true,
      },
    };
  }

  const room = await prisma.room.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });
  if (!room) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const helpers = createServerSideHelpers({
    router: appRouter,
    // @ts-expect-error the interface is not correct
    ctx: await createTRPCContext(context),
    transformer: superjson,
  });

  await helpers.room.getRoom.prefetch(id);

  return {
    props: {
      trpcState: helpers.dehydrate(),
      id,
    },
  };
};

export default function Page(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const { id } = props;
  const roomQuery = api.room.getRoom.useQuery(id);

  if (roomQuery.status === "loading") {
    return <>Loading...</>;
  }

  return <></>;
}
