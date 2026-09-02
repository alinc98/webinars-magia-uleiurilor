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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          payload: Json
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          payload?: Json
          type: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          payload?: Json
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          last_login_at: string | null
          name: string | null
          role: Database["public"]["Enums"]["admin_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_login_at?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Relationships: []
      }
      consent_texts: {
        Row: {
          body: string
          created_at: string
          is_current: boolean
          version: string
        }
        Insert: {
          body: string
          created_at?: string
          is_current?: boolean
          version: string
        }
        Update: {
          body?: string
          created_at?: string
          is_current?: boolean
          version?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          city: string | null
          consent_at: string | null
          consent_marketing: boolean
          consent_text_version: string | null
          country: string | null
          created_at: string
          email: string
          first_fbclid: string | null
          first_source: string | null
          first_utm_campaign: string | null
          first_utm_content: string | null
          first_utm_medium: string | null
          first_utm_source: string | null
          first_utm_term: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["contact_status"]
          tags: string[]
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          consent_at?: string | null
          consent_marketing?: boolean
          consent_text_version?: string | null
          country?: string | null
          created_at?: string
          email: string
          first_fbclid?: string | null
          first_source?: string | null
          first_utm_campaign?: string | null
          first_utm_content?: string | null
          first_utm_medium?: string | null
          first_utm_source?: string | null
          first_utm_term?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[]
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          consent_at?: string | null
          consent_marketing?: boolean
          consent_text_version?: string | null
          country?: string | null
          created_at?: string
          email?: string
          first_fbclid?: string | null
          first_source?: string | null
          first_utm_campaign?: string | null
          first_utm_content?: string | null
          first_utm_medium?: string | null
          first_utm_source?: string | null
          first_utm_term?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[]
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          provider_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string | null
          template: string
          webinar_id: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          provider_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string | null
          template: string
          webinar_id?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          provider_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string | null
          template?: string
          webinar_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_hits: {
        Row: {
          bucket: string
          created_at: string
          id: number
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: never
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: never
        }
        Relationships: []
      }
      registrations: {
        Row: {
          attended: boolean
          attended_minutes: number | null
          contact_id: string
          fbclid: string | null
          followup_sent_at: string | null
          ga_client_id: string | null
          id: string
          kind: Database["public"]["Enums"]["registration_kind"]
          landing_page: string | null
          referrer: string | null
          registered_at: string
          reminder_24h_sent_at: string | null
          reminder_short_sent_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          webinar_id: string
        }
        Insert: {
          attended?: boolean
          attended_minutes?: number | null
          contact_id: string
          fbclid?: string | null
          followup_sent_at?: string | null
          ga_client_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["registration_kind"]
          landing_page?: string | null
          referrer?: string | null
          registered_at?: string
          reminder_24h_sent_at?: string | null
          reminder_short_sent_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webinar_id: string
        }
        Update: {
          attended?: boolean
          attended_minutes?: number | null
          contact_id?: string
          fbclid?: string | null
          followup_sent_at?: string | null
          ga_client_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["registration_kind"]
          landing_page?: string | null
          referrer?: string | null
          registered_at?: string
          reminder_24h_sent_at?: string | null
          reminder_short_sent_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webinar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars_public"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          hub_empty_text: string
          hub_intro: string
          hub_title: string
          id: boolean
          retentie_luni: number
          updated_at: string
        }
        Insert: {
          hub_empty_text?: string
          hub_intro?: string
          hub_title?: string
          id?: boolean
          retentie_luni?: number
          updated_at?: string
        }
        Update: {
          hub_empty_text?: string
          hub_intro?: string
          hub_title?: string
          id?: boolean
          retentie_luni?: number
          updated_at?: string
        }
        Relationships: []
      }
      speakers: {
        Row: {
          archived_at: string | null
          bio_short: string | null
          created_at: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_default: boolean
          name: string
          photo_url: string | null
          role_title: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          archived_at?: string | null
          bio_short?: string | null
          created_at?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_default?: boolean
          name: string
          photo_url?: string | null
          role_title?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          archived_at?: string | null
          bio_short?: string | null
          created_at?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_default?: boolean
          name?: string
          photo_url?: string | null
          role_title?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          interest: string | null
          notified_at: string | null
          webinar_id: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          interest?: string | null
          notified_at?: string | null
          webinar_id?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          interest?: string | null
          notified_at?: string | null
          webinar_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars_public"
            referencedColumns: ["id"]
          },
        ]
      }
      webinar_sessions: {
        Row: {
          ends_at: string
          id: string
          label: string | null
          starts_at: string
          webinar_id: string
        }
        Insert: {
          ends_at: string
          id?: string
          label?: string | null
          starts_at: string
          webinar_id: string
        }
        Update: {
          ends_at?: string
          id?: string
          label?: string | null
          starts_at?: string
          webinar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webinar_sessions_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webinar_sessions_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars_public"
            referencedColumns: ["id"]
          },
        ]
      }
      webinar_speakers: {
        Row: {
          role_label: Database["public"]["Enums"]["speaker_role"]
          sort_order: number
          speaker_id: string
          webinar_id: string
        }
        Insert: {
          role_label?: Database["public"]["Enums"]["speaker_role"]
          sort_order?: number
          speaker_id: string
          webinar_id: string
        }
        Update: {
          role_label?: Database["public"]["Enums"]["speaker_role"]
          sort_order?: number
          speaker_id?: string
          webinar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webinar_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webinar_speakers_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webinar_speakers_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars_public"
            referencedColumns: ["id"]
          },
        ]
      }
      webinars: {
        Row: {
          address: string | null
          bonus_description: string | null
          bonus_title: string | null
          capacity: number | null
          city: string | null
          county: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_min: number
          ends_at: string
          faq: Json
          for_whom: Json
          format: Database["public"]["Enums"]["webinar_format"]
          id: string
          is_featured: boolean
          join_url: string | null
          learning_points: Json
          listed: boolean
          map_url: string | null
          meta_pixel_id: string | null
          price_bani: number | null
          price_currency: string
          recording_url: string | null
          replay_public: boolean
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          starts_at: string
          status: Database["public"]["Enums"]["webinar_status"]
          subtitle: string | null
          timezone: string
          title: string
          updated_at: string
          useful_info: string | null
          utm_default: string | null
          venue_name: string | null
          venue_notes: string | null
        }
        Insert: {
          address?: string | null
          bonus_description?: string | null
          bonus_title?: string | null
          capacity?: number | null
          city?: string | null
          county?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_min?: number
          ends_at: string
          faq?: Json
          for_whom?: Json
          format?: Database["public"]["Enums"]["webinar_format"]
          id?: string
          is_featured?: boolean
          join_url?: string | null
          learning_points?: Json
          listed?: boolean
          map_url?: string | null
          meta_pixel_id?: string | null
          price_bani?: number | null
          price_currency?: string
          recording_url?: string | null
          replay_public?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          starts_at: string
          status?: Database["public"]["Enums"]["webinar_status"]
          subtitle?: string | null
          timezone?: string
          title: string
          updated_at?: string
          useful_info?: string | null
          utm_default?: string | null
          venue_name?: string | null
          venue_notes?: string | null
        }
        Update: {
          address?: string | null
          bonus_description?: string | null
          bonus_title?: string | null
          capacity?: number | null
          city?: string | null
          county?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_min?: number
          ends_at?: string
          faq?: Json
          for_whom?: Json
          format?: Database["public"]["Enums"]["webinar_format"]
          id?: string
          is_featured?: boolean
          join_url?: string | null
          learning_points?: Json
          listed?: boolean
          map_url?: string | null
          meta_pixel_id?: string | null
          price_bani?: number | null
          price_currency?: string
          recording_url?: string | null
          replay_public?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["webinar_status"]
          subtitle?: string | null
          timezone?: string
          title?: string
          updated_at?: string
          useful_info?: string | null
          utm_default?: string | null
          venue_name?: string | null
          venue_notes?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      contacts_with_stats: {
        Row: {
          attended_count: number | null
          city: string | null
          consent_at: string | null
          consent_marketing: boolean | null
          consent_text_version: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_fbclid: string | null
          first_source: string | null
          first_utm_campaign: string | null
          first_utm_content: string | null
          first_utm_medium: string | null
          first_utm_source: string | null
          first_utm_term: string | null
          id: string | null
          last_registered_at: string | null
          live_count: number | null
          name: string | null
          notes: string | null
          on_waitlist: boolean | null
          phone: string | null
          registrations_count: number | null
          replay_count: number | null
          status: Database["public"]["Enums"]["contact_status"] | null
          tags: string[] | null
          unsubscribe_token: string | null
          unsubscribed_at: string | null
          updated_at: string | null
          webinar_ids: string[] | null
        }
        Relationships: []
      }
      webinars_public: {
        Row: {
          address: string | null
          bonus_description: string | null
          bonus_title: string | null
          capacity: number | null
          city: string | null
          county: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          duration_min: number | null
          ends_at: string | null
          faq: Json | null
          for_whom: Json | null
          format: Database["public"]["Enums"]["webinar_format"] | null
          id: string | null
          is_featured: boolean | null
          is_full: boolean | null
          join_url: string | null
          learning_points: Json | null
          listed: boolean | null
          map_url: string | null
          meta_pixel_id: string | null
          price_bani: number | null
          price_currency: string | null
          recording_url: string | null
          registrations_count: number | null
          replay_public: boolean | null
          seats_left: number | null
          seo_description: string | null
          seo_title: string | null
          sessions: Json | null
          slug: string | null
          sort_order: number | null
          speakers: Json | null
          starts_at: string | null
          status: Database["public"]["Enums"]["webinar_status"] | null
          subtitle: string | null
          timezone: string | null
          title: string | null
          updated_at: string | null
          useful_info: string | null
          utm_default: string | null
          venue_name: string | null
          venue_notes: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      anonimizeaza_contacte_vechi: { Args: never; Returns: number }
      check_rate_limit: {
        Args: { p_bucket: string; p_max?: number; p_window?: string }
        Returns: boolean
      }
      claim_followups: {
        Args: { p_limit?: number }
        Returns: {
          attended: boolean
          contact_id: string
          registration_id: string
          webinar_id: string
        }[]
      }
      claim_reminders_24h: {
        Args: { p_limit?: number }
        Returns: {
          contact_id: string
          registration_id: string
          webinar_id: string
        }[]
      }
      claim_reminders_short: {
        Args: { p_limit?: number }
        Returns: {
          contact_id: string
          registration_id: string
          webinar_id: string
        }[]
      }
      dashboard_stats: { Args: never; Returns: Json }
      join_waitlist: {
        Args: {
          p_consent: boolean
          p_consent_text_version?: string
          p_email: string
          p_interest?: string
          p_name: string
          p_source?: string
          p_tracking?: Json
          p_webinar_slug?: string
        }
        Returns: Json
      }
      leads_per_day: {
        Args: { p_days?: number }
        Returns: {
          leads: number
          zi: string
        }[]
      }
      offset_reminder_scurt: {
        Args: { p_format: Database["public"]["Enums"]["webinar_format"] }
        Returns: string
      }
      register_for_webinar: {
        Args: {
          p_consent: boolean
          p_consent_text_version?: string
          p_email: string
          p_kind?: Database["public"]["Enums"]["registration_kind"]
          p_name: string
          p_phone?: string
          p_slug: string
          p_source?: string
          p_tracking?: Json
        }
        Returns: Json
      }
      set_webinar_sessions: {
        Args: { p_sessions: Json; p_webinar_id: string }
        Returns: undefined
      }
      unsubscribe_by_token: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      activity_type:
        | "inscriere"
        | "cerere_inregistrare"
        | "lista_asteptare"
        | "email_trimis"
        | "email_deschis"
        | "prezenta"
        | "nota_adaugata"
        | "tag_adaugat"
        | "dezabonare"
        | "export"
      admin_role: "owner" | "editor"
      contact_status: "nou" | "contactat" | "interesat" | "client" | "inactiv"
      email_status:
        | "queued"
        | "sent"
        | "delivered"
        | "opened"
        | "bounced"
        | "complained"
      registration_kind: "live" | "inregistrare"
      speaker_role: "gazda" | "invitat"
      webinar_format: "online" | "fizic"
      webinar_status: "draft" | "published" | "live" | "ended" | "cancelled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "inscriere",
        "cerere_inregistrare",
        "lista_asteptare",
        "email_trimis",
        "email_deschis",
        "prezenta",
        "nota_adaugata",
        "tag_adaugat",
        "dezabonare",
        "export",
      ],
      admin_role: ["owner", "editor"],
      contact_status: ["nou", "contactat", "interesat", "client", "inactiv"],
      email_status: [
        "queued",
        "sent",
        "delivered",
        "opened",
        "bounced",
        "complained",
      ],
      registration_kind: ["live", "inregistrare"],
      speaker_role: ["gazda", "invitat"],
      webinar_format: ["online", "fizic"],
      webinar_status: ["draft", "published", "live", "ended", "cancelled"],
    },
  },
} as const
