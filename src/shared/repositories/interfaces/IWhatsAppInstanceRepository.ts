import type { WhatsAppInstance } from "@/entities/whatsapp-instance";

export interface ConnectResult {
  qrcode?: string;
  paircode?: string;
  status: string;
}

export interface StatusResult {
  instance: WhatsAppInstance;
  qrcode?: string;
  paircode?: string;
  connected: boolean;
}

export interface IWhatsAppInstanceRepository {
  getAll(): Promise<WhatsAppInstance[]>;
  create(name: string): Promise<WhatsAppInstance>;
  connect(instanceId: string, phone?: string): Promise<ConnectResult>;
  getStatus(instanceId: string): Promise<StatusResult>;
  disconnect(instanceId: string): Promise<void>;
  remove(instanceId: string): Promise<void>;
}
