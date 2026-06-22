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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ic_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
          parent_id: string | null
          parent_name: string | null
          parent_type: string | null
          table_name: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          parent_name?: string | null
          parent_type?: string | null
          table_name?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          parent_name?: string | null
          parent_type?: string | null
          table_name?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_activity_log_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_behaviour_intensity_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_behaviour_intensity_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_behaviour_intensity_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_behaviour_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_behaviour_types_master_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_behaviour_types_master_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_bowel_amounts_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_bowel_amounts_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_bowel_amounts_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_bowel_assistance_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_bowel_assistance_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_bowel_assistance_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_branch_policies: {
        Row: {
          approved_by: string | null
          branch_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          document_url: string | null
          effective_date: string | null
          id: string
          notes: string | null
          policy_type: string
          review_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
          version: string | null
        }
        Insert: {
          approved_by?: string | null
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_url?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          policy_type: string
          review_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          version?: string | null
        }
        Update: {
          approved_by?: string | null
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_url?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          policy_type?: string
          review_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_policies_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "ic_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_branch_policies_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_branch_policies_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_branches: {
        Row: {
          address: string | null
          branch_name: string
          company_name: string | null
          compliance_status: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          last_audit_date: string | null
          manager_name: string | null
          next_review_date: string | null
          notes: string | null
          number_of_houses: number | null
          number_of_staff: number | null
          operating_hours: string | null
          phone: string | null
          service_areas: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          branch_name: string
          company_name?: string | null
          compliance_status?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          last_audit_date?: string | null
          manager_name?: string | null
          next_review_date?: string | null
          notes?: string | null
          number_of_houses?: number | null
          number_of_staff?: number | null
          operating_hours?: string | null
          phone?: string | null
          service_areas?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          branch_name?: string
          company_name?: string | null
          compliance_status?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          last_audit_date?: string | null
          manager_name?: string | null
          next_review_date?: string | null
          notes?: string | null
          number_of_houses?: number | null
          number_of_staff?: number | null
          operating_hours?: string | null
          phone?: string | null
          service_areas?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_branches_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_branches_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_checklist_item_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          group_id: string | null
          group_title: string
          id: string
          instructions: string | null
          is_required: boolean | null
          master_id: string
          priority: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          group_title: string
          id?: string
          instructions?: string | null
          is_required?: boolean | null
          master_id: string
          priority?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          group_title?: string
          id?: string
          instructions?: string | null
          is_required?: boolean | null
          master_id?: string
          priority?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_master_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ic_house_shift_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_master_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "ic_checklist_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_checklist_item_master_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_checklist_item_master_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_checklist_master: {
        Row: {
          checklist_name: string
          created_at: string | null
          created_by: string | null
          days_of_week: string[] | null
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          checklist_name: string
          created_at?: string | null
          created_by?: string | null
          days_of_week?: string[] | null
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          checklist_name?: string
          created_at?: string | null
          created_by?: string | null
          days_of_week?: string[] | null
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_checklist_master_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_checklist_master_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_checklist_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string | null
          house_checklist_id: string
          house_id: string
          id: string
          is_active: boolean | null
          rrule: string
          start_date: string
          target_shift: Database["public"]["Enums"]["ic_shift_period_enum"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          house_checklist_id: string
          house_id: string
          id?: string
          is_active?: boolean | null
          rrule: string
          start_date: string
          target_shift?: Database["public"]["Enums"]["ic_shift_period_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          house_checklist_id?: string
          house_id?: string
          id?: string
          is_active?: boolean | null
          rrule?: string
          start_date?: string
          target_shift?: Database["public"]["Enums"]["ic_shift_period_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_schedules_house_checklist_id_fkey"
            columns: ["house_checklist_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_schedules_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_checklist_schedules_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_checklist_schedules_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_compliance_types_master: {
        Row: {
          attachment_applicable: boolean
          comments_applicable: boolean | null
          compliance_name: string
          created_at: string | null
          created_by: string | null
          description: string | null
          document_number_applicable: boolean | null
          expiry_date_applicable: boolean | null
          id: string
          is_active: boolean | null
          system_category: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          attachment_applicable?: boolean
          comments_applicable?: boolean | null
          compliance_name: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_number_applicable?: boolean | null
          expiry_date_applicable?: boolean | null
          id?: string
          is_active?: boolean | null
          system_category?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          attachment_applicable?: boolean
          comments_applicable?: boolean | null
          compliance_name?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_number_applicable?: boolean | null
          expiry_date_applicable?: boolean | null
          id?: string
          is_active?: boolean | null
          system_category?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_compliance_types_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_compliance_types_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_contact_types_master: {
        Row: {
          contact_type_name: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          contact_type_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          contact_type_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_contact_types_master_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_contact_types_master_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_departments: {
        Row: {
          access_level: string | null
          created_at: string | null
          created_by: string | null
          department_name: string
          description: string | null
          id: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          created_by?: string | null
          department_name: string
          description?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          created_by?: string | null
          department_name?: string
          description?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_departments_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_departments_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_employment_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          employment_type_name: string
          id: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employment_type_name: string
          id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employment_type_name?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_employment_types_master_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_employment_types_master_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_error_logs: {
        Row: {
          app_version: string | null
          category: string
          created_at: string | null
          details: Json | null
          id: string
          message: string
          resolved: boolean | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          category: string
          created_at?: string | null
          details?: Json | null
          id?: string
          message: string
          resolved?: boolean | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          category?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          message?: string
          resolved?: boolean | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ic_house_calendar_event_attachments: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          updated_at: string | null
          updated_by: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_calendar_event_attachments_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_calendar_event_attachments_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_calendar_event_attachments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ic_house_calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_calendar_event_participants: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_id: string
          id: string
          participant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_id: string
          id?: string
          participant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string
          id?: string
          participant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_calendar_event_participants_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_calendar_event_participants_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_calendar_event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ic_house_calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_calendar_event_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_calendar_event_staff: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_id: string
          id: string
          staff_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_id: string
          id?: string
          staff_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string
          id?: string
          staff_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_calendar_event_staff_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_calendar_event_staff_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_calendar_event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ic_house_calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_calendar_event_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_calendar_event_types_master: {
        Row: {
          color: string
          created_at: string | null
          created_by: string | null
          description: string | null
          event_type_name: string
          id: string
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type_name: string
          id?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type_name?: string
          id?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_calendar_event_types_master_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_calendar_event_types_master_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_calendar_events: {
        Row: {
          checklist_schedule_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type_id: string | null
          house_checklist_id: string | null
          house_id: string | null
          id: string
          is_checklist_event: boolean | null
          location: string | null
          start_time: string | null
          status: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          checklist_schedule_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type_id?: string | null
          house_checklist_id?: string | null
          house_id?: string | null
          id?: string
          is_checklist_event?: boolean | null
          location?: string | null
          start_time?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          checklist_schedule_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type_id?: string | null
          house_checklist_id?: string | null
          house_id?: string | null
          id?: string
          is_checklist_event?: boolean | null
          location?: string | null
          start_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_calendar_events_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_calendar_events_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_calendar_events_checklist_schedule_id_fkey"
            columns: ["checklist_schedule_id"]
            isOneToOne: false
            referencedRelation: "ic_checklist_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_calendar_events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "ic_house_calendar_event_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_calendar_events_house_checklist_id_fkey"
            columns: ["house_checklist_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_calendar_events_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_checklist_item_attachments: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          item_id: string
          mime_type: string | null
          submission_id: string
          updated_at: string | null
          updated_by: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          item_id: string
          mime_type?: string | null
          submission_id: string
          updated_at?: string | null
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          item_id?: string
          mime_type?: string | null
          submission_id?: string
          updated_at?: string | null
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_checklist_item_attachments_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_checklist_item_attachments_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_item_attachments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_item_attachments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklist_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_item_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_checklist_items: {
        Row: {
          checklist_id: string | null
          created_at: string | null
          created_by: string | null
          group_id: string | null
          group_title: string | null
          id: string
          instructions: string | null
          is_required: boolean | null
          master_item_id: string | null
          priority: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          checklist_id?: string | null
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          group_title?: string | null
          id?: string
          instructions?: string | null
          is_required?: boolean | null
          master_item_id?: string | null
          priority?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          checklist_id?: string | null
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          group_title?: string | null
          id?: string
          instructions?: string | null
          is_required?: boolean | null
          master_item_id?: string | null
          priority?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_checklist_items_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_checklist_items_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ic_house_shift_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_items_master_item_id_fkey"
            columns: ["master_item_id"]
            isOneToOne: false
            referencedRelation: "ic_checklist_item_master"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_checklist_submission_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_completed: boolean
          item_id: string
          master_item_id: string | null
          note: string | null
          status: string | null
          submission_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_completed?: boolean
          item_id: string
          master_item_id?: string | null
          note?: string | null
          status?: string | null
          submission_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_completed?: boolean
          item_id?: string
          master_item_id?: string | null
          note?: string | null
          status?: string | null
          submission_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_checklist_submission_items_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_checklist_submission_items_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submission_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submission_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submission_items_master_item_id_fkey"
            columns: ["master_item_id"]
            isOneToOne: false
            referencedRelation: "ic_checklist_item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submission_items_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklist_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_checklist_submissions: {
        Row: {
          calendar_event_id: string | null
          checklist_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          house_id: string
          id: string
          master_id: string | null
          scheduled_date: string
          shift_assignment_id: string | null
          shift_id: string | null
          shift_template_id: string | null
          started_at: string | null
          status: string
          submitted_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          calendar_event_id?: string | null
          checklist_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          house_id: string
          id?: string
          master_id?: string | null
          scheduled_date?: string
          shift_assignment_id?: string | null
          shift_id?: string | null
          shift_template_id?: string | null
          started_at?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          calendar_event_id?: string | null
          checklist_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          house_id?: string
          id?: string
          master_id?: string | null
          scheduled_date?: string
          shift_assignment_id?: string | null
          shift_id?: string | null
          shift_template_id?: string | null
          started_at?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_checklist_submissions_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_checklist_submissions_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submissions_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "ic_house_calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submissions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submissions_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submissions_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "ic_checklist_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submissions_shift_assignment_id_fkey"
            columns: ["shift_assignment_id"]
            isOneToOne: false
            referencedRelation: "ic_shift_assigned_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submissions_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "ic_staff_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submissions_shift_type_id_fkey"
            columns: ["shift_template_id"]
            isOneToOne: false
            referencedRelation: "ic_house_shift_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklist_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_checklists: {
        Row: {
          created_at: string | null
          created_by: string | null
          days_of_week: string[] | null
          description: string | null
          house_checklist_name: string
          house_id: string | null
          id: string
          is_global: boolean | null
          master_id: string | null
          sort_order: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          days_of_week?: string[] | null
          description?: string | null
          house_checklist_name: string
          house_id?: string | null
          id?: string
          is_global?: boolean | null
          master_id?: string | null
          sort_order?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          days_of_week?: string[] | null
          description?: string | null
          house_checklist_name?: string
          house_id?: string | null
          id?: string
          is_global?: boolean | null
          master_id?: string | null
          sort_order?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_checklists_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_checklists_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklists_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_checklists_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "ic_checklist_master"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_comms: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          entry_date: string
          house_id: string
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          entry_date?: string
          house_id: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          entry_date?: string
          house_id?: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_comms_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_comms_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_comms_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_files: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          house_id: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          house_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          house_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_files_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_files_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_files_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_form_assignments: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          form_id: string | null
          id: string
          notes: string | null
          participant_id: string | null
          staff_id: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          form_id?: string | null
          id?: string
          notes?: string | null
          participant_id?: string | null
          staff_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          form_id?: string | null
          id?: string
          notes?: string | null
          participant_id?: string | null
          staff_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_form_assignments_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_form_assignments_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_form_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_form_assignments_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_form_assignments_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "ic_house_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_form_assignments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_form_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_form_submissions: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          created_by: string | null
          form_id: string | null
          id: string
          participant_id: string | null
          status: string | null
          submission_data: Json | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          form_id?: string | null
          id?: string
          participant_id?: string | null
          status?: string | null
          submission_data?: Json | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          form_id?: string | null
          id?: string
          participant_id?: string | null
          status?: string | null
          submission_data?: Json | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_form_submissions_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_form_submissions_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_form_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "ic_house_form_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "ic_house_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_form_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_form_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_forms: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          frequency: string
          house_form_name: string
          house_id: string | null
          id: string
          is_global: boolean | null
          status: string | null
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          frequency: string
          house_form_name: string
          house_id?: string | null
          id?: string
          is_global?: boolean | null
          status?: string | null
          type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          frequency?: string
          house_form_name?: string
          house_id?: string | null
          id?: string
          is_global?: boolean | null
          status?: string | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_forms_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_forms_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_forms_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_resources: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          house_id: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          title: string
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          house_id?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          title: string
          type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          house_id?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_resources_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_resources_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_resources_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_shift_templates: {
        Row: {
          color_theme: string | null
          created_at: string | null
          created_by: string | null
          default_end_time: string | null
          default_start_time: string | null
          house_id: string
          icon_name: string | null
          id: string
          is_active: boolean
          shift_template_name: string
          short_name: string | null
          sort_order: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          color_theme?: string | null
          created_at?: string | null
          created_by?: string | null
          default_end_time?: string | null
          default_start_time?: string | null
          house_id: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          shift_template_name: string
          short_name?: string | null
          sort_order?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          color_theme?: string | null
          created_at?: string | null
          created_by?: string | null
          default_end_time?: string | null
          default_start_time?: string | null
          house_id?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          shift_template_name?: string
          short_name?: string | null
          sort_order?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_shift_templates_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_shift_templates_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_shift_types_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_staff_assignments: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string | null
          house_id: string
          id: string
          is_primary: boolean | null
          notes: string | null
          staff_id: string
          start_date: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          house_id: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          staff_id: string
          start_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          house_id?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          staff_id?: string
          start_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_staff_assignments_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_staff_assignments_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_staff_assignments_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_house_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          house_type_name: string
          id: string
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          house_type_name: string
          id?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          house_type_name?: string
          id?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_house_types_master_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_house_types_master_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_houses: {
        Row: {
          address: string | null
          branch_id: string | null
          capacity: number | null
          created_at: string | null
          created_by: string | null
          current_occupancy: number | null
          general_house_details: string | null
          house_manager: string | null
          house_name: string
          house_type_id: string | null
          id: string
          individuals_breakdown: string | null
          is_configured: boolean
          notes: string | null
          observations: string | null
          participant_dynamics: string | null
          phone: string | null
          risk_management: string | null
          setup_step: number
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          current_occupancy?: number | null
          general_house_details?: string | null
          house_manager?: string | null
          house_name: string
          house_type_id?: string | null
          id?: string
          individuals_breakdown?: string | null
          is_configured?: boolean
          notes?: string | null
          observations?: string | null
          participant_dynamics?: string | null
          phone?: string | null
          risk_management?: string | null
          setup_step?: number
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          current_occupancy?: number | null
          general_house_details?: string | null
          house_manager?: string | null
          house_name?: string
          house_type_id?: string | null
          id?: string
          individuals_breakdown?: string | null
          is_configured?: boolean
          notes?: string | null
          observations?: string | null
          participant_dynamics?: string | null
          phone?: string | null
          risk_management?: string | null
          setup_step?: number
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_houses_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_houses_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "houses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "ic_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "houses_house_type_id_fkey"
            columns: ["house_type_id"]
            isOneToOne: false
            referencedRelation: "ic_house_types_master"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_hygiene_levels_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_hygiene_levels_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_hygiene_levels_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_id_document_types: {
        Row: {
          attachment_applicable: boolean
          category: string
          comments_applicable: boolean
          created_at: string | null
          created_by: string | null
          document_number_applicable: boolean
          expiry_date_applicable: boolean | null
          id: string
          is_active: boolean | null
          name: string
          placeholder: string | null
          points: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          attachment_applicable?: boolean
          category: string
          comments_applicable?: boolean
          created_at?: string | null
          created_by?: string | null
          document_number_applicable?: boolean
          expiry_date_applicable?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          placeholder?: string | null
          points: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          attachment_applicable?: boolean
          category?: string
          comments_applicable?: boolean
          created_at?: string | null
          created_by?: string | null
          document_number_applicable?: boolean
          expiry_date_applicable?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          placeholder?: string | null
          points?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_id_document_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_id_document_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_incident_reports: {
        Row: {
          admin_actions_taken: string | null
          admin_status: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          details: string | null
          follow_up_required: boolean
          house_id: string | null
          id: string
          incident_date: string
          incident_type: string | null
          incident_type_id: string | null
          involved_participant_id: string | null
          involved_staff_id: string
          is_ndis_reportable: boolean
          is_restrictive_practice: boolean
          ndis_reported_date: string | null
          notified_parties: string | null
          outcome: string | null
          priority: string
          reference_id: string | null
          reported_by: string
          restrictive_practice_description: string | null
          restrictive_practice_type_id: string | null
          rp_end_time: string | null
          rp_observed_behaviours: string | null
          rp_outcome: string | null
          rp_reason: string | null
          rp_start_time: string | null
          rp_triggers: string | null
          severity: string | null
          status: string | null
          summary: string | null
          updated_at: string | null
          updated_by: string | null
          witnesses: string | null
        }
        Insert: {
          admin_actions_taken?: string | null
          admin_status?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          details?: string | null
          follow_up_required?: boolean
          house_id?: string | null
          id?: string
          incident_date: string
          incident_type?: string | null
          incident_type_id?: string | null
          involved_participant_id?: string | null
          involved_staff_id: string
          is_ndis_reportable?: boolean
          is_restrictive_practice?: boolean
          ndis_reported_date?: string | null
          notified_parties?: string | null
          outcome?: string | null
          priority?: string
          reference_id?: string | null
          reported_by: string
          restrictive_practice_description?: string | null
          restrictive_practice_type_id?: string | null
          rp_end_time?: string | null
          rp_observed_behaviours?: string | null
          rp_outcome?: string | null
          rp_reason?: string | null
          rp_start_time?: string | null
          rp_triggers?: string | null
          severity?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
          witnesses?: string | null
        }
        Update: {
          admin_actions_taken?: string | null
          admin_status?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          details?: string | null
          follow_up_required?: boolean
          house_id?: string | null
          id?: string
          incident_date?: string
          incident_type?: string | null
          incident_type_id?: string | null
          involved_participant_id?: string | null
          involved_staff_id?: string
          is_ndis_reportable?: boolean
          is_restrictive_practice?: boolean
          ndis_reported_date?: string | null
          notified_parties?: string | null
          outcome?: string | null
          priority?: string
          reference_id?: string | null
          reported_by?: string
          restrictive_practice_description?: string | null
          restrictive_practice_type_id?: string | null
          rp_end_time?: string | null
          rp_observed_behaviours?: string | null
          rp_outcome?: string | null
          rp_reason?: string | null
          rp_start_time?: string | null
          rp_triggers?: string | null
          severity?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
          witnesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_incident_reports_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_incident_reports_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_incident_reports_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_incident_reports_incident_type_id_fkey"
            columns: ["incident_type_id"]
            isOneToOne: false
            referencedRelation: "ic_incident_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_incident_reports_involved_participant_id_fkey"
            columns: ["involved_participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_incident_reports_involved_staff_id_fkey"
            columns: ["involved_staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_incident_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_incident_reports_restrictive_practice_type_id_fkey"
            columns: ["restrictive_practice_type_id"]
            isOneToOne: false
            referencedRelation: "ic_restrictive_practice_types_master"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_incident_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ic_leave_requests: {
        Row: {
          admin_notes: string | null
          attachment_url: string | null
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          staff_id: string
          start_date: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          staff_id: string
          start_date: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          staff_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_leave_requests_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_leave_requests_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "ic_leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_leave_types: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          leave_type_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          leave_type_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          leave_type_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_leave_types_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_leave_types_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_medication_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          medication_type_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          medication_type_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          medication_type_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_medication_types_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_medication_types_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_medications_master: {
        Row: {
          brand_name: string | null
          contraindications: string | null
          created_at: string | null
          created_by: string | null
          id: string
          interactions: string | null
          is_active: boolean | null
          medication_name: string
          purpose: string | null
          side_effects: string | null
          sub_class: string | null
          type_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          brand_name?: string | null
          contraindications?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interactions?: string | null
          is_active?: boolean | null
          medication_name: string
          purpose?: string | null
          side_effects?: string | null
          sub_class?: string | null
          type_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          brand_name?: string | null
          contraindications?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interactions?: string | null
          is_active?: boolean | null
          medication_name?: string
          purpose?: string | null
          side_effects?: string | null
          sub_class?: string | null
          type_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_medications_master_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_medications_master_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_medications_master_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "ic_medication_types_master"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_mtm_diet_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_mtm_diet_types_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_mtm_diet_types_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_mtm_fluid_intake_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_mtm_fluid_intake_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_mtm_fluid_intake_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_mtm_fluids_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_mtm_fluids_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_mtm_fluids_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_mtm_meal_intake_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_mtm_meal_intake_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_mtm_meal_intake_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_mtm_swallowing_concerns_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_mtm_swallowing_concerns_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_mtm_swallowing_concerns_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_notifications: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean
          link: string | null
          metadata: Json | null
          title: string
          type: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title: string
          type: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_notifications_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_notifications_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_nutrition_intake_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_nutrition_intake_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_nutrition_intake_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_nutrition_meal_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_nutrition_meal_types_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_nutrition_meal_types_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_onboarding_items_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          item_name: string
          sort_order: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          item_name: string
          sort_order?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          item_name?: string
          sort_order?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ic_participant_contacts: {
        Row: {
          address: string | null
          contact_name: string
          contact_type_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_emergency_contact: boolean
          notes: string | null
          participant_id: string
          phone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          contact_name: string
          contact_type_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_emergency_contact?: boolean
          notes?: string | null
          participant_id: string
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string
          contact_type_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_emergency_contact?: boolean
          notes?: string | null
          participant_id?: string
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participant_contacts_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participant_contacts_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_contacts_contact_type_id_fkey"
            columns: ["contact_type_id"]
            isOneToOne: false
            referencedRelation: "ic_contact_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_providers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_document_roles: {
        Row: {
          access_level: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at: string | null
          created_by: string | null
          document_id: string
          id: string
          role_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at?: string | null
          created_by?: string | null
          document_id: string
          id?: string
          role_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at?: string | null
          created_by?: string | null
          document_id?: string
          id?: string
          role_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participant_document_roles_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participant_document_roles_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_participant_document_roles_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ic_participant_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_participant_document_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ic_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          participant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          participant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          participant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participant_documents_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participant_documents_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_documents_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_forms: {
        Row: {
          created_at: string | null
          created_by: string | null
          form_data: Json | null
          form_title: string
          form_type: string
          id: string
          participant_id: string
          submission_date: string | null
          submitted_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          form_data?: Json | null
          form_title: string
          form_type: string
          id?: string
          participant_id: string
          submission_date?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          form_data?: Json | null
          form_title?: string
          form_type?: string
          id?: string
          participant_id?: string
          submission_date?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participant_forms_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participant_forms_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_forms_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_forms_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_goal_progress: {
        Row: {
          created_at: string | null
          created_by: string | null
          goal_id: string
          id: string
          progress_note: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          goal_id: string
          id?: string
          progress_note: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          goal_id?: string
          id?: string
          progress_note?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participant_goal_progress_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participant_goal_progress_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_goal_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "ic_participant_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_goals: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          goal_type: string
          id: string
          is_active: boolean | null
          participant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description: string
          goal_type: string
          id?: string
          is_active?: boolean | null
          participant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          participant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participant_goals_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participant_goals_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_goals_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_hygiene_routines: {
        Row: {
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          equipment_needed: string | null
          frequency: string | null
          id: string
          notes: string | null
          participant_id: string
          routine_type: string
          specific_instructions: string | null
          support_level: string
          time_of_day: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          equipment_needed?: string | null
          frequency?: string | null
          id?: string
          notes?: string | null
          participant_id: string
          routine_type: string
          specific_instructions?: string | null
          support_level: string
          time_of_day?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          equipment_needed?: string | null
          frequency?: string | null
          id?: string
          notes?: string | null
          participant_id?: string
          routine_type?: string
          specific_instructions?: string | null
          support_level?: string
          time_of_day?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participant_hygiene_routines_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participant_hygiene_routines_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_hygiene_routines_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_medications: {
        Row: {
          created_at: string | null
          created_by: string | null
          dosage: string | null
          id: string
          is_active: boolean | null
          is_prn: boolean
          medication_id: string | null
          participant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dosage?: string | null
          id?: string
          is_active?: boolean | null
          is_prn?: boolean
          medication_id?: string | null
          participant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dosage?: string | null
          id?: string
          is_active?: boolean | null
          is_prn?: boolean
          medication_id?: string | null
          participant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participant_medications_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participant_medications_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "ic_medications_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_medications_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_important: boolean | null
          is_private: boolean | null
          note_type: string | null
          participant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_important?: boolean | null
          is_private?: boolean | null
          note_type?: string | null
          participant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_important?: boolean | null
          is_private?: boolean | null
          note_type?: string | null
          participant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participant_notes_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participant_notes_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_notes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_restrictive_practices: {
        Row: {
          alternatives_considered: string | null
          authorization_date: string | null
          authorized_by: string | null
          conditions: string | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          incident_reporting_protocol: string | null
          is_ndis_reportable: boolean | null
          justification: string
          monitoring_requirements: string | null
          participant_id: string
          practice_type: string
          review_date: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          alternatives_considered?: string | null
          authorization_date?: string | null
          authorized_by?: string | null
          conditions?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          incident_reporting_protocol?: string | null
          is_ndis_reportable?: boolean | null
          justification: string
          monitoring_requirements?: string | null
          participant_id: string
          practice_type: string
          review_date: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          alternatives_considered?: string | null
          authorization_date?: string | null
          authorized_by?: string | null
          conditions?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          incident_reporting_protocol?: string | null
          is_ndis_reportable?: boolean | null
          justification?: string
          monitoring_requirements?: string | null
          participant_id?: string
          practice_type?: string
          review_date?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participant_restrictive_practices_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participant_restrictive_practices_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_restrictive_practices_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participants: {
        Row: {
          address: string | null
          allergies: string | null
          behaviour_of_concern: string | null
          bsp_available: boolean | null
          communication_language_needs: string | null
          communication_notes: string | null
          communication_type: string | null
          created_at: string | null
          created_by: string | null
          cultural_religious_support: string | null
          current_goals: string | null
          current_medications: string | null
          date_of_birth: string | null
          email: string | null
          finance_support: string | null
          general_notes: string | null
          gp_contact: string | null
          gp_location: string | null
          gp_name: string | null
          health_wellbeing_support: string | null
          house_id: string | null
          house_phone: string | null
          household_support: string | null
          hygiene_support: string | null
          id: string
          meal_prep_support: string | null
          medical_plan: string | null
          medical_routine_general_process: string | null
          medical_routine_other: string | null
          mental_health_plan: string | null
          mobility_support: string | null
          move_in_date: string | null
          mtmp_details: string | null
          mtmp_required: boolean | null
          natural_disaster_plan: string | null
          ndis_number: string | null
          other_support: string | null
          participant_name: string | null
          pbsp_engaged: boolean | null
          personal_mobile: string | null
          pharmacy_contact: string | null
          pharmacy_location: string | null
          pharmacy_name: string | null
          photo_url: string | null
          primary_diagnosis: string | null
          psychiatrist_contact: string | null
          psychiatrist_location: string | null
          psychiatrist_name: string | null
          restrictive_practice_authorisation: boolean | null
          restrictive_practice_details: string | null
          restrictive_practices: string | null
          restrictive_practices_yn: boolean | null
          routine: string | null
          secondary_diagnosis: string | null
          service_providers: string | null
          specialist_email: string | null
          specialist_name: string | null
          specialist_phone: string | null
          status: Database["public"]["Enums"]["ic_status_enum"]
          support_coordinator: string | null
          support_level: string | null
          track_behaviour: boolean | null
          track_bowel: boolean | null
          track_community: boolean | null
          track_hygiene: boolean | null
          track_mtm: boolean | null
          track_nutrition: boolean | null
          track_seizure: boolean | null
          track_sleep: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          behaviour_of_concern?: string | null
          bsp_available?: boolean | null
          communication_language_needs?: string | null
          communication_notes?: string | null
          communication_type?: string | null
          created_at?: string | null
          created_by?: string | null
          cultural_religious_support?: string | null
          current_goals?: string | null
          current_medications?: string | null
          date_of_birth?: string | null
          email?: string | null
          finance_support?: string | null
          general_notes?: string | null
          gp_contact?: string | null
          gp_location?: string | null
          gp_name?: string | null
          health_wellbeing_support?: string | null
          house_id?: string | null
          house_phone?: string | null
          household_support?: string | null
          hygiene_support?: string | null
          id?: string
          meal_prep_support?: string | null
          medical_plan?: string | null
          medical_routine_general_process?: string | null
          medical_routine_other?: string | null
          mental_health_plan?: string | null
          mobility_support?: string | null
          move_in_date?: string | null
          mtmp_details?: string | null
          mtmp_required?: boolean | null
          natural_disaster_plan?: string | null
          ndis_number?: string | null
          other_support?: string | null
          participant_name?: string | null
          pbsp_engaged?: boolean | null
          personal_mobile?: string | null
          pharmacy_contact?: string | null
          pharmacy_location?: string | null
          pharmacy_name?: string | null
          photo_url?: string | null
          primary_diagnosis?: string | null
          psychiatrist_contact?: string | null
          psychiatrist_location?: string | null
          psychiatrist_name?: string | null
          restrictive_practice_authorisation?: boolean | null
          restrictive_practice_details?: string | null
          restrictive_practices?: string | null
          restrictive_practices_yn?: boolean | null
          routine?: string | null
          secondary_diagnosis?: string | null
          service_providers?: string | null
          specialist_email?: string | null
          specialist_name?: string | null
          specialist_phone?: string | null
          status?: Database["public"]["Enums"]["ic_status_enum"]
          support_coordinator?: string | null
          support_level?: string | null
          track_behaviour?: boolean | null
          track_bowel?: boolean | null
          track_community?: boolean | null
          track_hygiene?: boolean | null
          track_mtm?: boolean | null
          track_nutrition?: boolean | null
          track_seizure?: boolean | null
          track_sleep?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          behaviour_of_concern?: string | null
          bsp_available?: boolean | null
          communication_language_needs?: string | null
          communication_notes?: string | null
          communication_type?: string | null
          created_at?: string | null
          created_by?: string | null
          cultural_religious_support?: string | null
          current_goals?: string | null
          current_medications?: string | null
          date_of_birth?: string | null
          email?: string | null
          finance_support?: string | null
          general_notes?: string | null
          gp_contact?: string | null
          gp_location?: string | null
          gp_name?: string | null
          health_wellbeing_support?: string | null
          house_id?: string | null
          house_phone?: string | null
          household_support?: string | null
          hygiene_support?: string | null
          id?: string
          meal_prep_support?: string | null
          medical_plan?: string | null
          medical_routine_general_process?: string | null
          medical_routine_other?: string | null
          mental_health_plan?: string | null
          mobility_support?: string | null
          move_in_date?: string | null
          mtmp_details?: string | null
          mtmp_required?: boolean | null
          natural_disaster_plan?: string | null
          ndis_number?: string | null
          other_support?: string | null
          participant_name?: string | null
          pbsp_engaged?: boolean | null
          personal_mobile?: string | null
          pharmacy_contact?: string | null
          pharmacy_location?: string | null
          pharmacy_name?: string | null
          photo_url?: string | null
          primary_diagnosis?: string | null
          psychiatrist_contact?: string | null
          psychiatrist_location?: string | null
          psychiatrist_name?: string | null
          restrictive_practice_authorisation?: boolean | null
          restrictive_practice_details?: string | null
          restrictive_practices?: string | null
          restrictive_practices_yn?: boolean | null
          routine?: string | null
          secondary_diagnosis?: string | null
          service_providers?: string | null
          specialist_email?: string | null
          specialist_name?: string | null
          specialist_phone?: string | null
          status?: Database["public"]["Enums"]["ic_status_enum"]
          support_coordinator?: string | null
          support_level?: string | null
          track_behaviour?: boolean | null
          track_bowel?: boolean | null
          track_community?: boolean | null
          track_hygiene?: boolean | null
          track_mtm?: boolean | null
          track_nutrition?: boolean | null
          track_seizure?: boolean | null
          track_sleep?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_participants_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_participants_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_permission_mappings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          page_id: string
          parent_group: string | null
          permission_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          page_id: string
          parent_group?: string | null
          permission_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          page_id?: string
          parent_group?: string | null
          permission_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_permission_mappings_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_permission_mappings_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_positions: {
        Row: {
          access_level: string | null
          compliance_requirements: string[] | null
          created_at: string | null
          created_by: string | null
          department_id: string | null
          description: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          access_level?: string | null
          compliance_requirements?: string[] | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          access_level?: string | null
          compliance_requirements?: string[] | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_positions_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_positions_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "ic_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_provider_participants: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          participant_id: string
          provider_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          participant_id: string
          provider_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          participant_id?: string
          provider_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_provider_participants_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_provider_participants_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_providers: {
        Row: {
          company: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          provider_name: string
          specialties: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          provider_name: string
          specialties?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          provider_name?: string
          specialties?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_providers_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_providers_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_report_preferences: {
        Row: {
          created_at: string | null
          criteria: Json
          id: string
          report_type: string
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          id?: string
          report_type: string
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          id?: string
          report_type?: string
          staff_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_report_preferences_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_restrictive_practice_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ic_role_permissions: {
        Row: {
          access_control: Database["public"]["Enums"]["ic_access_level_enum"]
          activity_log: Database["public"]["Enums"]["ic_access_level_enum"]
          admin_compliance: Database["public"]["Enums"]["ic_access_level_enum"]
          admin_onboarding: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at: string | null
          created_by: string | null
          employees: Database["public"]["Enums"]["ic_access_level_enum"]
          house_activity_log: Database["public"]["Enums"]["ic_access_level_enum"]
          house_checklist_history: Database["public"]["Enums"]["ic_access_level_enum"]
          house_checklists: Database["public"]["Enums"]["ic_access_level_enum"]
          house_management: Database["public"]["Enums"]["ic_access_level_enum"]
          house_operations: Database["public"]["Enums"]["ic_access_level_enum"]
          house_resources: Database["public"]["Enums"]["ic_access_level_enum"]
          house_staff: Database["public"]["Enums"]["ic_access_level_enum"]
          houses: Database["public"]["Enums"]["ic_access_level_enum"]
          id: string
          incident_management: Database["public"]["Enums"]["ic_access_level_enum"]
          leave_requests: Database["public"]["Enums"]["ic_access_level_enum"]
          master_lists: Database["public"]["Enums"]["ic_access_level_enum"]
          my_leave: Database["public"]["Enums"]["ic_access_level_enum"]
          my_roster: Database["public"]["Enums"]["ic_access_level_enum"]
          my_timesheets: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_activity_log: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_behaviour: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_clinical_trackers: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_contacts: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_documents: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_emergency: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_goals: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_mealtime: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_medical_routine: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_medications: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_shift_notes: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_support_needs: Database["public"]["Enums"]["ic_access_level_enum"]
          participants: Database["public"]["Enums"]["ic_access_level_enum"]
          reporting_clinical: Database["public"]["Enums"]["ic_access_level_enum"]
          reporting_compliance: Database["public"]["Enums"]["ic_access_level_enum"]
          reporting_operational: Database["public"]["Enums"]["ic_access_level_enum"]
          role_id: string
          roster_board: Database["public"]["Enums"]["ic_access_level_enum"]
          shift_routines: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_activity_log: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_availability: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_compliance: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_documents: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_emergency: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_employment: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_leave: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_onboarding: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_qualifications: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_roster: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_training: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_warnings: Database["public"]["Enums"]["ic_access_level_enum"]
          timesheets: Database["public"]["Enums"]["ic_access_level_enum"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          access_control?: Database["public"]["Enums"]["ic_access_level_enum"]
          activity_log?: Database["public"]["Enums"]["ic_access_level_enum"]
          admin_compliance?: Database["public"]["Enums"]["ic_access_level_enum"]
          admin_onboarding?: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at?: string | null
          created_by?: string | null
          employees?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_activity_log?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_checklist_history?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_checklists?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_management?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_operations?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_resources?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_staff?: Database["public"]["Enums"]["ic_access_level_enum"]
          houses?: Database["public"]["Enums"]["ic_access_level_enum"]
          id?: string
          incident_management?: Database["public"]["Enums"]["ic_access_level_enum"]
          leave_requests?: Database["public"]["Enums"]["ic_access_level_enum"]
          master_lists?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_leave?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_roster?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_timesheets?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_activity_log?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_behaviour?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_clinical_trackers?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_contacts?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_documents?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_emergency?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_goals?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_mealtime?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_medical_routine?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_medications?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_shift_notes?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_support_needs?: Database["public"]["Enums"]["ic_access_level_enum"]
          participants?: Database["public"]["Enums"]["ic_access_level_enum"]
          reporting_clinical?: Database["public"]["Enums"]["ic_access_level_enum"]
          reporting_compliance?: Database["public"]["Enums"]["ic_access_level_enum"]
          reporting_operational?: Database["public"]["Enums"]["ic_access_level_enum"]
          role_id: string
          roster_board?: Database["public"]["Enums"]["ic_access_level_enum"]
          shift_routines?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_activity_log?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_availability?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_compliance?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_documents?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_emergency?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_employment?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_leave?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_onboarding?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_qualifications?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_roster?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_training?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_warnings?: Database["public"]["Enums"]["ic_access_level_enum"]
          timesheets?: Database["public"]["Enums"]["ic_access_level_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          access_control?: Database["public"]["Enums"]["ic_access_level_enum"]
          activity_log?: Database["public"]["Enums"]["ic_access_level_enum"]
          admin_compliance?: Database["public"]["Enums"]["ic_access_level_enum"]
          admin_onboarding?: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at?: string | null
          created_by?: string | null
          employees?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_activity_log?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_checklist_history?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_checklists?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_management?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_operations?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_resources?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_staff?: Database["public"]["Enums"]["ic_access_level_enum"]
          houses?: Database["public"]["Enums"]["ic_access_level_enum"]
          id?: string
          incident_management?: Database["public"]["Enums"]["ic_access_level_enum"]
          leave_requests?: Database["public"]["Enums"]["ic_access_level_enum"]
          master_lists?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_leave?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_roster?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_timesheets?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_activity_log?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_behaviour?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_clinical_trackers?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_contacts?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_documents?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_emergency?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_goals?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_mealtime?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_medical_routine?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_medications?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_shift_notes?: Database["public"]["Enums"]["ic_access_level_enum"]
          participant_support_needs?: Database["public"]["Enums"]["ic_access_level_enum"]
          participants?: Database["public"]["Enums"]["ic_access_level_enum"]
          reporting_clinical?: Database["public"]["Enums"]["ic_access_level_enum"]
          reporting_compliance?: Database["public"]["Enums"]["ic_access_level_enum"]
          reporting_operational?: Database["public"]["Enums"]["ic_access_level_enum"]
          role_id?: string
          roster_board?: Database["public"]["Enums"]["ic_access_level_enum"]
          shift_routines?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_activity_log?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_availability?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_compliance?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_documents?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_emergency?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_employment?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_leave?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_onboarding?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_qualifications?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_roster?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_training?: Database["public"]["Enums"]["ic_access_level_enum"]
          staff_warnings?: Database["public"]["Enums"]["ic_access_level_enum"]
          timesheets?: Database["public"]["Enums"]["ic_access_level_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_role_permissions_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_role_permissions_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: true
            referencedRelation: "ic_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_roles: {
        Row: {
          assigned_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          permissions: string[] | null
          role_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          assigned_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          permissions?: string[] | null
          role_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          assigned_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          permissions?: string[] | null
          role_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_roles_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_roles_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_seizure_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_seizure_types_master_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_seizure_types_master_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_service_participants: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          participant_id: string
          service_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          participant_id: string
          service_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          participant_id?: string
          service_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_service_participants_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_service_participants_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_participants_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ic_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_service_staff: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          service_id: string
          staff_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          service_id: string
          staff_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          service_id?: string
          staff_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_service_staff_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_service_staff_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_staff_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ic_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_services: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          service_name: string
          status: string | null
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          service_name: string
          status?: string | null
          type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          service_name?: string
          status?: string | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_services_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_services_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_shift_assigned_checklists: {
        Row: {
          assignment_title: string
          checklist_id: string
          created_at: string | null
          created_by: string | null
          house_id: string | null
          id: string
          shift_id: string | null
          shift_template_id: string | null
          sort_order: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          assignment_title: string
          checklist_id: string
          created_at?: string | null
          created_by?: string | null
          house_id?: string | null
          id?: string
          shift_id?: string | null
          shift_template_id?: string | null
          sort_order?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          assignment_title?: string
          checklist_id?: string
          created_at?: string | null
          created_by?: string | null
          house_id?: string | null
          id?: string
          shift_id?: string | null
          shift_template_id?: string | null
          sort_order?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_shift_assigned_checklists_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_shift_assigned_checklists_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assigned_checklists_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assigned_checklists_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assigned_checklists_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "ic_staff_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assigned_checklists_shift_type_id_fkey"
            columns: ["shift_template_id"]
            isOneToOne: false
            referencedRelation: "ic_house_shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_shift_notes: {
        Row: {
          adl_supports: string | null
          behaviour_intensity_id: string | null
          behaviour_notes: string | null
          behaviour_observed: boolean | null
          behaviour_type_id: string | null
          bowel_amount_id: string | null
          bowel_assistance_id: string | null
          bowel_bristol_scale: number | null
          bowel_movement_occurred: boolean | null
          bowel_notes: string | null
          bowel_time: string | null
          capacity_building_goals: string | null
          community_access_occurred: boolean | null
          community_activity_type: string | null
          community_engagement_level: string | null
          community_location: string | null
          community_notes: string | null
          created_at: string | null
          created_by: string | null
          domestic_tasks: string | null
          full_note: string | null
          house_id: string | null
          hygiene_grooming_id: string | null
          hygiene_notes: string | null
          hygiene_observed_concerns: string | null
          hygiene_oral_care_id: string | null
          hygiene_shower_id: string | null
          hygiene_support_required: boolean | null
          hygiene_toileting_id: string | null
          id: string
          meal_provided: boolean | null
          mtm_concerns: string | null
          mtm_consistency_correct: boolean | null
          mtm_consistency_notes: string | null
          mtm_diet_type_id: string | null
          mtm_fluid_intake_id: string | null
          mtm_fluid_intake_notes: string | null
          mtm_fluids_id: string | null
          mtm_meal_intake_id: string | null
          mtm_meal_intake_notes: string | null
          mtm_meal_provided: boolean | null
          mtm_notes: string | null
          mtm_positioning_appropriate: boolean | null
          mtm_positioning_notes: string | null
          mtm_supervision_notes: string | null
          mtm_supervision_required: boolean | null
          mtm_swallowing_concerns_id: string | null
          mtm_texture_correct: boolean | null
          mtm_texture_notes: string | null
          notes: string | null
          nutrition_assistance_needed: string | null
          nutrition_fluids_intake: string | null
          nutrition_intake_id: string | null
          nutrition_meal_type_id: string | null
          nutrition_notes: string | null
          nutrition_refusal_alternatives: string | null
          overall_presentation: string | null
          participant_id: string | null
          pbs_outcome: string | null
          pbs_strategies_details: string | null
          pbs_strategies_used: boolean | null
          pbs_when_used: string | null
          prn_description: string | null
          prn_medication_given: boolean | null
          reference_id: string | null
          regular_medication_status: string | null
          restrictive_practices_status: string | null
          risk_description: string | null
          risks_observed: boolean | null
          seizure_description: string | null
          seizure_duration_minutes: number | null
          seizure_emergency_services: boolean | null
          seizure_injury_description: string | null
          seizure_injury_occurred: boolean | null
          seizure_notes: string | null
          seizure_occurred: boolean | null
          seizure_time_started: string | null
          seizure_type_id: string | null
          shift_id: string | null
          shift_summary: string | null
          shift_time: string | null
          shift_type: Database["public"]["Enums"]["ic_shift_period_enum"] | null
          sleep_occurred: boolean | null
          sleep_quality_id: string | null
          sleep_start_time: string | null
          sleep_support_required: string | null
          sleep_type_id: string | null
          sleep_wake_time: string | null
          staff_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["ic_status_enum"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          adl_supports?: string | null
          behaviour_intensity_id?: string | null
          behaviour_notes?: string | null
          behaviour_observed?: boolean | null
          behaviour_type_id?: string | null
          bowel_amount_id?: string | null
          bowel_assistance_id?: string | null
          bowel_bristol_scale?: number | null
          bowel_movement_occurred?: boolean | null
          bowel_notes?: string | null
          bowel_time?: string | null
          capacity_building_goals?: string | null
          community_access_occurred?: boolean | null
          community_activity_type?: string | null
          community_engagement_level?: string | null
          community_location?: string | null
          community_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          domestic_tasks?: string | null
          full_note?: string | null
          house_id?: string | null
          hygiene_grooming_id?: string | null
          hygiene_notes?: string | null
          hygiene_observed_concerns?: string | null
          hygiene_oral_care_id?: string | null
          hygiene_shower_id?: string | null
          hygiene_support_required?: boolean | null
          hygiene_toileting_id?: string | null
          id?: string
          meal_provided?: boolean | null
          mtm_concerns?: string | null
          mtm_consistency_correct?: boolean | null
          mtm_consistency_notes?: string | null
          mtm_diet_type_id?: string | null
          mtm_fluid_intake_id?: string | null
          mtm_fluid_intake_notes?: string | null
          mtm_fluids_id?: string | null
          mtm_meal_intake_id?: string | null
          mtm_meal_intake_notes?: string | null
          mtm_meal_provided?: boolean | null
          mtm_notes?: string | null
          mtm_positioning_appropriate?: boolean | null
          mtm_positioning_notes?: string | null
          mtm_supervision_notes?: string | null
          mtm_supervision_required?: boolean | null
          mtm_swallowing_concerns_id?: string | null
          mtm_texture_correct?: boolean | null
          mtm_texture_notes?: string | null
          notes?: string | null
          nutrition_assistance_needed?: string | null
          nutrition_fluids_intake?: string | null
          nutrition_intake_id?: string | null
          nutrition_meal_type_id?: string | null
          nutrition_notes?: string | null
          nutrition_refusal_alternatives?: string | null
          overall_presentation?: string | null
          participant_id?: string | null
          pbs_outcome?: string | null
          pbs_strategies_details?: string | null
          pbs_strategies_used?: boolean | null
          pbs_when_used?: string | null
          prn_description?: string | null
          prn_medication_given?: boolean | null
          reference_id?: string | null
          regular_medication_status?: string | null
          restrictive_practices_status?: string | null
          risk_description?: string | null
          risks_observed?: boolean | null
          seizure_description?: string | null
          seizure_duration_minutes?: number | null
          seizure_emergency_services?: boolean | null
          seizure_injury_description?: string | null
          seizure_injury_occurred?: boolean | null
          seizure_notes?: string | null
          seizure_occurred?: boolean | null
          seizure_time_started?: string | null
          seizure_type_id?: string | null
          shift_id?: string | null
          shift_summary?: string | null
          shift_time?: string | null
          shift_type?:
            | Database["public"]["Enums"]["ic_shift_period_enum"]
            | null
          sleep_occurred?: boolean | null
          sleep_quality_id?: string | null
          sleep_start_time?: string | null
          sleep_support_required?: string | null
          sleep_type_id?: string | null
          sleep_wake_time?: string | null
          staff_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["ic_status_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          adl_supports?: string | null
          behaviour_intensity_id?: string | null
          behaviour_notes?: string | null
          behaviour_observed?: boolean | null
          behaviour_type_id?: string | null
          bowel_amount_id?: string | null
          bowel_assistance_id?: string | null
          bowel_bristol_scale?: number | null
          bowel_movement_occurred?: boolean | null
          bowel_notes?: string | null
          bowel_time?: string | null
          capacity_building_goals?: string | null
          community_access_occurred?: boolean | null
          community_activity_type?: string | null
          community_engagement_level?: string | null
          community_location?: string | null
          community_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          domestic_tasks?: string | null
          full_note?: string | null
          house_id?: string | null
          hygiene_grooming_id?: string | null
          hygiene_notes?: string | null
          hygiene_observed_concerns?: string | null
          hygiene_oral_care_id?: string | null
          hygiene_shower_id?: string | null
          hygiene_support_required?: boolean | null
          hygiene_toileting_id?: string | null
          id?: string
          meal_provided?: boolean | null
          mtm_concerns?: string | null
          mtm_consistency_correct?: boolean | null
          mtm_consistency_notes?: string | null
          mtm_diet_type_id?: string | null
          mtm_fluid_intake_id?: string | null
          mtm_fluid_intake_notes?: string | null
          mtm_fluids_id?: string | null
          mtm_meal_intake_id?: string | null
          mtm_meal_intake_notes?: string | null
          mtm_meal_provided?: boolean | null
          mtm_notes?: string | null
          mtm_positioning_appropriate?: boolean | null
          mtm_positioning_notes?: string | null
          mtm_supervision_notes?: string | null
          mtm_supervision_required?: boolean | null
          mtm_swallowing_concerns_id?: string | null
          mtm_texture_correct?: boolean | null
          mtm_texture_notes?: string | null
          notes?: string | null
          nutrition_assistance_needed?: string | null
          nutrition_fluids_intake?: string | null
          nutrition_intake_id?: string | null
          nutrition_meal_type_id?: string | null
          nutrition_notes?: string | null
          nutrition_refusal_alternatives?: string | null
          overall_presentation?: string | null
          participant_id?: string | null
          pbs_outcome?: string | null
          pbs_strategies_details?: string | null
          pbs_strategies_used?: boolean | null
          pbs_when_used?: string | null
          prn_description?: string | null
          prn_medication_given?: boolean | null
          reference_id?: string | null
          regular_medication_status?: string | null
          restrictive_practices_status?: string | null
          risk_description?: string | null
          risks_observed?: boolean | null
          seizure_description?: string | null
          seizure_duration_minutes?: number | null
          seizure_emergency_services?: boolean | null
          seizure_injury_description?: string | null
          seizure_injury_occurred?: boolean | null
          seizure_notes?: string | null
          seizure_occurred?: boolean | null
          seizure_time_started?: string | null
          seizure_type_id?: string | null
          shift_id?: string | null
          shift_summary?: string | null
          shift_time?: string | null
          shift_type?:
            | Database["public"]["Enums"]["ic_shift_period_enum"]
            | null
          sleep_occurred?: boolean | null
          sleep_quality_id?: string | null
          sleep_start_time?: string | null
          sleep_support_required?: string | null
          sleep_type_id?: string | null
          sleep_wake_time?: string | null
          staff_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["ic_status_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_shift_notes_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_shift_notes_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_behaviour_intensity_id_fkey"
            columns: ["behaviour_intensity_id"]
            isOneToOne: false
            referencedRelation: "ic_behaviour_intensity_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_behaviour_type_id_fkey"
            columns: ["behaviour_type_id"]
            isOneToOne: false
            referencedRelation: "ic_behaviour_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_bowel_amount_id_fkey"
            columns: ["bowel_amount_id"]
            isOneToOne: false
            referencedRelation: "ic_bowel_amounts_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_bowel_assistance_id_fkey"
            columns: ["bowel_assistance_id"]
            isOneToOne: false
            referencedRelation: "ic_bowel_assistance_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_hygiene_grooming_id_fkey"
            columns: ["hygiene_grooming_id"]
            isOneToOne: false
            referencedRelation: "ic_hygiene_levels_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_hygiene_oral_care_id_fkey"
            columns: ["hygiene_oral_care_id"]
            isOneToOne: false
            referencedRelation: "ic_hygiene_levels_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_hygiene_shower_id_fkey"
            columns: ["hygiene_shower_id"]
            isOneToOne: false
            referencedRelation: "ic_hygiene_levels_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_hygiene_toileting_id_fkey"
            columns: ["hygiene_toileting_id"]
            isOneToOne: false
            referencedRelation: "ic_hygiene_levels_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_mtm_diet_type_id_fkey"
            columns: ["mtm_diet_type_id"]
            isOneToOne: false
            referencedRelation: "ic_mtm_diet_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_mtm_fluid_intake_id_fkey"
            columns: ["mtm_fluid_intake_id"]
            isOneToOne: false
            referencedRelation: "ic_mtm_fluid_intake_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_mtm_fluids_id_fkey"
            columns: ["mtm_fluids_id"]
            isOneToOne: false
            referencedRelation: "ic_mtm_fluids_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_mtm_meal_intake_id_fkey"
            columns: ["mtm_meal_intake_id"]
            isOneToOne: false
            referencedRelation: "ic_mtm_meal_intake_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_mtm_swallowing_concerns_id_fkey"
            columns: ["mtm_swallowing_concerns_id"]
            isOneToOne: false
            referencedRelation: "ic_mtm_swallowing_concerns_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_nutrition_intake_id_fkey"
            columns: ["nutrition_intake_id"]
            isOneToOne: false
            referencedRelation: "ic_nutrition_intake_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_nutrition_meal_type_id_fkey"
            columns: ["nutrition_meal_type_id"]
            isOneToOne: false
            referencedRelation: "ic_nutrition_meal_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_seizure_type_id_fkey"
            columns: ["seizure_type_id"]
            isOneToOne: false
            referencedRelation: "ic_seizure_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_sleep_quality_id_fkey"
            columns: ["sleep_quality_id"]
            isOneToOne: false
            referencedRelation: "ic_sleep_quality_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_shift_notes_sleep_type_id_fkey"
            columns: ["sleep_type_id"]
            isOneToOne: false
            referencedRelation: "ic_sleep_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_notes_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_notes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_notes_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "ic_staff_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_notes_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_shift_participants: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          participant_id: string
          shift_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          participant_id: string
          shift_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          participant_id?: string
          shift_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_shift_participants_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_shift_participants_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_participants_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "ic_staff_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_shift_template_checklists: {
        Row: {
          checklist_id: string
          created_at: string | null
          created_by: string | null
          id: string
          shift_template_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          checklist_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          shift_template_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          checklist_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          shift_template_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_shift_template_checklists_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_shift_template_checklists_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_template_checklists_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_shift_template_default_checklists: {
        Row: {
          checklist_id: string
          created_at: string | null
          created_by: string | null
          id: string
          shift_template_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          checklist_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          shift_template_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          checklist_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          shift_template_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_shift_template_default_checklists_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_shift_template_default_checklists_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_type_default_checklists_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "ic_house_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_type_default_checklists_shift_type_id_fkey"
            columns: ["shift_template_id"]
            isOneToOne: false
            referencedRelation: "ic_house_shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_sleep_quality_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_sleep_quality_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_sleep_quality_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_sleep_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_sleep_types_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_sleep_types_master_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff: {
        Row: {
          address: string | null
          allergies: string | null
          auth_user_id: string | null
          availability: string | null
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          department_id: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_type_id: string | null
          hire_date: string | null
          hobbies: string | null
          id: string
          manager_id: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          role_id: string | null
          separation_date: string | null
          staff_name: string | null
          status: Database["public"]["Enums"]["ic_status_enum"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          auth_user_id?: string | null
          availability?: string | null
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type_id?: string | null
          hire_date?: string | null
          hobbies?: string | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          role_id?: string | null
          separation_date?: string | null
          staff_name?: string | null
          status?: Database["public"]["Enums"]["ic_status_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          auth_user_id?: string | null
          availability?: string | null
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type_id?: string | null
          hire_date?: string | null
          hobbies?: string | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          role_id?: string | null
          separation_date?: string | null
          staff_name?: string | null
          status?: Database["public"]["Enums"]["ic_status_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_staff_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_staff_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "ic_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_employment_type_id_fkey"
            columns: ["employment_type_id"]
            isOneToOne: false
            referencedRelation: "ic_employment_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ic_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff_availability: {
        Row: {
          created_at: string | null
          created_by: string | null
          day_of_week: number | null
          end_date: string | null
          end_time: string
          id: string
          is_active: boolean
          is_available: boolean
          notes: string | null
          staff_id: string
          start_date: string | null
          start_time: string
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          day_of_week?: number | null
          end_date?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          notes?: string | null
          staff_id: string
          start_date?: string | null
          start_time?: string
          type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          day_of_week?: number | null
          end_date?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          notes?: string | null
          staff_id?: string
          start_date?: string | null
          start_time?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff_compliance: {
        Row: {
          comments: string | null
          completion_date: string | null
          compliance_type_id: string
          created_at: string | null
          created_by: string | null
          document_number: string | null
          expiry_date: string | null
          id: string
          staff_id: string
          status:
            | Database["public"]["Enums"]["ic_compliance_status_enum"]
            | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          comments?: string | null
          completion_date?: string | null
          compliance_type_id: string
          created_at?: string | null
          created_by?: string | null
          document_number?: string | null
          expiry_date?: string | null
          id?: string
          staff_id: string
          status?:
            | Database["public"]["Enums"]["ic_compliance_status_enum"]
            | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          comments?: string | null
          completion_date?: string | null
          compliance_type_id?: string
          created_at?: string | null
          created_by?: string | null
          document_number?: string | null
          expiry_date?: string | null
          id?: string
          staff_id?: string
          status?:
            | Database["public"]["Enums"]["ic_compliance_status_enum"]
            | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_staff_compliance_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_staff_compliance_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_staff_compliance_compliance_type_id_fkey"
            columns: ["compliance_type_id"]
            isOneToOne: false
            referencedRelation: "ic_compliance_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_compliance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff_compliance_documents: {
        Row: {
          comments: string | null
          created_at: string | null
          created_by: string | null
          document_number: string | null
          document_type: string | null
          expiry_date: string | null
          file_name: string | null
          file_path: string | null
          id: string
          points: number
          staff_compliance_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          created_by?: string | null
          document_number?: string | null
          document_type?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          points: number
          staff_compliance_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          created_by?: string | null
          document_number?: string | null
          document_type?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          points?: number
          staff_compliance_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_staff_compliance_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_staff_compliance_documents_document_type_fkey"
            columns: ["document_type"]
            isOneToOne: false
            referencedRelation: "ic_id_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_staff_compliance_documents_staff_compliance_id_fkey"
            columns: ["staff_compliance_id"]
            isOneToOne: false
            referencedRelation: "ic_staff_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_staff_compliance_documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff_document_roles: {
        Row: {
          access_level: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at: string | null
          created_by: string | null
          document_id: string
          id: string
          role_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at?: string | null
          created_by?: string | null
          document_id: string
          id?: string
          role_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at?: string | null
          created_by?: string | null
          document_id?: string
          id?: string
          role_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_staff_document_roles_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_staff_document_roles_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_staff_document_roles_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ic_staff_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_staff_document_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ic_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff_documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          staff_id: string
          updated_at: string | null
          updated_by: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          staff_id: string
          updated_at?: string | null
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          staff_id?: string
          updated_at?: string | null
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_staff_documents_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_staff_documents_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff_onboarding: {
        Row: {
          comments: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_complete: boolean
          onboarding_item_id: string
          staff_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_complete?: boolean
          onboarding_item_id: string
          staff_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_complete?: boolean
          onboarding_item_id?: string
          staff_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_staff_onboarding_item_id_fkey"
            columns: ["onboarding_item_id"]
            isOneToOne: false
            referencedRelation: "ic_onboarding_items_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_staff_onboarding_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff_qualifications: {
        Row: {
          created_at: string
          created_by: string | null
          date_completed: string | null
          expiry_date: string | null
          file_name: string | null
          file_path: string | null
          id: string
          institution: string | null
          staff_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_completed?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          institution?: string | null
          staff_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_completed?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          institution?: string | null
          staff_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_staff_qualifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff_shifts: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          end_time: string
          house_id: string | null
          id: string
          notes: string | null
          shift_template: string
          shift_template_id: string | null
          staff_id: string | null
          start_date: string
          start_time: string
          template_item_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          end_time: string
          house_id?: string | null
          id?: string
          notes?: string | null
          shift_template?: string
          shift_template_id?: string | null
          staff_id?: string | null
          start_date: string
          start_time: string
          template_item_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          end_time?: string
          house_id?: string | null
          id?: string
          notes?: string | null
          shift_template?: string
          shift_template_id?: string | null
          staff_id?: string | null
          start_date?: string
          start_time?: string
          template_item_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_staff_shifts_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_staff_shifts_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_shift_type_id_fkey"
            columns: ["shift_template_id"]
            isOneToOne: false
            referencedRelation: "ic_house_shift_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff_training: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          date_completed: string | null
          description: string | null
          expiry_date: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          provider: string | null
          staff_id: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          date_completed?: string | null
          description?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          provider?: string | null
          staff_id?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          date_completed?: string | null
          description?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          provider?: string | null
          staff_id?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_staff_training_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_staff_training_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_training_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_timesheets: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          break_minutes: number
          clock_in: string
          clock_out: string
          created_at: string
          created_by: string | null
          id: string
          incident_tag: boolean
          late_submission: boolean
          notes: string | null
          overtime_explanation: string | null
          overtime_hours: number
          rejection_reason: string | null
          shift_id: string | null
          shift_notes_text: string | null
          sick_shift: boolean
          staff_id: string
          status: string
          submitted_at: string | null
          travel_km: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number
          clock_in: string
          clock_out: string
          created_at?: string
          created_by?: string | null
          id?: string
          incident_tag?: boolean
          late_submission?: boolean
          notes?: string | null
          overtime_explanation?: string | null
          overtime_hours?: number
          rejection_reason?: string | null
          shift_id?: string | null
          shift_notes_text?: string | null
          sick_shift?: boolean
          staff_id: string
          status?: string
          submitted_at?: string | null
          travel_km?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number
          clock_in?: string
          clock_out?: string
          created_at?: string
          created_by?: string | null
          id?: string
          incident_tag?: boolean
          late_submission?: boolean
          notes?: string | null
          overtime_explanation?: string | null
          overtime_hours?: number
          rejection_reason?: string | null
          shift_id?: string | null
          shift_notes_text?: string | null
          sick_shift?: boolean
          staff_id?: string
          status?: string
          submitted_at?: string | null
          travel_km?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_timesheets_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_timesheets_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "ic_staff_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_user_roles: {
        Row: {
          assigned_date: string | null
          created_at: string | null
          created_by: string | null
          id: string
          permissions: Json | null
          role_name: string
          staff_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          assigned_date?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          permissions?: Json | null
          role_name: string
          staff_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          assigned_date?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          permissions?: Json | null
          role_name?: string
          staff_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_user_roles_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_user_roles_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ic_jwt_get_perm: { Args: { p_module: string }; Returns: string }
      ic_jwt_get_role_id: { Args: never; Returns: string }
      ic_jwt_get_staff_id: { Args: never; Returns: string }
      ic_jwt_has_house: { Args: { p_house_id: string }; Returns: boolean }
      ic_jwt_has_house_internal: {
        Args: { p_house_id: string }
        Returns: boolean
      }
      ic_jwt_is_admin: { Args: never; Returns: boolean }
      ic_jwt_manages_staff: { Args: { p_staff_id: string }; Returns: boolean }
    }
    Enums: {
      ic_access_level_enum:
        | "full"
        | "context_read_write"
        | "context_read_only"
        | "read_only"
        | "none"
      ic_compliance_status_enum: "complete" | "in_progress" | "not_applicable"
      ic_shift_period_enum:
        | "morning"
        | "day"
        | "night"
        | "all"
        | "afternoon"
        | "evening"
        | "sleepover"
      ic_status_enum: "draft" | "active" | "inactive" | "archived"
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
      ic_access_level_enum: [
        "full",
        "context_read_write",
        "context_read_only",
        "read_only",
        "none",
      ],
      ic_compliance_status_enum: ["complete", "in_progress", "not_applicable"],
      ic_shift_period_enum: [
        "morning",
        "day",
        "night",
        "all",
        "afternoon",
        "evening",
        "sleepover",
      ],
      ic_status_enum: ["draft", "active", "inactive", "archived"],
    },
  },
} as const
