import { cn } from "@/shared/lib/cn";

type MessageSender = "customer" | "restaurant" | "system";

interface ThreadMessage {
  sender: MessageSender;
  content: string;
  sentAt: string;
}

interface TicketThreadProps {
  messages: ThreadMessage[];
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const senderLabels: Record<MessageSender, string> = {
  customer: "Cliente",
  restaurant: "Restaurante",
  system: "Sistema",
};

export function TicketThread({ messages }: TicketThreadProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isRestaurant = message.sender === "restaurant";
        const isSystem = message.sender === "system";

        return (
          <div
            key={index}
            className={cn(
              "flex",
              isRestaurant ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-lg p-3",
                isRestaurant
                  ? "bg-primary text-primary-foreground"
                  : isSystem
                    ? "bg-muted italic text-muted-foreground"
                    : "bg-muted"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-4">
                <span
                  className={cn(
                    "text-xs font-medium",
                    isRestaurant
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {senderLabels[message.sender]}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    isRestaurant
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  )}
                >
                  {formatTime(message.sentAt)}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
