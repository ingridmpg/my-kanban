"use client";

import { useEffect, useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { api } from "@/lib/api";

export default function Home() {
  // undefined while checking the session, null when signed out.
  const [username, setUsername] = useState<string | null>();

  useEffect(() => {
    api.me().then(
      (user) => setUsername(user.username),
      () => setUsername(null)
    );
  }, []);

  if (username === undefined) {
    return null;
  }
  if (username === null) {
    return <AuthForm onSignedIn={setUsername} />;
  }
  return <KanbanBoard username={username} onSignedOut={() => setUsername(null)} />;
}
