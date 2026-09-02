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
      couples: {
        Row: {
          a_id: string
          b_id: string | null
          code: string
          created_at: string
          id: string
        }
        Insert: {
          a_id: string
          b_id?: string | null
          code: string
          created_at?: string
          id?: string
        }
        Update: {
          a_id?: string
          b_id?: string | null
          code?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      date_assignments: {
        Row: {
          character_id: string
          created_at: string
          date_id: string
          id: string
          missions: string[]
          slot: string
          user_id: string | null
        }
        Insert: {
          character_id: string
          created_at?: string
          date_id: string
          id?: string
          missions?: string[]
          slot: string
          user_id?: string | null
        }
        Update: {
          character_id?: string
          created_at?: string
          date_id?: string
          id?: string
          missions?: string[]
          slot?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "date_assignments_date_id_fkey"
            columns: ["date_id"]
            isOneToOne: false
            referencedRelation: "dates"
            referencedColumns: ["id"]
          },
        ]
      }
      dates: {
        Row: {
          again: string | null
          archived: boolean
          completed_missions: string[]
          couple_id: string
          created_at: string
          creator_slot: string
          ended: boolean
          id: string
          intensity: string
          joined_a: boolean
          joined_b: boolean
          note: string | null
          rating: number | null
          revealed_a: boolean
          revealed_b: boolean
          scenario: Json | null
          seen_a: boolean
          seen_b: boolean
          started: boolean
          style: string
          vibe: string
        }
        Insert: {
          again?: string | null
          archived?: boolean
          completed_missions?: string[]
          couple_id: string
          created_at?: string
          creator_slot: string
          ended?: boolean
          id?: string
          intensity: string
          joined_a?: boolean
          joined_b?: boolean
          note?: string | null
          rating?: number | null
          revealed_a?: boolean
          revealed_b?: boolean
          scenario?: Json | null
          seen_a?: boolean
          seen_b?: boolean
          started?: boolean
          style: string
          vibe: string
        }
        Update: {
          again?: string | null
          archived?: boolean
          completed_missions?: string[]
          couple_id?: string
          created_at?: string
          creator_slot?: string
          ended?: boolean
          id?: string
          intensity?: string
          joined_a?: boolean
          joined_b?: boolean
          note?: string | null
          rating?: number | null
          revealed_a?: boolean
          revealed_b?: boolean
          scenario?: Json | null
          seen_a?: boolean
          seen_b?: boolean
          started?: boolean
          style?: string
          vibe?: string
        }
        Relationships: [
          {
            foreignKeyName: "dates_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_couple_member: { Args: { _couple_id: string }; Returns: boolean }
      lela_create_invite: {
        Args: never
        Returns: {
          a_id: string
          b_id: string
          code: string
          created_at: string
          id: string
          partner_name: string
        }[]
      }
      lela_generate_code: { Args: never; Returns: string }
      lela_join_couple: {
        Args: { p_code: string }
        Returns: {
          couple_id: string
          state: string
        }[]
      }
      lela_leave_couple: { Args: never; Returns: undefined }
      lela_lookup_invite: {
        Args: { p_code: string }
        Returns: {
          code: string
          host_name: string
          state: string
        }[]
      }
      lela_my_couple: {
        Args: never
        Returns: {
          a_id: string
          b_id: string
          code: string
          created_at: string
          id: string
          partner_name: string
        }[]
      }
      lela_refresh_invite: {
        Args: never
        Returns: {
          a_id: string
          b_id: string
          code: string
          created_at: string
          id: string
          partner_name: string
        }[]
      }
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
    Enums: {},
  },
} as const
