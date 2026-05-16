export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string
          company_name: string
          subdomain: string
          active_modules: Json
          website_settings: Json
          ai_credits: number
          created_at: string
        }
        Insert: {
          id?: string
          company_name: string
          subdomain: string
          active_modules?: Json
          website_settings?: Json
          ai_credits?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          subdomain?: string
          active_modules?: Json
          website_settings?: Json
          ai_credits?: number
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          agency_id: string
          full_name: string
          role: 'superadmin' | 'employee'
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          agency_id: string
          full_name: string
          role?: 'superadmin' | 'employee'
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          full_name?: string
          role?: 'superadmin' | 'employee'
          phone?: string | null
          created_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          agency_id: string
          title: string
          description: string | null
          price: number
          destination: string
          duration_days: number
          image_urls: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          title: string
          description?: string | null
          price: number
          destination: string
          duration_days: number
          image_urls?: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          title?: string
          description?: string | null
          price?: number
          destination?: string
          duration_days?: number
          image_urls?: Json
          is_active?: boolean
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          agency_id: string
          customer_phone: string
          customer_name: string | null
          platform: 'whatsapp' | 'facebook' | 'instagram'
          lead_score: 'HOT' | 'WARM' | 'COLD' | null
          lead_summary: string | null
          ai_status: boolean
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          customer_phone: string
          customer_name?: string | null
          platform: 'whatsapp' | 'facebook' | 'instagram'
          lead_score?: 'HOT' | 'WARM' | 'COLD' | null
          lead_summary?: string | null
          ai_status?: boolean
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          customer_phone?: string
          customer_name?: string | null
          platform?: 'whatsapp' | 'facebook' | 'instagram'
          lead_score?: 'HOT' | 'WARM' | 'COLD' | null
          lead_summary?: string | null
          ai_status?: boolean
          last_message_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_type: 'ai' | 'human' | 'customer'
          content: string | null
          media_url: string | null
          is_voice_note: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_type: 'ai' | 'human' | 'customer'
          content?: string | null
          media_url?: string | null
          is_voice_note?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_type?: 'ai' | 'human' | 'customer'
          content?: string | null
          media_url?: string | null
          is_voice_note?: boolean
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          agency_id: string
          conversation_id: string | null
          trip_id: string
          client_manifest: Json
          status: 'pending_payment' | 'completed' | 'cancelled'
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          conversation_id?: string | null
          trip_id: string
          client_manifest?: Json
          status?: 'pending_payment' | 'completed' | 'cancelled'
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          conversation_id?: string | null
          trip_id?: string
          client_manifest?: Json
          status?: 'pending_payment' | 'completed' | 'cancelled'
          total_price?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
