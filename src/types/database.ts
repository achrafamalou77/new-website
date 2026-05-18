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
      clients: {
        Row: {
          id: string
          agency_id: string | null
          full_name: string
          phone: string | null
          email: string | null
          id_card_number: string | null
          passport_number: string | null
          date_of_birth: string | null
          address: string | null
          city: string | null
          source: 'whatsapp' | 'facebook' | 'instagram' | 'walk_in' | 'referral' | 'phone' | null
          referred_by_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agency_id?: string | null
          full_name: string
          phone?: string | null
          email?: string | null
          id_card_number?: string | null
          passport_number?: string | null
          date_of_birth?: string | null
          address?: string | null
          city?: string | null
          source?: 'whatsapp' | 'facebook' | 'instagram' | 'walk_in' | 'referral' | 'phone' | null
          referred_by_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string | null
          full_name?: string
          phone?: string | null
          email?: string | null
          id_card_number?: string | null
          passport_number?: string | null
          date_of_birth?: string | null
          address?: string | null
          city?: string | null
          source?: 'whatsapp' | 'facebook' | 'instagram' | 'walk_in' | 'referral' | 'phone' | null
          referred_by_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          agency_id: string | null
          client_id: string | null
          invoice_number: string
          trip_id: string | null
          issue_date: string
          due_date: string
          status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
          items: Json
          subtotal: number
          discount_amount: number
          discount_percent: number
          tax_amount: number
          tax_percent: number
          total_amount: number
          amount_paid: number
          balance_due: number
          payment_method: 'CCP' | 'Edahabia' | 'Cash' | 'Bank Transfer' | 'Check' | null
          payment_status: 'unpaid' | 'partial' | 'paid'
          notes: string | null
          terms: string | null
          pdf_url: string | null
          sent_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agency_id?: string | null
          client_id?: string | null
          invoice_number: string
          trip_id?: string | null
          issue_date: string
          due_date: string
          status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
          items?: Json
          subtotal?: number
          discount_amount?: number
          discount_percent?: number
          tax_amount?: number
          tax_percent?: number
          total_amount?: number
          amount_paid?: number
          balance_due?: number
          payment_method?: 'CCP' | 'Edahabia' | 'Cash' | 'Bank Transfer' | 'Check' | null
          payment_status?: 'unpaid' | 'partial' | 'paid'
          notes?: string | null
          terms?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string | null
          client_id?: string | null
          invoice_number?: string
          trip_id?: string | null
          issue_date?: string
          due_date?: string
          status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
          items?: Json
          subtotal?: number
          discount_amount?: number
          discount_percent?: number
          tax_amount?: number
          tax_percent?: number
          total_amount?: number
          amount_paid?: number
          balance_due?: number
          payment_method?: 'CCP' | 'Edahabia' | 'Cash' | 'Bank Transfer' | 'Check' | null
          payment_status?: 'unpaid' | 'partial' | 'paid'
          notes?: string | null
          terms?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_payments: {
        Row: {
          id: string
          invoice_id: string
          amount: number
          payment_method: string
          payment_date: string
          reference_number: string | null
          notes: string | null
          received_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          amount: number
          payment_method: string
          payment_date: string
          reference_number?: string | null
          notes?: string | null
          received_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          amount?: number
          payment_method?: string
          payment_date?: string
          reference_number?: string | null
          notes?: string | null
          received_by?: string | null
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
      get_next_invoice_number: {
        Args: {
          p_agency_id: string
          p_issue_date: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
