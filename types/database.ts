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
      admin_access_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_access_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      egress_logs: {
        Row: {
          bytes: number
          created_at: string
          doctor_id: string
          id: number
          source: string
          ticket_id: string | null
        }
        Insert: {
          bytes?: number
          created_at?: string
          doctor_id: string
          id?: number
          source: string
          ticket_id?: string | null
        }
        Update: {
          bytes?: number
          created_at?: string
          doctor_id?: string
          id?: number
          source?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "egress_logs_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egress_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_civic: string | null
          address_street: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string
          doctor_id: string
          email: string | null
          first_name: string
          fiscal_code: string
          gender: string | null
          id: string
          last_name: string
          phone_number: string | null
          place_of_birth: string | null
          postal_code: string | null
          province: string | null
        }
        Insert: {
          address_civic?: string | null
          address_street?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth: string
          doctor_id: string
          email?: string | null
          first_name: string
          fiscal_code: string
          gender?: string | null
          id?: string
          last_name: string
          phone_number?: string | null
          place_of_birth?: string | null
          postal_code?: string | null
          province?: string | null
        }
        Update: {
          address_civic?: string | null
          address_street?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string
          doctor_id?: string
          email?: string | null
          first_name?: string
          fiscal_code?: string
          gender?: string | null
          id?: string
          last_name?: string
          phone_number?: string | null
          place_of_birth?: string | null
          postal_code?: string | null
          province?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_civic: string | null
          address_street: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          deletion_scheduled_at: string | null
          email: string
          first_name: string
          fiscal_code: string | null
          gender: string | null
          hospital_name: string | null
          id: string
          last_name: string
          marketing_consent: boolean
          marketing_consent_at: string | null
          medical_license_number: string | null
          phone_number: string | null
          place_of_birth: string | null
          postal_code: string | null
          privacy_accepted_at: string | null
          province: string | null
          region: string | null
          role: string
          status: string
          status_reason: string | null
          status_updated_at: string | null
          terms_accepted_at: string | null
        }
        Insert: {
          address_civic?: string | null
          address_street?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          deletion_scheduled_at?: string | null
          email: string
          first_name: string
          fiscal_code?: string | null
          gender?: string | null
          hospital_name?: string | null
          id: string
          last_name: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          medical_license_number?: string | null
          phone_number?: string | null
          place_of_birth?: string | null
          postal_code?: string | null
          privacy_accepted_at?: string | null
          province?: string | null
          region?: string | null
          role?: string
          status?: string
          status_reason?: string | null
          status_updated_at?: string | null
          terms_accepted_at?: string | null
        }
        Update: {
          address_civic?: string | null
          address_street?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          deletion_scheduled_at?: string | null
          email?: string
          first_name?: string
          fiscal_code?: string | null
          gender?: string | null
          hospital_name?: string | null
          id?: string
          last_name?: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          medical_license_number?: string | null
          phone_number?: string | null
          place_of_birth?: string | null
          postal_code?: string | null
          privacy_accepted_at?: string | null
          province?: string | null
          region?: string | null
          role?: string
          status?: string
          status_reason?: string | null
          status_updated_at?: string | null
          terms_accepted_at?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          annotations: Json | null
          created_at: string
          doctor_id: string
          id: string
          input_bytes: number | null
          notes: string | null
          patient_id: string
          results: Json | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          updated_at: string
        }
        Insert: {
          annotations?: Json | null
          created_at?: string
          doctor_id: string
          id?: string
          input_bytes?: number | null
          notes?: string | null
          patient_id: string
          results?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          updated_at?: string
        }
        Update: {
          annotations?: Json | null
          created_at?: string
          doctor_id?: string
          id?: string
          input_bytes?: number | null
          notes?: string | null
          patient_id?: string
          results?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_doctor_data: { Args: { p_doctor_id: string }; Returns: undefined }
      get_admin_ticket_stats: {
        Args: never
        Returns: {
          completed: number
          failed: number
          total: number
        }[]
      }
      get_auth_stats: { Args: never; Returns: Json }
      get_db_size_bytes: { Args: never; Returns: number }
      get_doctor_analysis_counts: {
        Args: never
        Returns: {
          analysis_count: number
          doctor_id: string
        }[]
      }
    }
    Enums: {
      ticket_status:
        | "UPLOADING"
        | "QUEUED"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
        | "DOWNLOADED"
        | "ERROR"
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
      ticket_status: [
        "UPLOADING",
        "QUEUED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "DOWNLOADED",
        "ERROR",
      ],
    },
  },
} as const
