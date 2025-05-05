export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_status: {
        Row: {
          created_at: string
          id: number
          is_available: boolean
          status_message: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_available: boolean
          status_message?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_available?: boolean
          status_message?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          id: number
          status: Database["public"]["Enums"]["chat_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          status: Database["public"]["Enums"]["chat_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          status?: Database["public"]["Enums"]["chat_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_sessions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: number
          refresh_token: string | null
          session_token: string | null
          stripe_sessions_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: number
          refresh_token?: string | null
          session_token?: string | null
          stripe_sessions_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: number
          refresh_token?: string | null
          session_token?: string | null
          stripe_sessions_id?: string
          user_id?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          chat_id: number
          created_at: string
          id: number
          image_url: string
          prompt: string
        }
        Insert: {
          chat_id: number
          created_at?: string
          id?: number
          image_url: string
          prompt: string
        }
        Update: {
          chat_id?: number
          created_at?: string
          id?: number
          image_url?: string
          prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          chat_id: number
          created_at: string
          id: number
          image_url: string[]
          message: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string
          id?: number
          image_url: string[]
          message?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string
          id?: number
          image_url?: string[]
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          id: number
          image: string
          is_enabled: boolean
          name: string
          query: string
        }
        Insert: {
          created_at?: string
          id?: number
          image: string
          is_enabled?: boolean
          name: string
          query: string
        }
        Update: {
          created_at?: string
          id?: number
          image?: string
          is_enabled?: boolean
          name?: string
          query?: string
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
      chat_status: "pending" | "completed" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chat_status: ["pending", "completed", "error"],
    },
  },
} as const
