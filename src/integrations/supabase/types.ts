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
      charts: {
        Row: {
          created_at: string
          dashboard_id: string
          id: string
          position: Json | null
          spec: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_id: string
          id?: string
          position?: Json | null
          spec?: Json
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_id?: string
          id?: string
          position?: Json | null
          spec?: Json
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charts_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          dataset_id: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dataset_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          created_at: string
          dataset_id: string | null
          id: string
          layout: Json | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset_id?: string | null
          id?: string
          layout?: Json | null
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dataset_id?: string | null
          id?: string
          layout?: Json | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboards_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_columns: {
        Row: {
          created_at: string
          dataset_id: string
          dtype: string
          id: string
          name: string
          null_pct: number | null
          position: number
          stats: Json | null
          unique_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset_id: string
          dtype: string
          id?: string
          name: string
          null_pct?: number | null
          position?: number
          stats?: Json | null
          unique_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          dataset_id?: string
          dtype?: string
          id?: string
          name?: string
          null_pct?: number | null
          position?: number
          stats?: Json | null
          unique_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_columns_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          col_count: number | null
          created_at: string
          id: string
          name: string
          row_count: number | null
          schema: Json | null
          source_filename: string | null
          status: string
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          col_count?: number | null
          created_at?: string
          id?: string
          name: string
          row_count?: number | null
          schema?: Json | null
          source_filename?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          col_count?: number | null
          created_at?: string
          id?: string
          name?: string
          row_count?: number | null
          schema?: Json | null
          source_filename?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      forecasts: {
        Row: {
          created_at: string
          dataset_id: string
          horizon: number
          id: string
          method: string
          result: Json | null
          target_col: string
          time_col: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset_id: string
          horizon?: number
          id?: string
          method?: string
          result?: Json | null
          target_col: string
          time_col?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dataset_id?: string
          horizon?: number
          id?: string
          method?: string
          result?: Json | null
          target_col?: string
          time_col?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecasts_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          body: string | null
          created_at: string
          dataset_id: string
          id: string
          payload: Json | null
          severity: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          dataset_id: string
          id?: string
          payload?: Json | null
          severity?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          dataset_id?: string
          id?: string
          payload?: Json | null
          severity?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chart_spec: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          tool_calls: Json | null
          user_id: string
        }
        Insert: {
          chart_spec?: Json | null
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tool_calls?: Json | null
          user_id: string
        }
        Update: {
          chart_spec?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tool_calls?: Json | null
          user_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
