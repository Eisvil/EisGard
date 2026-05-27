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
      chronicle_events: {
        Row: {
          amount_kopecks: number | null
          created_at: string | null
          description: string | null
          display_name: string
          event_type: string
          id: string
          is_anonymous: boolean
          object_id: string | null
          points: number | null
          user_id: string | null
        }
        Insert: {
          amount_kopecks?: number | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          event_type: string
          id?: string
          is_anonymous?: boolean
          object_id?: string | null
          points?: number | null
          user_id?: string | null
        }
        Update: {
          amount_kopecks?: number | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          event_type?: string
          id?: string
          is_anonymous?: boolean
          object_id?: string | null
          points?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chronicle_events_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chronicle_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount_kopecks: number
          confirmed_at: string | null
          created_at: string | null
          display_name: string
          id: string
          is_anonymous: boolean
          object_id: string | null
          points_awarded: number
          slot_id: string | null
          source: string
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
          ymoney_operation_id: string | null
        }
        Insert: {
          amount_kopecks: number
          confirmed_at?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_anonymous?: boolean
          object_id?: string | null
          points_awarded?: number
          slot_id?: string | null
          source?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          ymoney_operation_id?: string | null
        }
        Update: {
          amount_kopecks?: number
          confirmed_at?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_anonymous?: boolean
          object_id?: string | null
          points_awarded?: number
          slot_id?: string | null
          source?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          ymoney_operation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      material_applications: {
        Row: {
          actual_qty: number | null
          admin_note: string | null
          comment: string | null
          contact_phone: string | null
          contact_telegram: string | null
          created_at: string | null
          id: string
          material_id: string
          object_id: string | null
          points_awarded: number
          quantity: number
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_qty?: number | null
          admin_note?: string | null
          comment?: string | null
          contact_phone?: string | null
          contact_telegram?: string | null
          created_at?: string | null
          id?: string
          material_id: string
          object_id?: string | null
          points_awarded?: number
          quantity: number
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_qty?: number | null
          admin_note?: string | null
          comment?: string | null
          contact_phone?: string | null
          contact_telegram?: string | null
          created_at?: string | null
          id?: string
          material_id?: string
          object_id?: string | null
          points_awarded?: number
          quantity?: number
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_applications_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_applications_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          needed_qty: number | null
          object_id: string | null
          received_qty: number
          sort_order: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          needed_qty?: number | null
          object_id?: string | null
          received_qty?: number
          sort_order?: number
          unit?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          needed_qty?: number | null
          object_id?: string | null
          received_qty?: number
          sort_order?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string | null
          body: Json
          cover_url: string | null
          created_at: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          summary: string | null
          tag: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          body?: Json
          cover_url?: string | null
          created_at?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          summary?: string | null
          tag?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          body?: Json
          cover_url?: string | null
          created_at?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          summary?: string | null
          tag?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      object_partners: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          object_id: string | null
          org_name: string
          support_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          object_id?: string | null
          org_name: string
          support_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          object_id?: string | null
          org_name?: string
          support_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_partners_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      object_views: {
        Row: {
          id: string
          ip_hash: string
          object_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_hash: string
          object_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_hash?: string
          object_id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_views_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objects: {
        Row: {
          cover_url: string | null
          created_at: string | null
          description: Json | null
          historical_note: Json | null
          icon_key: string | null
          id: string
          map_position_x: number | null
          map_position_y: number | null
          name: string
          short_name: string | null
          slug: string
          sort_order: number
          status: string
          total_goal_rub: number
          total_raised_rub: number
          updated_at: string | null
          zone: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          description?: Json | null
          historical_note?: Json | null
          icon_key?: string | null
          id?: string
          map_position_x?: number | null
          map_position_y?: number | null
          name: string
          short_name?: string | null
          slug: string
          sort_order?: number
          status?: string
          total_goal_rub?: number
          total_raised_rub?: number
          updated_at?: string | null
          zone: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          description?: Json | null
          historical_note?: Json | null
          icon_key?: string | null
          id?: string
          map_position_x?: number | null
          map_position_y?: number | null
          name?: string
          short_name?: string | null
          slug?: string
          sort_order?: number
          status?: string
          total_goal_rub?: number
          total_raised_rub?: number
          updated_at?: string | null
          zone?: string
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          admin_note: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          description: string
          id: string
          inn: string | null
          logo_url: string | null
          object_id: string | null
          org_name: string
          status: string
          support_type: string
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          description: string
          id?: string
          inn?: string | null
          logo_url?: string | null
          object_id?: string | null
          org_name: string
          status?: string
          support_type: string
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string
          id?: string
          inn?: string | null
          logo_url?: string | null
          object_id?: string | null
          org_name?: string
          status?: string
          support_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_applications_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          full_name: string
          id: string
          in_chronicle: boolean
          points: number
          role: string
          title_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name: string
          id: string
          in_chronicle?: boolean
          points?: number
          role?: string
          title_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          in_chronicle?: boolean
          points?: number
          role?: string
          title_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          created_at: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      slots: {
        Row: {
          created_at: string | null
          current_value: number
          goal_value: number
          id: string
          is_closed: boolean
          name: string
          object_id: string
          slot_type: string
          sort_order: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number
          goal_value: number
          id?: string
          is_closed?: boolean
          name: string
          object_id: string
          slot_type: string
          sort_order?: number
          unit?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number
          goal_value?: number
          id?: string
          is_closed?: boolean
          name?: string
          object_id?: string
          slot_type?: string
          sort_order?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slots_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      static_pages: {
        Row: {
          body: Json
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: Json
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: Json
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_kopecks: number
          created_at: string | null
          failed_attempts: number
          id: string
          last_payment_date: string | null
          next_payment_date: string
          object_id: string | null
          status: string
          updated_at: string | null
          user_id: string
          ymoney_token: string
        }
        Insert: {
          amount_kopecks: number
          created_at?: string | null
          failed_attempts?: number
          id?: string
          last_payment_date?: string | null
          next_payment_date: string
          object_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          ymoney_token: string
        }
        Update: {
          amount_kopecks?: number
          created_at?: string | null
          failed_attempts?: number
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string
          object_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          ymoney_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          min_points: number
          name: string
          privileges: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          min_points?: number
          name: string
          privileges?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          min_points?: number
          name?: string
          privileges?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          skill_id: string
          user_id: string
        }
        Insert: {
          skill_id: string
          user_id: string
        }
        Update: {
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_applications: {
        Row: {
          admin_note: string | null
          camp_id: string
          comment: string | null
          created_at: string | null
          days_worked: number | null
          id: string
          object_id: string | null
          points_awarded: number
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          camp_id: string
          comment?: string | null
          created_at?: string | null
          days_worked?: number | null
          id?: string
          object_id?: string | null
          points_awarded?: number
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          camp_id?: string
          comment?: string | null
          created_at?: string | null
          days_worked?: number | null
          id?: string
          object_id?: string | null
          points_awarded?: number
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_applications_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "volunteer_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_camps: {
        Row: {
          created_at: string | null
          date_from: string
          date_to: string
          description: string | null
          id: string
          is_open: boolean
          max_volunteers: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_from: string
          date_to: string
          description?: string | null
          id?: string
          is_open?: boolean
          max_volunteers?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_from?: string
          date_to?: string
          description?: string | null
          id?: string
          is_open?: boolean
          max_volunteers?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_object_raised: {
        Args: { p_object_id: string; p_value: number }
        Returns: undefined
      }
      increment_points: {
        Args: { p_points: number; p_user_id: string }
        Returns: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          full_name: string
          id: string
          in_chronicle: boolean
          points: number
          role: string
          title_id: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      increment_slot_value: {
        Args: { p_slot_id: string; p_value: number }
        Returns: undefined
      }
      recalc_all_titles: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
