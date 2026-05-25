export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          created_at: string | null
          details: Json | null
          id: string
          target_agency_id: string | null
        }
        Insert: {
          action: string
          admin_email: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_agency_id?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_agency_id?: string | null
        }
        Relationships: []
      }
      agencies: {
        Row: {
          address: string | null
          ai_credits: number | null
          business_hours: Json | null
          business_type_slug: string
          chatbot_config: Json | null
          chatbot_enabled: boolean
          city: string | null
          company_name: string
          cover_image_url: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan: string | null
          social_links: Json | null
          social_media: Json | null
          status: string
          subdomain: string
          theme_config: Json | null
          updated_at: string
          website_config: Json | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          ai_credits?: number | null
          business_hours?: Json | null
          business_type_slug: string
          chatbot_config?: Json | null
          chatbot_enabled?: boolean
          city?: string | null
          company_name: string
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: string | null
          social_links?: Json | null
          social_media?: Json | null
          status?: string
          subdomain: string
          theme_config?: Json | null
          updated_at?: string
          website_config?: Json | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          ai_credits?: number | null
          business_hours?: Json | null
          business_type_slug?: string
          chatbot_config?: Json | null
          chatbot_enabled?: boolean
          city?: string | null
          company_name?: string
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: string | null
          social_links?: Json | null
          social_media?: Json | null
          status?: string
          subdomain?: string
          theme_config?: Json | null
          updated_at?: string
          website_config?: Json | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          agency_id: string | null
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          read_by: Json | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          read_by?: Json | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          read_by?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          agency_id: string | null
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          agency_id: string | null
          client_manifest: Json | null
          conversation_id: string | null
          created_at: string | null
          id: string
          status: string | null
          total_price: number
          trip_id: string | null
        }
        Insert: {
          agency_id?: string | null
          client_manifest?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          total_price: number
          trip_id?: string | null
        }
        Update: {
          agency_id?: string | null
          client_manifest?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          total_price?: number
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      business_types: {
        Row: {
          color: string | null
          created_at: string | null
          default_template_id: string | null
          description: string | null
          features: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          name_fr: string | null
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          default_template_id?: string | null
          description?: string | null
          features?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          name_fr?: string | null
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          default_template_id?: string | null
          description?: string | null
          features?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          name_fr?: string | null
          slug?: string
        }
        Relationships: []
      }
      car_import_orders: {
        Row: {
          agency_id: string | null
          arrival_date: string | null
          arrival_port: string | null
          banque: number | null
          brand: string
          client_id: string | null
          created_at: string | null
          daccis: number | null
          departure_date: string | null
          departure_port: string | null
          droits_de_douane: number | null
          frais_de_dedouanement: number | null
          frais_divers: number | null
          gerbage: number | null
          id: string
          magasinage: number | null
          milestone_1_amount: number | null
          milestone_1_paid: boolean | null
          milestone_2_amount: number | null
          milestone_2_paid: boolean | null
          milestone_3_amount: number | null
          milestone_3_paid: boolean | null
          model: string
          notes: string | null
          purchase_cost: number | null
          redevance_statistique: number | null
          selling_price: number | null
          shipping_carrier: string | null
          shipping_documents: Json | null
          specs: Json | null
          status: string | null
          timeline: Json | null
          tracking_number: string | null
          transport_local: number | null
          tva: number | null
          updated_at: string | null
          visite: number | null
          year: number
        }
        Insert: {
          agency_id?: string | null
          arrival_date?: string | null
          arrival_port?: string | null
          banque?: number | null
          brand: string
          client_id?: string | null
          created_at?: string | null
          daccis?: number | null
          departure_date?: string | null
          departure_port?: string | null
          droits_de_douane?: number | null
          frais_de_dedouanement?: number | null
          frais_divers?: number | null
          gerbage?: number | null
          id?: string
          magasinage?: number | null
          milestone_1_amount?: number | null
          milestone_1_paid?: boolean | null
          milestone_2_amount?: number | null
          milestone_2_paid?: boolean | null
          milestone_3_amount?: number | null
          milestone_3_paid?: boolean | null
          model: string
          notes?: string | null
          purchase_cost?: number | null
          redevance_statistique?: number | null
          selling_price?: number | null
          shipping_carrier?: string | null
          shipping_documents?: Json | null
          specs?: Json | null
          status?: string | null
          timeline?: Json | null
          tracking_number?: string | null
          transport_local?: number | null
          tva?: number | null
          updated_at?: string | null
          visite?: number | null
          year: number
        }
        Update: {
          agency_id?: string | null
          arrival_date?: string | null
          arrival_port?: string | null
          banque?: number | null
          brand?: string
          client_id?: string | null
          created_at?: string | null
          daccis?: number | null
          departure_date?: string | null
          departure_port?: string | null
          droits_de_douane?: number | null
          frais_de_dedouanement?: number | null
          frais_divers?: number | null
          gerbage?: number | null
          id?: string
          magasinage?: number | null
          milestone_1_amount?: number | null
          milestone_1_paid?: boolean | null
          milestone_2_amount?: number | null
          milestone_2_paid?: boolean | null
          milestone_3_amount?: number | null
          milestone_3_paid?: boolean | null
          model?: string
          notes?: string | null
          purchase_cost?: number | null
          redevance_statistique?: number | null
          selling_price?: number | null
          shipping_carrier?: string | null
          shipping_documents?: Json | null
          specs?: Json | null
          status?: string | null
          timeline?: Json | null
          tracking_number?: string | null
          transport_local?: number | null
          tva?: number | null
          updated_at?: string | null
          visite?: number | null
          year?: number
        }
        Relationships: []
      }
      car_inventory: {
        Row: {
          agency_id: string | null
          brand: string
          condition: string | null
          created_at: string | null
          description: string | null
          down_payment_percent: number | null
          features: Json | null
          financing_available: boolean | null
          fuel_type: string | null
          id: string
          images: Json | null
          installment_months: number | null
          model: string
          monthly_installment: number | null
          price: number
          status: string | null
          stock_number: string | null
          transmission: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          agency_id?: string | null
          brand: string
          condition?: string | null
          created_at?: string | null
          description?: string | null
          down_payment_percent?: number | null
          features?: Json | null
          financing_available?: boolean | null
          fuel_type?: string | null
          id?: string
          images?: Json | null
          installment_months?: number | null
          model: string
          monthly_installment?: number | null
          price: number
          status?: string | null
          stock_number?: string | null
          transmission?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          agency_id?: string | null
          brand?: string
          condition?: string | null
          created_at?: string | null
          description?: string | null
          down_payment_percent?: number | null
          features?: Json | null
          financing_available?: boolean | null
          fuel_type?: string | null
          id?: string
          images?: Json | null
          installment_months?: number | null
          model?: string
          monthly_installment?: number | null
          price?: number
          status?: string | null
          stock_number?: string | null
          transmission?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      car_rental_bookings: {
        Row: {
          agency_id: string | null
          car_id: string | null
          client_id: string | null
          created_at: string | null
          end_date: string
          id: string
          invoice_id: string | null
          start_date: string
          status: string | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          car_id?: string | null
          client_id?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          invoice_id?: string | null
          start_date: string
          status?: string | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          car_id?: string | null
          client_id?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          invoice_id?: string | null
          start_date?: string
          status?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_rental_bookings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_rental_bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_sales_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_rental_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_rental_bookings_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      car_rental_fleet: {
        Row: {
          agency_id: string
          brand: string
          color: string | null
          created_at: string
          daily_rate: number
          id: string
          images: Json | null
          model: string
          monthly_rate: number | null
          specs: Json | null
          status: string
          weekly_rate: number | null
          year: number
        }
        Insert: {
          agency_id: string
          brand: string
          color?: string | null
          created_at?: string
          daily_rate: number
          id?: string
          images?: Json | null
          model: string
          monthly_rate?: number | null
          specs?: Json | null
          status?: string
          weekly_rate?: number | null
          year: number
        }
        Update: {
          agency_id?: string
          brand?: string
          color?: string | null
          created_at?: string
          daily_rate?: number
          id?: string
          images?: Json | null
          model?: string
          monthly_rate?: number | null
          specs?: Json | null
          status?: string
          weekly_rate?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_rental_fleet_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      car_sales_inventory: {
        Row: {
          agency_id: string
          brand: string
          car_type: string | null
          color: string | null
          commission_flat_fee: number | null
          commission_percentage: number | null
          consignment_agreement_details: Json | null
          container_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          margin: number | null
          model: string
          owner_client_id: string | null
          owner_target_payout: number | null
          owner_type: Database["public"]["Enums"]["car_owner_type_enum"]
          price: number
          quantity: number | null
          rental_daily_rate: number | null
          specs: Json | null
          status: string
          tracking_number: string | null
          type: string
          updated_at: string
          version: string | null
          year: number
        }
        Insert: {
          agency_id: string
          brand: string
          car_type?: string | null
          color?: string | null
          commission_flat_fee?: number | null
          commission_percentage?: number | null
          consignment_agreement_details?: Json | null
          container_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          margin?: number | null
          model: string
          owner_client_id?: string | null
          owner_target_payout?: number | null
          owner_type?: Database["public"]["Enums"]["car_owner_type_enum"]
          price: number
          quantity?: number | null
          rental_daily_rate?: number | null
          specs?: Json | null
          status?: string
          tracking_number?: string | null
          type?: string
          updated_at?: string
          version?: string | null
          year: number
        }
        Update: {
          agency_id?: string
          brand?: string
          car_type?: string | null
          color?: string | null
          commission_flat_fee?: number | null
          commission_percentage?: number | null
          consignment_agreement_details?: Json | null
          container_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          margin?: number | null
          model?: string
          owner_client_id?: string | null
          owner_target_payout?: number | null
          owner_type?: Database["public"]["Enums"]["car_owner_type_enum"]
          price?: number
          quantity?: number | null
          rental_daily_rate?: number | null
          specs?: Json | null
          status?: string
          tracking_number?: string | null
          type?: string
          updated_at?: string
          version?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_sales_inventory_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_sales_inventory_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_sales_inventory_owner_client_id_fkey"
            columns: ["owner_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      car_sales_orders: {
        Row: {
          agency_id: string | null
          car_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          invoice_id: string | null
          sale_date: string | null
          sale_price: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          car_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          sale_date?: string | null
          sale_price: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          car_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          sale_date?: string | null
          sale_price?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_sales_orders_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_sales_orders_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_sales_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_sales_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_sales_orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      car_showroom_config: {
        Row: {
          agency_id: string
          ai_personality: Json
          import_tracking_enabled: boolean
          parts_enabled: boolean
          rental_enabled: boolean
          sales_enabled: boolean
          service_enabled: boolean
          sur_commande_enabled: boolean
        }
        Insert: {
          agency_id: string
          ai_personality?: Json
          import_tracking_enabled?: boolean
          parts_enabled?: boolean
          rental_enabled?: boolean
          sales_enabled?: boolean
          service_enabled?: boolean
          sur_commande_enabled?: boolean
        }
        Update: {
          agency_id?: string
          ai_personality?: Json
          import_tracking_enabled?: boolean
          parts_enabled?: boolean
          rental_enabled?: boolean
          sales_enabled?: boolean
          service_enabled?: boolean
          sur_commande_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "car_showroom_config_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      car_showroom_templates: {
        Row: {
          created_at: string
          default_config: Json | null
          id: string
          is_active: boolean
          name: string
          preview_image_url: string | null
          slug: string
          vertical_type: string
        }
        Insert: {
          created_at?: string
          default_config?: Json | null
          id?: string
          is_active?: boolean
          name: string
          preview_image_url?: string | null
          slug: string
          vertical_type?: string
        }
        Update: {
          created_at?: string
          default_config?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          preview_image_url?: string | null
          slug?: string
          vertical_type?: string
        }
        Relationships: []
      }
      car_showroom_websites: {
        Row: {
          agency_id: string
          config: Json | null
          created_at: string
          id: string
          is_published: boolean
          subdomain: string
          template_id: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          config?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean
          subdomain: string
          template_id: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean
          subdomain?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_showroom_websites_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_showroom_websites_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "car_showroom_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_conversation_starters: {
        Row: {
          agency_id: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          message: string
          sort_order: number | null
        }
        Insert: {
          agency_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          sort_order?: number | null
        }
        Update: {
          agency_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      chatbot_faqs: {
        Row: {
          agency_id: string | null
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
        }
        Insert: {
          agency_id?: string | null
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
        }
        Update: {
          agency_id?: string | null
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          agency_id: string
          classification: Database["public"]["Enums"]["client_classification_enum"]
          company_address: string | null
          company_legal_name: string | null
          company_nif: string | null
          company_rc: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          id_card_url: string | null
          license_url: string | null
          notes: string | null
          passport_url: string | null
          phone: string
          source: string | null
          subgroup: string | null
          volume_discount_tier: number | null
        }
        Insert: {
          agency_id: string
          classification?: Database["public"]["Enums"]["client_classification_enum"]
          company_address?: string | null
          company_legal_name?: string | null
          company_nif?: string | null
          company_rc?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          id_card_url?: string | null
          license_url?: string | null
          notes?: string | null
          passport_url?: string | null
          phone: string
          source?: string | null
          subgroup?: string | null
          volume_discount_tier?: number | null
        }
        Update: {
          agency_id?: string
          classification?: Database["public"]["Enums"]["client_classification_enum"]
          company_address?: string | null
          company_legal_name?: string | null
          company_nif?: string | null
          company_rc?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          id_card_url?: string | null
          license_url?: string | null
          notes?: string | null
          passport_url?: string | null
          phone?: string
          source?: string | null
          subgroup?: string | null
          volume_discount_tier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          agency_id: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string
          source: string | null
          status: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone: string
          source?: string | null
          status?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      containers: {
        Row: {
          agency_id: string | null
          arrival_port: string | null
          container_number: string
          created_at: string
          departure_date: string | null
          departure_port: string | null
          estimated_arrival_date: string | null
          global_port_handling_fee: number | null
          global_shipping_fee: number | null
          global_transit_broker_fee: number | null
          id: string
          notes: string | null
          shipping_line: Database["public"]["Enums"]["shipping_line_enum"]
          status: Database["public"]["Enums"]["shipment_status_enum"]
          updated_at: string
          vessel_name: string | null
          voyage_number: string | null
        }
        Insert: {
          agency_id?: string | null
          arrival_port?: string | null
          container_number: string
          created_at?: string
          departure_date?: string | null
          departure_port?: string | null
          estimated_arrival_date?: string | null
          global_port_handling_fee?: number | null
          global_shipping_fee?: number | null
          global_transit_broker_fee?: number | null
          id?: string
          notes?: string | null
          shipping_line?: Database["public"]["Enums"]["shipping_line_enum"]
          status?: Database["public"]["Enums"]["shipment_status_enum"]
          updated_at?: string
          vessel_name?: string | null
          voyage_number?: string | null
        }
        Update: {
          agency_id?: string | null
          arrival_port?: string | null
          container_number?: string
          created_at?: string
          departure_date?: string | null
          departure_port?: string | null
          estimated_arrival_date?: string | null
          global_port_handling_fee?: number | null
          global_shipping_fee?: number | null
          global_transit_broker_fee?: number | null
          id?: string
          notes?: string | null
          shipping_line?: Database["public"]["Enums"]["shipping_line_enum"]
          status?: Database["public"]["Enums"]["shipment_status_enum"]
          updated_at?: string
          vessel_name?: string | null
          voyage_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "containers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          id: string
          last_message_at: string
          lead_score: string | null
          platform: string
          status: string
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          lead_score?: string | null
          platform?: string
          status?: string
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          lead_score?: string | null
          platform?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_trip_requests: {
        Row: {
          accommodation_preference: string | null
          activities: Json | null
          agency_id: string
          budget_range: string | null
          client_id: string
          created_at: string
          destinations: Json
          duration_days: number | null
          id: string
          quote_amount: number | null
          status: string
          travelers_count: number
        }
        Insert: {
          accommodation_preference?: string | null
          activities?: Json | null
          agency_id: string
          budget_range?: string | null
          client_id: string
          created_at?: string
          destinations?: Json
          duration_days?: number | null
          id?: string
          quote_amount?: number | null
          status?: string
          travelers_count?: number
        }
        Update: {
          accommodation_preference?: string | null
          activities?: Json | null
          agency_id?: string
          budget_range?: string | null
          client_id?: string
          created_at?: string
          destinations?: Json
          duration_days?: number | null
          id?: string
          quote_amount?: number | null
          status?: string
          travelers_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_trip_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_trip_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          agency_id: string | null
          annual_leave_days: number | null
          bank_account: string | null
          bank_name: string | null
          base_salary: number | null
          bonus_eligible: boolean | null
          branch_location: string | null
          ccp_account: string | null
          certifications: Json | null
          commission_percent: number | null
          commission_tier: Json | null
          contract_end: string | null
          contract_url: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          employee_code: string | null
          employment_type: string | null
          gender: string | null
          hire_date: string | null
          id: string
          id_card_back_url: string | null
          id_card_front_url: string | null
          manager_id: string | null
          marital_status: string | null
          nationality: string | null
          num_children: number | null
          passport_url: string | null
          payment_method: string | null
          place_of_birth: string | null
          probation_end: string | null
          remaining_annual_leave: number | null
          remaining_sick_leave: number | null
          role: string | null
          sick_leave_days: number | null
          status: string | null
          updated_at: string | null
          work_schedule: Json | null
        }
        Insert: {
          agency_id?: string | null
          annual_leave_days?: number | null
          bank_account?: string | null
          bank_name?: string | null
          base_salary?: number | null
          bonus_eligible?: boolean | null
          branch_location?: string | null
          ccp_account?: string | null
          certifications?: Json | null
          commission_percent?: number | null
          commission_tier?: Json | null
          contract_end?: string | null
          contract_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_code?: string | null
          employment_type?: string | null
          gender?: string | null
          hire_date?: string | null
          id: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          manager_id?: string | null
          marital_status?: string | null
          nationality?: string | null
          num_children?: number | null
          passport_url?: string | null
          payment_method?: string | null
          place_of_birth?: string | null
          probation_end?: string | null
          remaining_annual_leave?: number | null
          remaining_sick_leave?: number | null
          role?: string | null
          sick_leave_days?: number | null
          status?: string | null
          updated_at?: string | null
          work_schedule?: Json | null
        }
        Update: {
          agency_id?: string | null
          annual_leave_days?: number | null
          bank_account?: string | null
          bank_name?: string | null
          base_salary?: number | null
          bonus_eligible?: boolean | null
          branch_location?: string | null
          ccp_account?: string | null
          certifications?: Json | null
          commission_percent?: number | null
          commission_tier?: Json | null
          contract_end?: string | null
          contract_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_code?: string | null
          employment_type?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          manager_id?: string | null
          marital_status?: string | null
          nationality?: string | null
          num_children?: number | null
          passport_url?: string | null
          payment_method?: string | null
          place_of_birth?: string | null
          probation_end?: string | null
          remaining_annual_leave?: number | null
          remaining_sick_leave?: number | null
          role?: string | null
          sick_leave_days?: number | null
          status?: string | null
          updated_at?: string | null
          work_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          account_number: string | null
          agency_id: string | null
          bank_name: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          id: string
          is_default: boolean | null
          name: string
          opening_balance: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          agency_id?: string | null
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          opening_balance?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          agency_id?: string | null
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          opening_balance?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financing_applications: {
        Row: {
          agency_id: string | null
          assigned_to: string | null
          car_id: string | null
          client_id: string | null
          created_at: string | null
          down_payment_amount: number | null
          duration_months: number | null
          employment_type: string | null
          financing_partner: string | null
          id: string
          interest_rate: number | null
          loan_amount: number | null
          monthly_income: number | null
          monthly_payment: number | null
          notes: string | null
          status: string | null
        }
        Insert: {
          agency_id?: string | null
          assigned_to?: string | null
          car_id?: string | null
          client_id?: string | null
          created_at?: string | null
          down_payment_amount?: number | null
          duration_months?: number | null
          employment_type?: string | null
          financing_partner?: string | null
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          monthly_income?: number | null
          monthly_payment?: number | null
          notes?: string | null
          status?: string | null
        }
        Update: {
          agency_id?: string | null
          assigned_to?: string | null
          car_id?: string | null
          client_id?: string | null
          created_at?: string | null
          down_payment_amount?: number | null
          duration_months?: number | null
          employment_type?: string | null
          financing_partner?: string | null
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          monthly_income?: number | null
          monthly_payment?: number | null
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financing_applications_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_applications_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_tasks: {
        Row: {
          agency_id: string | null
          assignee_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          assignee_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          assignee_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_orders: {
        Row: {
          actual_arrival: string | null
          additional_logistics_fee: number | null
          agency_id: string
          allocated_container_share: number | null
          balance_due: number | null
          carrier: string | null
          client_id: string
          client_notified: boolean
          color: string | null
          container_id: string | null
          container_number: string | null
          custom_duties_fee: number | null
          deposit_paid: number | null
          estimated_arrival: string | null
          id: string
          last_tracking_update: string | null
          order_date: string
          origin_country: string | null
          shipping_status: Json | null
          specs: Json | null
          status: string
          supplier_name: string | null
          total_cost: number | null
          tracking_number: string | null
          tracking_status: string | null
          transitaire_broker_fee: number | null
          vehicle_brand: string
          vehicle_model: string
          vehicle_year: number
        }
        Insert: {
          actual_arrival?: string | null
          additional_logistics_fee?: number | null
          agency_id: string
          allocated_container_share?: number | null
          balance_due?: number | null
          carrier?: string | null
          client_id: string
          client_notified?: boolean
          color?: string | null
          container_id?: string | null
          container_number?: string | null
          custom_duties_fee?: number | null
          deposit_paid?: number | null
          estimated_arrival?: string | null
          id?: string
          last_tracking_update?: string | null
          order_date?: string
          origin_country?: string | null
          shipping_status?: Json | null
          specs?: Json | null
          status?: string
          supplier_name?: string | null
          total_cost?: number | null
          tracking_number?: string | null
          tracking_status?: string | null
          transitaire_broker_fee?: number | null
          vehicle_brand: string
          vehicle_model: string
          vehicle_year: number
        }
        Update: {
          actual_arrival?: string | null
          additional_logistics_fee?: number | null
          agency_id?: string
          allocated_container_share?: number | null
          balance_due?: number | null
          carrier?: string | null
          client_id?: string
          client_notified?: boolean
          color?: string | null
          container_id?: string | null
          container_number?: string | null
          custom_duties_fee?: number | null
          deposit_paid?: number | null
          estimated_arrival?: string | null
          id?: string
          last_tracking_update?: string | null
          order_date?: string
          origin_country?: string | null
          shipping_status?: Json | null
          specs?: Json | null
          status?: string
          supplier_name?: string | null
          total_cost?: number | null
          tracking_number?: string | null
          tracking_status?: string | null
          transitaire_broker_fee?: number | null
          vehicle_brand?: string
          vehicle_model?: string
          vehicle_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_orders_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_orders_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          agency_id: string | null
          created_at: string
          description: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          invoice_id: string | null
          item_reference_id: string | null
          item_type: string
          quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          description: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_id?: string | null
          item_reference_id?: string | null
          item_type?: string
          quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          description?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_id?: string | null
          item_reference_id?: string | null
          item_type?: string
          quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          received_by: string | null
          reference_number: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method: string
          received_by?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          received_by?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          agency_id: string | null
          amount_paid: number
          balance_due: number
          client_id: string | null
          company_legal_name: string | null
          company_nif: string | null
          company_rc: string | null
          created_at: string | null
          discount_amount: number
          discount_percent: number
          due_date: string
          id: string
          invoice_number: string
          invoice_type: string | null
          issue_date: string
          items: Json | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: string | null
          pdf_url: string | null
          sent_at: string | null
          status: string | null
          subtotal: number
          tax_amount: number
          tax_percent: number
          terms: string | null
          total_amount: number
          trip_id: string | null
          updated_at: string | null
          volume_discount_applied: number | null
        }
        Insert: {
          agency_id?: string | null
          amount_paid?: number
          balance_due?: number
          client_id?: string | null
          company_legal_name?: string | null
          company_nif?: string | null
          company_rc?: string | null
          created_at?: string | null
          discount_amount?: number
          discount_percent?: number
          due_date: string
          id?: string
          invoice_number: string
          invoice_type?: string | null
          issue_date: string
          items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number
          tax_percent?: number
          terms?: string | null
          total_amount?: number
          trip_id?: string | null
          updated_at?: string | null
          volume_discount_applied?: number | null
        }
        Update: {
          agency_id?: string | null
          amount_paid?: number
          balance_due?: number
          client_id?: string | null
          company_legal_name?: string | null
          company_nif?: string | null
          company_rc?: string | null
          created_at?: string | null
          discount_amount?: number
          discount_percent?: number
          due_date?: string
          id?: string
          invoice_number?: string
          invoice_type?: string | null
          issue_date?: string
          items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number
          tax_percent?: number
          terms?: string | null
          total_amount?: number
          trip_id?: string | null
          updated_at?: string | null
          volume_discount_applied?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agency_id: string | null
          assigned_to: string | null
          budget: number | null
          car_interest: string | null
          client_id: string | null
          created_at: string | null
          id: string
          last_contacted_at: string | null
          name: string
          notes: string | null
          phone: string
          score: string | null
          source: string | null
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          assigned_to?: string | null
          budget?: number | null
          car_interest?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          last_contacted_at?: string | null
          name: string
          notes?: string | null
          phone: string
          score?: string | null
          source?: string | null
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          assigned_to?: string | null
          budget?: number | null
          car_interest?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          last_contacted_at?: string | null
          name?: string
          notes?: string | null
          phone?: string
          score?: string | null
          source?: string | null
          stage?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          agency_id: string | null
          approved_by: string | null
          created_at: string | null
          employee_id: string | null
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          approved_by?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          approved_by?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaves_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          media_url: string | null
          platform: string
          sender_type: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          media_url?: string | null
          platform?: string
          sender_type: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          media_url?: string | null
          platform?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_inventory: {
        Row: {
          agency_id: string
          category: string | null
          compatible_models: Json | null
          cost_price: number
          created_at: string
          id: string
          name: string
          part_number: string
          reorder_level: number
          sale_price: number
          stock_quantity: number
          supplier: string | null
        }
        Insert: {
          agency_id: string
          category?: string | null
          compatible_models?: Json | null
          cost_price: number
          created_at?: string
          id?: string
          name: string
          part_number: string
          reorder_level?: number
          sale_price: number
          stock_quantity?: number
          supplier?: string | null
        }
        Update: {
          agency_id?: string
          category?: string | null
          compatible_models?: Json | null
          cost_price?: number
          created_at?: string
          id?: string
          name?: string
          part_number?: string
          reorder_level?: number
          sale_price?: number
          stock_quantity?: number
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_inventory_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          agency_id: string | null
          base_salary: number
          bonuses: number | null
          commission: number | null
          created_at: string | null
          deductions: number | null
          employee_id: string | null
          id: string
          month: number
          net_salary: number
          pdf_url: string | null
          status: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          agency_id?: string | null
          base_salary: number
          bonuses?: number | null
          commission?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          id?: string
          month: number
          net_salary: number
          pdf_url?: string | null
          status?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          agency_id?: string | null
          base_salary?: number
          bonuses?: number | null
          commission?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          id?: string
          month?: number
          net_salary?: number
          pdf_url?: string | null
          status?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          ai_credits_monthly: number
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          max_employees: number
          max_trips: number
          name: string
          price: number
        }
        Insert: {
          ai_credits_monthly: number
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id: string
          max_employees: number
          max_trips: number
          name: string
          price: number
        }
        Update: {
          ai_credits_monthly?: number
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          max_employees?: number
          max_trips?: number
          name?: string
          price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_id: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_platform_owner: boolean | null
          phone: string | null
          role: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          is_platform_owner?: boolean | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_platform_owner?: boolean | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      rental_bookings: {
        Row: {
          actual_return_date: string | null
          agency_id: string
          car_id: string
          client_id: string
          created_at: string
          deposit_amount: number | null
          id: string
          pickup_date: string
          pickup_location: string | null
          return_date: string
          return_location: string | null
          status: string
          total_price: number
        }
        Insert: {
          actual_return_date?: string | null
          agency_id: string
          car_id: string
          client_id: string
          created_at?: string
          deposit_amount?: number | null
          id?: string
          pickup_date: string
          pickup_location?: string | null
          return_date: string
          return_location?: string | null
          status?: string
          total_price: number
        }
        Update: {
          actual_return_date?: string | null
          agency_id?: string
          car_id?: string
          client_id?: string
          created_at?: string
          deposit_amount?: number | null
          id?: string
          pickup_date?: string
          pickup_location?: string | null
          return_date?: string
          return_location?: string | null
          status?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "rental_bookings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_rental_fleet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          agency_id: string | null
          created_at: string | null
          id: string
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_appointments: {
        Row: {
          agency_id: string
          appointment_date: string
          client_id: string
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          parts_used: Json | null
          service_type: string
          status: string
          technician_id: string | null
          total_cost: number | null
          vehicle_info: Json | null
        }
        Insert: {
          agency_id: string
          appointment_date: string
          client_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          parts_used?: Json | null
          service_type: string
          status?: string
          technician_id?: string | null
          total_cost?: number | null
          vehicle_info?: Json | null
        }
        Update: {
          agency_id?: string
          appointment_date?: string
          client_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          parts_used?: Json | null
          service_type?: string
          status?: string
          technician_id?: string | null
          total_cost?: number | null
          vehicle_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "service_appointments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_carriers: {
        Row: {
          agency_id: string
          api_endpoint: string | null
          api_key: string | null
          carrier_name: string
          id: string
          is_active: boolean
        }
        Insert: {
          agency_id: string
          api_endpoint?: string | null
          api_key?: string | null
          carrier_name: string
          id?: string
          is_active?: boolean
        }
        Update: {
          agency_id?: string
          api_endpoint?: string | null
          api_key?: string | null
          carrier_name?: string
          id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "shipping_carriers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          agency_id: string | null
          amount_due: number
          amount_paid: number | null
          balance_due: number | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string | null
          supplier_id: string | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          amount_due: number
          amount_paid?: number | null
          balance_due?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          supplier_id?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          amount_due?: number
          amount_paid?: number | null
          balance_due?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          supplier_id?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          agency_id: string | null
          contact_name: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          agency_id?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          agency_id?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      test_drives: {
        Row: {
          agency_id: string | null
          assigned_to: string | null
          car_id: string | null
          client_id: string | null
          client_notes: string | null
          confirmed_date: string | null
          confirmed_time: string | null
          created_at: string | null
          employee_notes: string | null
          id: string
          requested_date: string
          requested_time: string
          status: string | null
        }
        Insert: {
          agency_id?: string | null
          assigned_to?: string | null
          car_id?: string | null
          client_id?: string | null
          client_notes?: string | null
          confirmed_date?: string | null
          confirmed_time?: string | null
          created_at?: string | null
          employee_notes?: string | null
          id?: string
          requested_date: string
          requested_time: string
          status?: string | null
        }
        Update: {
          agency_id?: string | null
          assigned_to?: string | null
          car_id?: string | null
          client_id?: string | null
          client_notes?: string | null
          confirmed_date?: string | null
          confirmed_time?: string | null
          created_at?: string | null
          employee_notes?: string | null
          id?: string
          requested_date?: string
          requested_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_drives_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_drives_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          agency_id: string | null
          amount: number
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          exchange_rate: number | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment_method: string | null
          payment_proof_url: string | null
          recorded_by: string | null
          recurring_frequency: string | null
          reference_number: string | null
          related_booking_id: string | null
          related_employee_id: string | null
          related_invoice_id: string | null
          related_supplier_id: string | null
          transaction_date: string | null
          transfer_to_account_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          agency_id?: string | null
          amount: number
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate?: number | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          recorded_by?: string | null
          recurring_frequency?: string | null
          reference_number?: string | null
          related_booking_id?: string | null
          related_employee_id?: string | null
          related_invoice_id?: string | null
          related_supplier_id?: string | null
          transaction_date?: string | null
          transfer_to_account_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          agency_id?: string | null
          amount?: number
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate?: number | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          recorded_by?: string | null
          recurring_frequency?: string | null
          reference_number?: string | null
          related_booking_id?: string | null
          related_employee_id?: string | null
          related_invoice_id?: string | null
          related_supplier_id?: string | null
          transaction_date?: string | null
          transfer_to_account_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_employee_id_fkey"
            columns: ["related_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_supplier_id_fkey"
            columns: ["related_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_to_account_id_fkey"
            columns: ["transfer_to_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_agency_config: {
        Row: {
          agency_id: string
          ai_personality: Json
          custom_trips_enabled: boolean
          group_bookings_enabled: boolean
          insurance_enabled: boolean
          packages_enabled: boolean
          visa_service_enabled: boolean
        }
        Insert: {
          agency_id: string
          ai_personality?: Json
          custom_trips_enabled?: boolean
          group_bookings_enabled?: boolean
          insurance_enabled?: boolean
          packages_enabled?: boolean
          visa_service_enabled?: boolean
        }
        Update: {
          agency_id?: string
          ai_personality?: Json
          custom_trips_enabled?: boolean
          group_bookings_enabled?: boolean
          insurance_enabled?: boolean
          packages_enabled?: boolean
          visa_service_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "travel_agency_config_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_agency_templates: {
        Row: {
          created_at: string
          default_config: Json | null
          id: string
          is_active: boolean
          name: string
          preview_image_url: string | null
          slug: string
          vertical_type: string
        }
        Insert: {
          created_at?: string
          default_config?: Json | null
          id?: string
          is_active?: boolean
          name: string
          preview_image_url?: string | null
          slug: string
          vertical_type?: string
        }
        Update: {
          created_at?: string
          default_config?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          preview_image_url?: string | null
          slug?: string
          vertical_type?: string
        }
        Relationships: []
      }
      travel_agency_websites: {
        Row: {
          agency_id: string
          config: Json | null
          created_at: string
          id: string
          is_published: boolean
          subdomain: string
          template_id: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          config?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean
          subdomain: string
          template_id: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean
          subdomain?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_agency_websites_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_agency_websites_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "travel_agency_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_bookings: {
        Row: {
          adults_count: number
          agency_id: string
          balance_due: number
          children_count: number
          client_id: string
          created_at: string
          departure_date: string
          deposit_paid: number
          dietary_requirements: string | null
          documents: Json | null
          id: string
          infants_count: number
          package_id: string
          return_date: string | null
          room_preferences: string | null
          special_requests: string | null
          status: string
          total_price: number
          travelers_count: number
        }
        Insert: {
          adults_count?: number
          agency_id: string
          balance_due: number
          children_count?: number
          client_id: string
          created_at?: string
          departure_date: string
          deposit_paid?: number
          dietary_requirements?: string | null
          documents?: Json | null
          id?: string
          infants_count?: number
          package_id: string
          return_date?: string | null
          room_preferences?: string | null
          special_requests?: string | null
          status?: string
          total_price: number
          travelers_count?: number
        }
        Update: {
          adults_count?: number
          agency_id?: string
          balance_due?: number
          children_count?: number
          client_id?: string
          created_at?: string
          departure_date?: string
          deposit_paid?: number
          dietary_requirements?: string | null
          documents?: Json | null
          id?: string
          infants_count?: number
          package_id?: string
          return_date?: string | null
          room_preferences?: string | null
          special_requests?: string | null
          status?: string
          total_price?: number
          travelers_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "travel_bookings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "travel_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_inquiries: {
        Row: {
          agency_id: string
          assigned_agent_id: string | null
          budget_range: string | null
          client_id: string
          created_at: string
          date_preference: string | null
          destination_preference: string | null
          id: string
          inquiry_type: string
          notes: string | null
          status: string
          travelers_count: number
        }
        Insert: {
          agency_id: string
          assigned_agent_id?: string | null
          budget_range?: string | null
          client_id: string
          created_at?: string
          date_preference?: string | null
          destination_preference?: string | null
          id?: string
          inquiry_type: string
          notes?: string | null
          status?: string
          travelers_count?: number
        }
        Update: {
          agency_id?: string
          assigned_agent_id?: string | null
          budget_range?: string | null
          client_id?: string
          created_at?: string
          date_preference?: string | null
          destination_preference?: string | null
          id?: string
          inquiry_type?: string
          notes?: string | null
          status?: string
          travelers_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "travel_inquiries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_inquiries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_packages: {
        Row: {
          agency_id: string
          available_dates: Json | null
          base_price_per_person: number
          child_price: number | null
          created_at: string
          destination_city: string | null
          destination_country: string
          duration_days: number
          id: string
          images: Json | null
          infant_price: number | null
          itinerary: Json | null
          max_travelers: number | null
          min_travelers: number | null
          price_excludes: Json | null
          price_includes: Json | null
          status: string
          subtitle: string | null
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          available_dates?: Json | null
          base_price_per_person: number
          child_price?: number | null
          created_at?: string
          destination_city?: string | null
          destination_country: string
          duration_days: number
          id?: string
          images?: Json | null
          infant_price?: number | null
          itinerary?: Json | null
          max_travelers?: number | null
          min_travelers?: number | null
          price_excludes?: Json | null
          price_includes?: Json | null
          status?: string
          subtitle?: string | null
          tags?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          available_dates?: Json | null
          base_price_per_person?: number
          child_price?: number | null
          created_at?: string
          destination_city?: string | null
          destination_country?: string
          duration_days?: number
          id?: string
          images?: Json | null
          infant_price?: number | null
          itinerary?: Json | null
          max_travelers?: number | null
          min_travelers?: number | null
          price_excludes?: Json | null
          price_includes?: Json | null
          status?: string
          subtitle?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_packages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          accommodation_type: string | null
          agency_id: string | null
          available_dates: Json | null
          booking_deadline_days: number | null
          bookings_open: boolean | null
          brochure_url: string | null
          child_policy: Json | null
          created_at: string | null
          description: string | null
          destination: string
          destination_cities: Json | null
          destination_country: string | null
          duration_days: number
          early_bird_discount: Json | null
          excluded_items: Json | null
          gallery_images: Json | null
          group_discounts: Json | null
          group_size_max: number | null
          group_size_min: number | null
          guide_included: boolean | null
          guide_language: string | null
          hotel_name: string | null
          id: string
          image_urls: Json | null
          included_items: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          itinerary: Json | null
          last_minute_price: number | null
          map_image_url: string | null
          max_bookings: number | null
          meal_plan: string | null
          num_nights: number | null
          passport_validity_months: number | null
          price: number
          required_documents: Json | null
          room_type: string | null
          show_on_chatbot: boolean | null
          show_on_website: boolean | null
          single_supplement: number | null
          title: string
          transport_details: Json | null
          transport_type: string | null
          trip_type: string | null
          vaccinations_required: boolean | null
          video_url: string | null
          visa_details: Json | null
          visa_required: boolean | null
        }
        Insert: {
          accommodation_type?: string | null
          agency_id?: string | null
          available_dates?: Json | null
          booking_deadline_days?: number | null
          bookings_open?: boolean | null
          brochure_url?: string | null
          child_policy?: Json | null
          created_at?: string | null
          description?: string | null
          destination: string
          destination_cities?: Json | null
          destination_country?: string | null
          duration_days: number
          early_bird_discount?: Json | null
          excluded_items?: Json | null
          gallery_images?: Json | null
          group_discounts?: Json | null
          group_size_max?: number | null
          group_size_min?: number | null
          guide_included?: boolean | null
          guide_language?: string | null
          hotel_name?: string | null
          id?: string
          image_urls?: Json | null
          included_items?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          last_minute_price?: number | null
          map_image_url?: string | null
          max_bookings?: number | null
          meal_plan?: string | null
          num_nights?: number | null
          passport_validity_months?: number | null
          price: number
          required_documents?: Json | null
          room_type?: string | null
          show_on_chatbot?: boolean | null
          show_on_website?: boolean | null
          single_supplement?: number | null
          title: string
          transport_details?: Json | null
          transport_type?: string | null
          trip_type?: string | null
          vaccinations_required?: boolean | null
          video_url?: string | null
          visa_details?: Json | null
          visa_required?: boolean | null
        }
        Update: {
          accommodation_type?: string | null
          agency_id?: string | null
          available_dates?: Json | null
          booking_deadline_days?: number | null
          bookings_open?: boolean | null
          brochure_url?: string | null
          child_policy?: Json | null
          created_at?: string | null
          description?: string | null
          destination?: string
          destination_cities?: Json | null
          destination_country?: string | null
          duration_days?: number
          early_bird_discount?: Json | null
          excluded_items?: Json | null
          gallery_images?: Json | null
          group_discounts?: Json | null
          group_size_max?: number | null
          group_size_min?: number | null
          guide_included?: boolean | null
          guide_language?: string | null
          hotel_name?: string | null
          id?: string
          image_urls?: Json | null
          included_items?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          last_minute_price?: number | null
          map_image_url?: string | null
          max_bookings?: number | null
          meal_plan?: string | null
          num_nights?: number | null
          passport_validity_months?: number | null
          price?: number
          required_documents?: Json | null
          room_type?: string | null
          show_on_chatbot?: boolean | null
          show_on_website?: boolean | null
          single_supplement?: number | null
          title?: string
          transport_details?: Json | null
          transport_type?: string | null
          trip_type?: string | null
          vaccinations_required?: boolean | null
          video_url?: string | null
          visa_details?: Json | null
          visa_required?: boolean | null
        }
        Relationships: []
      }
      visa_applications: {
        Row: {
          agency_id: string | null
          amount_paid: number
          appointment_date: string | null
          assigned_to: string | null
          client_id: string | null
          client_notes: string | null
          created_at: string | null
          decision_date: string | null
          documents_status: Json | null
          expiry_date: string | null
          extra_fee: number
          government_fee: number
          group_id: string | null
          group_name: string | null
          id: string
          internal_notes: string | null
          payment_status: string | null
          rejection_reason: string | null
          service_fee: number
          service_level: string | null
          status: string | null
          target_application_date: string | null
          total_fee: number
          updated_at: string | null
          visa_type_id: string | null
        }
        Insert: {
          agency_id?: string | null
          amount_paid?: number
          appointment_date?: string | null
          assigned_to?: string | null
          client_id?: string | null
          client_notes?: string | null
          created_at?: string | null
          decision_date?: string | null
          documents_status?: Json | null
          expiry_date?: string | null
          extra_fee?: number
          government_fee?: number
          group_id?: string | null
          group_name?: string | null
          id?: string
          internal_notes?: string | null
          payment_status?: string | null
          rejection_reason?: string | null
          service_fee?: number
          service_level?: string | null
          status?: string | null
          target_application_date?: string | null
          total_fee?: number
          updated_at?: string | null
          visa_type_id?: string | null
        }
        Update: {
          agency_id?: string | null
          amount_paid?: number
          appointment_date?: string | null
          assigned_to?: string | null
          client_id?: string | null
          client_notes?: string | null
          created_at?: string | null
          decision_date?: string | null
          documents_status?: Json | null
          expiry_date?: string | null
          extra_fee?: number
          government_fee?: number
          group_id?: string | null
          group_name?: string | null
          id?: string
          internal_notes?: string | null
          payment_status?: string | null
          rejection_reason?: string | null
          service_fee?: number
          service_level?: string | null
          status?: string | null
          target_application_date?: string | null
          total_fee?: number
          updated_at?: string | null
          visa_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visa_applications_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_applications_visa_type_id_fkey"
            columns: ["visa_type_id"]
            isOneToOne: false
            referencedRelation: "visa_types"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_payments: {
        Row: {
          amount: number
          application_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_url: string | null
          received_by: string | null
          reference_number: string | null
        }
        Insert: {
          amount?: number
          application_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method: string
          receipt_url?: string | null
          received_by?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          application_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_url?: string | null
          received_by?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visa_payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "visa_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_timeline_events: {
        Row: {
          application_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          is_internal: boolean
          title: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          is_internal?: boolean
          title: string
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          is_internal?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_timeline_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "visa_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_timeline_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_types: {
        Row: {
          agency_id: string | null
          applicable_wilayas: number[] | null
          application_method: string | null
          application_url: string | null
          biometric_required: boolean
          category: string | null
          created_at: string | null
          destination_country: string
          documents_required: Json | null
          express_fee: number
          government_fee: number
          id: string
          interview_required: boolean
          is_active: boolean
          name: string
          processing_time: string
          service_fee: number
          special_notes: string | null
          stay_duration: string
          updated_at: string | null
          validity: string
        }
        Insert: {
          agency_id?: string | null
          applicable_wilayas?: number[] | null
          application_method?: string | null
          application_url?: string | null
          biometric_required?: boolean
          category?: string | null
          created_at?: string | null
          destination_country: string
          documents_required?: Json | null
          express_fee?: number
          government_fee?: number
          id?: string
          interview_required?: boolean
          is_active?: boolean
          name: string
          processing_time: string
          service_fee?: number
          special_notes?: string | null
          stay_duration: string
          updated_at?: string | null
          validity: string
        }
        Update: {
          agency_id?: string | null
          applicable_wilayas?: number[] | null
          application_method?: string | null
          application_url?: string | null
          biometric_required?: boolean
          category?: string | null
          created_at?: string | null
          destination_country?: string
          documents_required?: Json | null
          express_fee?: number
          government_fee?: number
          id?: string
          interview_required?: boolean
          is_active?: boolean
          name?: string
          processing_time?: string
          service_fee?: number
          special_notes?: string | null
          stay_duration?: string
          updated_at?: string | null
          validity?: string
        }
        Relationships: []
      }
      website_configs: {
        Row: {
          agency_id: string | null
          builder_data: Json | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          builder_data?: Json | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          builder_data?: Json | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_configs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      website_revisions: {
        Row: {
          agency_id: string | null
          builder_data: Json
          created_at: string | null
          created_by: string | null
          id: string
          published_at: string | null
          revision_number: number
        }
        Insert: {
          agency_id?: string | null
          builder_data: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          published_at?: string | null
          revision_number: number
        }
        Update: {
          agency_id?: string | null
          builder_data?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          published_at?: string | null
          revision_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "website_revisions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_revisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      website_templates: {
        Row: {
          agency_id: string | null
          business_type_slug: string | null
          category: string | null
          created_at: string | null
          description: string | null
          global_styles: Json
          id: string
          is_custom: boolean | null
          is_default: boolean | null
          name: string
          structure: Json
          thumbnail_url: string | null
        }
        Insert: {
          agency_id?: string | null
          business_type_slug?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          global_styles: Json
          id?: string
          is_custom?: boolean | null
          is_default?: boolean | null
          name: string
          structure: Json
          thumbnail_url?: string | null
        }
        Update: {
          agency_id?: string | null
          business_type_slug?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          global_styles?: Json
          id?: string
          is_custom?: boolean | null
          is_default?: boolean | null
          name?: string
          structure?: Json
          thumbnail_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_employee_code: { Args: { p_agency_id: string }; Returns: string }
      get_current_tenant_id: { Args: never; Returns: string }
      get_dashboard_stats: { Args: { p_agency_id: string }; Returns: Json }
      get_my_agency_id: { Args: never; Returns: string }
      get_next_invoice_number: {
        Args: { p_agency_id: string; p_issue_date: string }
        Returns: string
      }
      is_platform_owner: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      populate_default_roles: {
        Args: { p_agency_id: string }
        Returns: undefined
      }
      populate_default_visa_types: {
        Args: { p_agency_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      car_owner_type_enum: "agency" | "customer"
      client_classification_enum: "retail" | "b2b" | "corporate" | "wholesale"
      shipment_status_enum:
        | "At Origin Port"
        | "On Vessel"
        | "Arrived Port of Algiers"
        | "In Customs"
        | "Dispatched"
        | "Delivered"
      shipping_line_enum:
        | "CMA CGM"
        | "Maersk"
        | "Evergreen"
        | "MSC"
        | "ONE"
        | "HMM"
        | "Other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      car_owner_type_enum: ["agency", "customer"],
      client_classification_enum: ["retail", "b2b", "corporate", "wholesale"],
      shipment_status_enum: [
        "At Origin Port",
        "On Vessel",
        "Arrived Port of Algiers",
        "In Customs",
        "Dispatched",
        "Delivered",
      ],
      shipping_line_enum: [
        "CMA CGM",
        "Maersk",
        "Evergreen",
        "MSC",
        "ONE",
        "HMM",
        "Other",
      ],
    },
  },
} as const
