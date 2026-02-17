import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UserOption {
  id: string;
  name: string;
}

interface NotificationComposerProps {
  users: UserOption[];
  onSend: (data: {
    title: string;
    body: string;
    channel: "email" | "whatsapp";
    recipientIds: string[];
  }) => void;
}

export function NotificationComposer({
  users,
  onSend,
}: NotificationComposerProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  function handleToggleUser(userId: string, checked: boolean) {
    setSelectedUserIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  }

  const isValid =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    selectedUserIds.length > 0;

  function handleSend() {
    if (isValid) {
      onSend({
        title,
        body,
        channel,
        recipientIds: selectedUserIds,
      });
      setTitle("");
      setBody("");
      setSelectedUserIds([]);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Enviar Notificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notification-title">Título</Label>
          <Input
            id="notification-title"
            placeholder="Título da notificação"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notification-body">Mensagem</Label>
          <Textarea
            id="notification-body"
            placeholder="Escreva a mensagem..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notification-channel">Canal</Label>
          <Select
            value={channel}
            onValueChange={(value) => setChannel(value as "email" | "whatsapp")}
          >
            <SelectTrigger id="notification-channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Destinatários</Label>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`recipient-${user.id}`}
                  checked={selectedUserIds.includes(user.id)}
                  onCheckedChange={(checked) =>
                    handleToggleUser(user.id, checked === true)
                  }
                />
                <Label
                  htmlFor={`recipient-${user.id}`}
                  className="cursor-pointer text-sm"
                >
                  {user.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSend} disabled={!isValid}>
          Enviar notificação
        </Button>
      </CardContent>
    </Card>
  );
}
