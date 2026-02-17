import { useEffect } from "react";
import { supabase } from "@/shared/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface RealtimeConfig<T extends Record<string, unknown>> {
  table: string;
  filter?: string;
  event?: RealtimeEvent;
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export function useRealtimeSubscription<
  T extends Record<string, unknown> = Record<string, unknown>,
>(config: RealtimeConfig<T>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`${config.table}-changes`)
      .on(
        "postgres_changes",
        {
          event: config.event ?? "*",
          schema: "public",
          table: config.table,
          filter: config.filter,
        },
        config.onPayload as (
          payload: RealtimePostgresChangesPayload<Record<string, unknown>>
        ) => void
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.table, config.filter, config.event, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
