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
      calculation_usage: {
        Row: {
          count: number
          created_at: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drug_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      ful_prices: {
        Row: {
          created_at: string | null
          effective_date: string
          ful_unit_price: number
          id: string
          ndc_11: string
          package_size: number | null
          source_file_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          effective_date: string
          ful_unit_price: number
          id?: string
          ndc_11: string
          package_size?: number | null
          source_file_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          ful_unit_price?: number
          id?: string
          ndc_11?: string
          package_size?: number | null
          source_file_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nadac_drugs: {
        Row: {
          created_at: string
          drug_name: string
          effective_date: string
          explanation: string | null
          id: string
          nadac_per_unit: number
          ndc: string
          pharmacy_type: string | null
          pricing_unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          drug_name: string
          effective_date: string
          explanation?: string | null
          id?: string
          nadac_per_unit: number
          ndc: string
          pharmacy_type?: string | null
          pricing_unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          drug_name?: string
          effective_date?: string
          explanation?: string | null
          id?: string
          nadac_per_unit?: number
          ndc?: string
          pharmacy_type?: string | null
          pricing_unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          drug_name: string
          id: string
          ndc: string
          new_price: number
          old_price: number
          price_change_percent: number
          read_at: string | null
          saved_drug_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          drug_name: string
          id?: string
          ndc: string
          new_price: number
          old_price: number
          price_change_percent: number
          read_at?: string | null
          saved_drug_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          drug_name?: string
          id?: string
          ndc?: string
          new_price?: number
          old_price?: number
          price_change_percent?: number
          read_at?: string | null
          saved_drug_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_saved_drug_id_fkey"
            columns: ["saved_drug_id"]
            isOneToOne: false
            referencedRelation: "saved_drugs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          large_change_threshold: number
          lifetime_saves_count: number
          notify_large_changes_only: boolean
          notify_saved_drugs: boolean
          notify_weekly_movers: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          trial_granted_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          large_change_threshold?: number
          lifetime_saves_count?: number
          notify_large_changes_only?: boolean
          notify_saved_drugs?: boolean
          notify_weekly_movers?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_granted_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          large_change_threshold?: number
          lifetime_saves_count?: number
          notify_large_changes_only?: boolean
          notify_saved_drugs?: boolean
          notify_weekly_movers?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_granted_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reimbursement_calculations: {
        Row: {
          actual_reimbursement: number | null
          created_at: string
          difference: number | null
          drug_name: string
          estimated_reimbursement: number
          gross_margin: number | null
          id: string
          ingredient_cost: number
          margin_percentage: number | null
          nadac_effective_date: string | null
          nadac_unit_price: number
          ndc: string
          notes: string | null
          quantity: number
          rule_id: string | null
          rule_name_snapshot: string
          user_id: string
        }
        Insert: {
          actual_reimbursement?: number | null
          created_at?: string
          difference?: number | null
          drug_name: string
          estimated_reimbursement: number
          gross_margin?: number | null
          id?: string
          ingredient_cost: number
          margin_percentage?: number | null
          nadac_effective_date?: string | null
          nadac_unit_price: number
          ndc: string
          notes?: string | null
          quantity: number
          rule_id?: string | null
          rule_name_snapshot: string
          user_id: string
        }
        Update: {
          actual_reimbursement?: number | null
          created_at?: string
          difference?: number | null
          drug_name?: string
          estimated_reimbursement?: number
          gross_margin?: number | null
          id?: string
          ingredient_cost?: number
          margin_percentage?: number | null
          nadac_effective_date?: string | null
          nadac_unit_price?: number
          ndc?: string
          notes?: string | null
          quantity?: number
          rule_id?: string | null
          rule_name_snapshot?: string
          user_id?: string
        }
        Relationships: []
      }
      reimbursement_rules: {
        Row: {
          adjustment_type: Database["public"]["Enums"]["reimbursement_adjustment_type"]
          cost_basis: Database["public"]["Enums"]["reimbursement_cost_basis"]
          created_at: string
          dispensing_fee: number
          flat_adjustment: number
          id: string
          is_default: boolean
          maximum_reimbursement: number | null
          minimum_reimbursement: number | null
          multiplier: number
          name: string
          notes: string | null
          percentage_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          adjustment_type?: Database["public"]["Enums"]["reimbursement_adjustment_type"]
          cost_basis?: Database["public"]["Enums"]["reimbursement_cost_basis"]
          created_at?: string
          dispensing_fee?: number
          flat_adjustment?: number
          id?: string
          is_default?: boolean
          maximum_reimbursement?: number | null
          minimum_reimbursement?: number | null
          multiplier?: number
          name: string
          notes?: string | null
          percentage_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          adjustment_type?: Database["public"]["Enums"]["reimbursement_adjustment_type"]
          cost_basis?: Database["public"]["Enums"]["reimbursement_cost_basis"]
          created_at?: string
          dispensing_fee?: number
          flat_adjustment?: number
          id?: string
          is_default?: boolean
          maximum_reimbursement?: number | null
          minimum_reimbursement?: number | null
          multiplier?: number
          name?: string
          notes?: string | null
          percentage_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_drug_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          saved_drug_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          saved_drug_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          saved_drug_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_drug_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "drug_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_drug_categories_saved_drug_id_fkey"
            columns: ["saved_drug_id"]
            isOneToOne: false
            referencedRelation: "saved_drugs"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_drugs: {
        Row: {
          alerts_enabled: boolean
          calculator_qty: number | null
          created_at: string
          drug_name: string
          id: string
          last_notified_at: string | null
          last_notified_price: number | null
          ndc: string
          notes: string | null
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean
          calculator_qty?: number | null
          created_at?: string
          drug_name: string
          id?: string
          last_notified_at?: string | null
          last_notified_price?: number | null
          ndc: string
          notes?: string | null
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean
          calculator_qty?: number | null
          created_at?: string
          drug_name?: string
          id?: string
          last_notified_at?: string | null
          last_notified_price?: number | null
          ndc?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_movers: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          previous_date: string
          top_decreases: Json
          top_increases: Json
          total_changed: number
        }
        Insert: {
          created_at?: string
          effective_date: string
          id?: string
          previous_date: string
          top_decreases?: Json
          top_increases?: Json
          total_changed?: number
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          previous_date?: string
          top_decreases?: Json
          top_increases?: Json
          total_changed?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_save_drug: { Args: { p_user_id: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_calc_usage: { Args: never; Returns: number }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      reimbursement_adjustment_type: "plus_pct" | "minus_pct" | "none"
      reimbursement_cost_basis: "nadac" | "nadac_adjusted" | "manual"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      reimbursement_adjustment_type: ["plus_pct", "minus_pct", "none"],
      reimbursement_cost_basis: ["nadac", "nadac_adjusted", "manual"],
    },
  },
} as const
