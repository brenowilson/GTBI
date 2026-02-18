import { useMemo, useState } from "react";
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

type AudienceFilter = "system_users" | "clients" | "all";

interface NotificationComposerProps {
  users: UserOption[];
  clients: UserOption[];
  onSend: (data: {
    title: string;
    body: string;
    channels: ("email" | "whatsapp")[];
    recipientIds: string[];
  }) => void;
}

export function NotificationComposer({
  users,
  clients,
  onSend,
}: NotificationComposerProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [emailChannel, setEmailChannel] = useState(true);
  const [whatsappChannel, setWhatsappChannel] = useState(false);
  const [audienceFilter, setAudienceFilter] =
    useState<AudienceFilter>("system_users");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const visibleRecipients = useMemo(() => {
    switch (audienceFilter) {
      case "system_users":
        return users;
      case "clients":
        return clients;
      case "all":
        return [...users, ...clients];
    }
  }, [audienceFilter, users, clients]);

  const allVisibleSelected =
    visibleRecipients.length > 0 &&
    visibleRecipients.every((r) => selectedUserIds.includes(r.id));

  function handleAudienceChange(value: AudienceFilter) {
    setAudienceFilter(value);
    setSelectedUserIds([]);
  }

  function handleToggleUser(userId: string, checked: boolean) {
    setSelectedUserIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  }

  function handleToggleAll(checked: boolean) {
    if (checked) {
      setSelectedUserIds(visibleRecipients.map((r) => r.id));
    } else {
      setSelectedUserIds([]);
    }
  }

  const selectedChannels: ("email" | "whatsapp")[] = [
    ...(emailChannel ? (["email"] as const) : []),
    ...(whatsappChannel ? (["whatsapp"] as const) : []),
  ];

  const isValid =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    selectedChannels.length > 0 &&
    selectedUserIds.length > 0;

  function handleSend() {
    if (isValid) {
      onSend({
        title,
        body,
        channels: selectedChannels,
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
          <Label>Canais</Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="channel-email"
                checked={emailChannel}
                onCheckedChange={(checked) => setEmailChannel(checked === true)}
              />
              <Label htmlFor="channel-email" className="cursor-pointer text-sm">
                Email
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="channel-whatsapp"
                checked={whatsappChannel}
                onCheckedChange={(checked) =>
                  setWhatsappChannel(checked === true)
                }
              />
              <Label
                htmlFor="channel-whatsapp"
                className="cursor-pointer text-sm"
              >
                WhatsApp
              </Label>
            </div>
          </div>
          {selectedChannels.length === 0 && (
            <p className="text-sm text-destructive">
              Selecione ao menos um canal.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Destinatários</Label>
          <Select
            value={audienceFilter}
            onValueChange={(value) =>
              handleAudienceChange(value as AudienceFilter)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system_users">
                Usuários do Sistema
              </SelectItem>
              <SelectItem value="clients">
                Clientes (Restaurantes)
              </SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>

          <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
            {visibleRecipients.length > 0 && (
              <div className="flex items-center space-x-2 border-b pb-2">
                <Checkbox
                  id="select-all"
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) =>
                    handleToggleAll(checked === true)
                  }
                />
                <Label
                  htmlFor="select-all"
                  className="cursor-pointer text-sm font-medium"
                >
                  Selecionar todos
                </Label>
              </div>
            )}
            {visibleRecipients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum destinatário disponível.
              </p>
            )}
            {visibleRecipients.map((recipient) => (
              <div
                key={recipient.id}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={`recipient-${recipient.id}`}
                  checked={selectedUserIds.includes(recipient.id)}
                  onCheckedChange={(checked) =>
                    handleToggleUser(recipient.id, checked === true)
                  }
                />
                <Label
                  htmlFor={`recipient-${recipient.id}`}
                  className="cursor-pointer text-sm"
                >
                  {recipient.name}
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
