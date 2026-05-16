// src/types/platform.ts

export type Platform = 'whatsapp' | 'facebook' | 'instagram';

export interface PlatformInfo {
  platform: Platform;
  platform_display_name: string; // e.g. "WhatsApp", "Messenger", "Instagram"
}
