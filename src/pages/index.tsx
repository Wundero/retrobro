import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";

type ModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

function CreateRoomModal(props: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (props.open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [dialogRef, props.open]);

  useEffect(() => {
    const currentDialog = dialogRef.current;
    currentDialog?.addEventListener("close", () => {
      props.setOpen(false);
    });
    return () => {
      currentDialog?.removeEventListener("close", () => {
        props.setOpen(false);
      });
    };
  }, [dialogRef, props]);

  return (
    <dialog className="modal" ref={dialogRef}>
      <form method="dialog" className="modal-box">
        <h3 className="text-lg font-bold">Hello!</h3>
        <p className="py-4">Press ESC key or click outside to close</p>
      </form>
      <form method="dialog" className="modal-backdrop">
        <button
          onClick={() => {
            props.setOpen(false);
          }}
        >
          close
        </button>
      </form>
    </dialog>
  );
}

function JoinRoomModal(props: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const joinRoom = api.room.joinRoom.useMutation();

  useEffect(() => {
    if (props.open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [dialogRef, props.open]);

  useEffect(() => {
    const currentDialog = dialogRef.current;
    currentDialog?.addEventListener("close", () => {
      props.setOpen(false);
    });
    return () => {
      currentDialog?.removeEventListener("close", () => {
        props.setOpen(false);
      });
    };
  }, [dialogRef, props]);

  return (
    <dialog className="modal" ref={dialogRef}>
      <form
        method="dialog"
        className="modal-box"
        onSubmit={(e) => {
          e.preventDefault();
          // get input from form
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const code = e.currentTarget.code.value;
          // reset form
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          e.currentTarget.code.value = "";
          // join room
          joinRoom
            .mutateAsync(code as string)
            .then(() => {
              props.setOpen(false);
              return router.push(`/room/${code}`);
            })
            .catch((e) => {
              console.error(e);
            });
        }}
      >
        <h3 className="text-lg font-bold">Join a room</h3>
        <p className="py-4">Enter in a room code to join:</p>
        <input
          className="input input-bordered w-full"
          type="text"
          name="code"
        ></input>
      </form>
      <form method="dialog" className="modal-backdrop">
        <button
          onClick={() => {
            props.setOpen(false);
          }}
        >
          close
        </button>
      </form>
    </dialog>
  );
}

export default function Home() {
  const session = useSession();

  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [joinRoomModalOpen, setJoinRoomModalOpen] = useState(false);

  return (
    <>
      <Head>
        <title>retrobro</title>
        <meta name="description" content="sprint retros i guess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CreateRoomModal
        open={createRoomModalOpen}
        setOpen={setCreateRoomModalOpen}
      />
      <JoinRoomModal open={joinRoomModalOpen} setOpen={setJoinRoomModalOpen} />
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          {session.data?.user ? (
            <div className="flex flex-col gap-2">
              <button
                className="btn"
                onClick={() => {
                  setCreateRoomModalOpen(true);
                }}
              >
                Create a Room {createRoomModalOpen ? "true" : "false"}
              </button>
              <button
                className="btn"
                onClick={() => {
                  setJoinRoomModalOpen(true);
                }}
              >
                Join a Room {joinRoomModalOpen ? "true" : "false"}
              </button>
            </div>
          ) : (
            <button
              className="btn"
              onClick={() => {
                signIn("github").catch((e) => {
                  console.error(e);
                });
              }}
            >
              Sign in with GitHub
            </button>
          )}
        </div>
      </main>
    </>
  );
}
