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
          user_name?: string | null
        }
        Relationships: []
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
        ]
      }
      ic_branches: {
        Row: {
          address: string | null
          company_name: string | null
          compliance_status: string | null
          created_at: string | null
          email: string | null
          id: string
          last_audit_date: string | null
          manager_name: string | null
          branch_name: string
          next_review_date: string | null
          notes: string | null
          number_of_houses: number | null
          number_of_staff: number | null
          operating_hours: string | null
          phone: string | null
          service_areas: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          compliance_status?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_audit_date?: string | null
          manager_name?: string | null
          name: string
          next_review_date?: string | null
          notes?: string | null
          number_of_houses?: number | null
          number_of_staff?: number | null
          operating_hours?: string | null
          phone?: string | null
          service_areas?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          compliance_status?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_audit_date?: string | null
          manager_name?: string | null
          name?: string
          next_review_date?: string | null
          notes?: string | null
          number_of_houses?: number | null
          number_of_staff?: number | null
          operating_hours?: string | null
          phone?: string | null
          service_areas?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ic_checklist_item_master: {
        Row: {
          created_at: string | null
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
        }
        Insert: {
          created_at?: string | null
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
        }
        Update: {
          created_at?: string | null
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
        ]
      }
      ic_checklist_master: {
        Row: {
          created_at: string | null
          days_of_week: string[] | null
          description: string | null
          id: string
          checklist_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_of_week?: string[] | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_of_week?: string[] | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ic_checklist_schedules: {
        Row: {
          created_at: string | null
          end_date: string | null
          house_checklist_id: string
          house_id: string
          id: string
          is_active: boolean | null
          rrule: string
          start_date: string
          target_shift: Database["public"]["Enums"]["ic_shift_period_enum"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          house_checklist_id: string
          house_id: string
          id?: string
          is_active?: boolean | null
          rrule: string
          start_date: string
          target_shift?: Database["public"]["Enums"]["ic_shift_period_enum"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          house_checklist_id?: string
          house_id?: string
          id?: string
          is_active?: boolean | null
          rrule?: string
          start_date?: string
          target_shift?: Database["public"]["Enums"]["ic_shift_period_enum"]
          updated_at?: string | null
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
        ]
      }
      ic_contact_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          contact_type_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ic_departments: {
        Row: {
          access_level: string | null
          created_at: string | null
          description: string | null
          id: string
          department_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ic_employment_types_master: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          employment_type_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      ic_funding_sources_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          funding_source_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ic_funding_types_master: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          funding_type_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ic_house_calendar_event_attachments: {
        Row: {
          created_at: string | null
          event_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
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
          event_id: string
          id: string
          participant_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          participant_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          participant_id?: string
        }
        Relationships: [
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
          event_id: string
          id: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          staff_id?: string
        }
        Relationships: [
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
          description: string | null
          id: string
          event_type_name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
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
        }
        Relationships: [
          {
            foreignKeyName: "house_calendar_events_checklist_schedule_id_fkey"
            columns: ["checklist_schedule_id"]
            isOneToOne: false
            referencedRelation: "ic_checklist_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
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
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          item_id: string
          mime_type: string | null
          submission_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          item_id: string
          mime_type?: string | null
          submission_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          item_id?: string
          mime_type?: string | null
          submission_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
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
        }
        Insert: {
          checklist_id?: string | null
          created_at?: string | null
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
        }
        Update: {
          checklist_id?: string | null
          created_at?: string | null
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
        }
        Relationships: [
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
          id: string
          is_completed: boolean
          item_id: string
          master_item_id: string | null
          note: string | null
          status: string | null
          submission_id: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean
          item_id: string
          master_item_id?: string | null
          note?: string | null
          status?: string | null
          submission_id: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean
          item_id?: string
          master_item_id?: string | null
          note?: string | null
          status?: string | null
          submission_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
        }
        Insert: {
          calendar_event_id?: string | null
          checklist_id: string
          completed_at?: string | null
          created_at?: string | null
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
        }
        Update: {
          calendar_event_id?: string | null
          checklist_id?: string
          completed_at?: string | null
          created_at?: string | null
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
        }
        Relationships: [
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
          days_of_week: string[] | null
          description: string | null
          house_id: string | null
          id: string
          is_global: boolean | null
          master_id: string | null
          house_checklist_name: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_of_week?: string[] | null
          description?: string | null
          house_id?: string | null
          id?: string
          is_global?: boolean | null
          master_id?: string | null
          name: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_of_week?: string[] | null
          description?: string | null
          house_id?: string | null
          id?: string
          is_global?: boolean | null
          master_id?: string | null
          name?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
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
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          entry_date?: string
          house_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          entry_date?: string
          house_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "house_comms_created_by_fkey"
            columns: ["created_by"]
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
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          house_id: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          house_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          house_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
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
          due_date: string | null
          form_id: string | null
          id: string
          notes: string | null
          participant_id: string | null
          staff_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          form_id?: string | null
          id?: string
          notes?: string | null
          participant_id?: string | null
          staff_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          form_id?: string | null
          id?: string
          notes?: string | null
          participant_id?: string | null
          staff_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
          form_id: string | null
          id: string
          participant_id: string | null
          status: string | null
          submission_data: Json | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          form_id?: string | null
          id?: string
          participant_id?: string | null
          status?: string | null
          submission_data?: Json | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          form_id?: string | null
          id?: string
          participant_id?: string | null
          status?: string | null
          submission_data?: Json | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
          house_id: string | null
          id: string
          is_global: boolean | null
          house_form_name: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          frequency: string
          house_id?: string | null
          id?: string
          is_global?: boolean | null
          name: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          frequency?: string
          house_id?: string | null
          id?: string
          is_global?: boolean | null
          name?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "house_forms_created_by_fkey"
            columns: ["created_by"]
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
          address: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          house_id: string | null
          id: string
          notes: string | null
          phone: string | null
          priority: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          house_id?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          house_id?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "house_resources_created_by_fkey"
            columns: ["created_by"]
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
        }
        Insert: {
          color_theme?: string | null
          created_at?: string | null
          default_end_time?: string | null
          default_start_time?: string | null
          house_id: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          short_name?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          color_theme?: string | null
          created_at?: string | null
          default_end_time?: string | null
          default_start_time?: string | null
          house_id?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          short_name?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
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
          end_date: string | null
          house_id: string
          id: string
          is_primary: boolean | null
          notes: string | null
          staff_id: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          house_id: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          staff_id: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          house_id?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          staff_id?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
          description: string | null
          id: string
          house_type_name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ic_houses: {
        Row: {
          address: string | null
          branch_id: string | null
          capacity: number | null
          created_at: string | null
          current_occupancy: number | null
          general_house_details: string | null
          house_manager: string | null
          house_type_id: string | null
          id: string
          individuals_breakdown: string | null
          is_configured: boolean
          house_name: string
          notes: string | null
          observations: string | null
          participant_dynamics: string | null
          phone: string | null
          setup_step: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          capacity?: number | null
          created_at?: string | null
          current_occupancy?: number | null
          general_house_details?: string | null
          house_manager?: string | null
          house_type_id?: string | null
          id?: string
          individuals_breakdown?: string | null
          is_configured?: boolean
          name: string
          notes?: string | null
          observations?: string | null
          participant_dynamics?: string | null
          phone?: string | null
          setup_step?: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          capacity?: number | null
          created_at?: string | null
          current_occupancy?: number | null
          general_house_details?: string | null
          house_manager?: string | null
          house_type_id?: string | null
          id?: string
          individuals_breakdown?: string | null
          is_configured?: boolean
          name?: string
          notes?: string | null
          observations?: string | null
          participant_dynamics?: string | null
          phone?: string | null
          setup_step?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
      ic_leave_requests: {
        Row: {
          admin_notes: string | null
          attachment_url: string | null
          created_at: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          staff_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          attachment_url?: string | null
          created_at?: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          staff_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          attachment_url?: string | null
          created_at?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          staff_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
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
          id: string
          is_active: boolean
          leave_type_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      ic_medications_master: {
        Row: {
          category: string | null
          common_dosages: string | null
          created_at: string | null
          created_by: string | null
          id: string
          interactions: string | null
          is_active: boolean | null
          medication_name: string
          side_effects: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          common_dosages?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interactions?: string | null
          is_active?: boolean | null
          name: string
          side_effects?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          common_dosages?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interactions?: string | null
          is_active?: boolean | null
          name?: string
          side_effects?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ic_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ic_participant_contacts: {
        Row: {
          address: string | null
          contact_name: string
          contact_type_id: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          participant_id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_name: string
          contact_type_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          participant_id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string
          contact_type_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          participant_id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_contacts_contact_type_id_fkey"
            columns: ["contact_type_id"]
            isOneToOne: false
            referencedRelation: "ic_contact_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_provider_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_restricted: boolean | null
          mime_type: string | null
          participant_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_restricted?: boolean | null
          mime_type?: string | null
          participant_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_restricted?: boolean | null
          mime_type?: string | null
          participant_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_documents_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_forms: {
        Row: {
          created_at: string | null
          form_data: Json | null
          form_title: string
          form_type: string
          id: string
          participant_id: string
          submission_date: string | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_data?: Json | null
          form_title: string
          form_type: string
          id?: string
          participant_id: string
          submission_date?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_data?: Json | null
          form_title?: string
          form_type?: string
          id?: string
          participant_id?: string
          submission_date?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
      ic_participant_funding: {
        Row: {
          allocated_amount: number
          code: string | null
          created_at: string | null
          end_date: string | null
          funding_source_id: string | null
          funding_type_id: string | null
          house_id: string | null
          id: string
          invoice_recipient: string | null
          notes: string | null
          participant_id: string
          remaining_amount: number | null
          status: string | null
          updated_at: string | null
          used_amount: number | null
        }
        Insert: {
          allocated_amount: number
          code?: string | null
          created_at?: string | null
          end_date?: string | null
          funding_source_id?: string | null
          funding_type_id?: string | null
          house_id?: string | null
          id?: string
          invoice_recipient?: string | null
          notes?: string | null
          participant_id: string
          remaining_amount?: number | null
          status?: string | null
          updated_at?: string | null
          used_amount?: number | null
        }
        Update: {
          allocated_amount?: number
          code?: string | null
          created_at?: string | null
          end_date?: string | null
          funding_source_id?: string | null
          funding_type_id?: string | null
          house_id?: string | null
          id?: string
          invoice_recipient?: string | null
          notes?: string | null
          participant_id?: string
          remaining_amount?: number | null
          status?: string | null
          updated_at?: string | null
          used_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_funding_funding_source_id_fkey"
            columns: ["funding_source_id"]
            isOneToOne: false
            referencedRelation: "ic_funding_sources_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_funding_funding_type_id_fkey"
            columns: ["funding_type_id"]
            isOneToOne: false
            referencedRelation: "ic_funding_types_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_funding_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "ic_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_funding_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ic_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_participant_goal_progress: {
        Row: {
          created_at: string | null
          goal_id: string
          id: string
          progress_note: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          id?: string
          progress_note: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          id?: string
          progress_note?: string
          updated_at?: string | null
        }
        Relationships: [
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
          description: string
          goal_type: string
          id: string
          is_active: boolean | null
          participant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          goal_type: string
          id?: string
          is_active?: boolean | null
          participant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          participant_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
        }
        Insert: {
          created_at?: string | null
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
        }
        Update: {
          created_at?: string | null
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
        }
        Relationships: [
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
          dosage: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          medication_id: string | null
          participant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dosage?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          medication_id?: string | null
          participant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dosage?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          medication_id?: string | null
          participant_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
        }
        Relationships: [
          {
            foreignKeyName: "participant_notes_created_by_fkey"
            columns: ["created_by"]
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
        }
        Relationships: [
          {
            foreignKeyName: "participant_restrictive_practices_created_by_fkey"
            columns: ["created_by"]
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
          participant_name: string | null
          natural_disaster_plan: string | null
          ndis_number: string | null
          other_support: string | null
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
          updated_at: string | null
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
          name?: string | null
          natural_disaster_plan?: string | null
          ndis_number?: string | null
          other_support?: string | null
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
          updated_at?: string | null
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
          name?: string | null
          natural_disaster_plan?: string | null
          ndis_number?: string | null
          other_support?: string | null
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
          updated_at?: string | null
        }
        Relationships: [
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
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          page_id: string
          parent_group: string | null
          permission_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          page_id: string
          parent_group?: string | null
          permission_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          page_id?: string
          parent_group?: string | null
          permission_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ic_positions: {
        Row: {
          access_level: string | null
          compliance_requirements: string[] | null
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          compliance_requirements?: string[] | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          compliance_requirements?: string[] | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
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
          id: string
          participant_id: string
          provider_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_id: string
          provider_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_id?: string
          provider_id?: string
        }
        Relationships: [
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
          email: string | null
          id: string
          provider_name: string
          notes: string | null
          phone: string | null
          specialties: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          specialties?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          specialties?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ic_role_permissions: {
        Row: {
          access_control: Database["public"]["Enums"]["ic_access_level_enum"]
          activity_log: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at: string | null
          employees: Database["public"]["Enums"]["ic_access_level_enum"]
          house_checklists: Database["public"]["Enums"]["ic_access_level_enum"]
          houses: Database["public"]["Enums"]["ic_access_level_enum"]
          id: string
          leave_requests: Database["public"]["Enums"]["ic_access_level_enum"]
          master_lists: Database["public"]["Enums"]["ic_access_level_enum"]
          my_leave: Database["public"]["Enums"]["ic_access_level_enum"]
          my_roster: Database["public"]["Enums"]["ic_access_level_enum"]
          my_timesheets: Database["public"]["Enums"]["ic_access_level_enum"]
          participants: Database["public"]["Enums"]["ic_access_level_enum"]
          role_id: string
          roster_board: Database["public"]["Enums"]["ic_access_level_enum"]
          shift_notes: Database["public"]["Enums"]["ic_access_level_enum"]
          shift_routines: Database["public"]["Enums"]["ic_access_level_enum"]
          timesheets: Database["public"]["Enums"]["ic_access_level_enum"]
          updated_at: string | null
        }
        Insert: {
          access_control?: Database["public"]["Enums"]["ic_access_level_enum"]
          activity_log?: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at?: string | null
          employees?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_checklists?: Database["public"]["Enums"]["ic_access_level_enum"]
          houses?: Database["public"]["Enums"]["ic_access_level_enum"]
          id?: string
          leave_requests?: Database["public"]["Enums"]["ic_access_level_enum"]
          master_lists?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_leave?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_roster?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_timesheets?: Database["public"]["Enums"]["ic_access_level_enum"]
          participants?: Database["public"]["Enums"]["ic_access_level_enum"]
          role_id: string
          roster_board?: Database["public"]["Enums"]["ic_access_level_enum"]
          shift_notes?: Database["public"]["Enums"]["ic_access_level_enum"]
          shift_routines?: Database["public"]["Enums"]["ic_access_level_enum"]
          timesheets?: Database["public"]["Enums"]["ic_access_level_enum"]
          updated_at?: string | null
        }
        Update: {
          access_control?: Database["public"]["Enums"]["ic_access_level_enum"]
          activity_log?: Database["public"]["Enums"]["ic_access_level_enum"]
          created_at?: string | null
          employees?: Database["public"]["Enums"]["ic_access_level_enum"]
          house_checklists?: Database["public"]["Enums"]["ic_access_level_enum"]
          houses?: Database["public"]["Enums"]["ic_access_level_enum"]
          id?: string
          leave_requests?: Database["public"]["Enums"]["ic_access_level_enum"]
          master_lists?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_leave?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_roster?: Database["public"]["Enums"]["ic_access_level_enum"]
          my_timesheets?: Database["public"]["Enums"]["ic_access_level_enum"]
          participants?: Database["public"]["Enums"]["ic_access_level_enum"]
          role_id?: string
          roster_board?: Database["public"]["Enums"]["ic_access_level_enum"]
          shift_notes?: Database["public"]["Enums"]["ic_access_level_enum"]
          shift_routines?: Database["public"]["Enums"]["ic_access_level_enum"]
          timesheets?: Database["public"]["Enums"]["ic_access_level_enum"]
          updated_at?: string | null
        }
        Relationships: [
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
          description: string | null
          id: string
          is_active: boolean
          role_name: string
          permissions: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          permissions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          permissions?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ic_service_participants: {
        Row: {
          created_at: string | null
          id: string
          participant_id: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_id: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_id?: string
          service_id?: string
        }
        Relationships: [
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
          id: string
          service_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          service_id: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          service_id?: string
          staff_id?: string
        }
        Relationships: [
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
          description: string | null
          id: string
          service_name: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ic_shift_assigned_checklists: {
        Row: {
          assignment_title: string
          checklist_id: string
          created_at: string | null
          house_id: string | null
          id: string
          shift_id: string | null
          shift_template_id: string | null
          sort_order: number
        }
        Insert: {
          assignment_title: string
          checklist_id: string
          created_at?: string | null
          house_id?: string | null
          id?: string
          shift_id?: string | null
          shift_template_id?: string | null
          sort_order?: number
        }
        Update: {
          assignment_title?: string
          checklist_id?: string
          created_at?: string | null
          house_id?: string | null
          id?: string
          shift_id?: string | null
          shift_template_id?: string | null
          sort_order?: number
        }
        Relationships: [
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
          created_at: string | null
          full_note: string | null
          house_id: string | null
          id: string
          notes: string | null
          participant_id: string | null
          shift_id: string | null
          shift_time: string | null
          staff_id: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_note?: string | null
          house_id?: string | null
          id?: string
          notes?: string | null
          participant_id?: string | null
          shift_id?: string | null
          shift_time?: string | null
          staff_id?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_note?: string | null
          house_id?: string | null
          id?: string
          notes?: string | null
          participant_id?: string | null
          shift_id?: string | null
          shift_time?: string | null
          staff_id?: string | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
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
          id: string
          participant_id: string
          shift_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_id: string
          shift_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_id?: string
          shift_id?: string
        }
        Relationships: [
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
          id: string
          shift_template_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string | null
          id?: string
          shift_template_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string | null
          id?: string
          shift_template_id?: string
        }
        Relationships: [
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
          id: string
          shift_template_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string | null
          id?: string
          shift_template_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string | null
          id?: string
          shift_template_id?: string
        }
        Relationships: [
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
      ic_staff: {
        Row: {
          address: string | null
          allergies: string | null
          auth_user_id: string | null
          availability: string | null
          branch_id: string | null
          comprehensive_car_insurance: boolean | null
          comprehensive_car_insurance_expiry: string | null
          created_at: string | null
          date_of_birth: string | null
          department_id: string | null
          drivers_license: boolean | null
          drivers_license_expiry: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_type_id: string | null
          hire_date: string | null
          hobbies: string | null
          id: string
          manager_id: string | null
          staff_name: string | null
          ndis_code_of_conduct: boolean | null
          ndis_code_of_conduct_expiry: string | null
          ndis_infection_control_training: boolean | null
          ndis_infection_control_training_expiry: string | null
          ndis_orientation_module: boolean | null
          ndis_orientation_module_expiry: string | null
          ndis_worker_screening_check: boolean | null
          ndis_worker_screening_check_expiry: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          role_id: string | null
          separation_date: string | null
          status: Database["public"]["Enums"]["ic_status_enum"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          auth_user_id?: string | null
          availability?: string | null
          branch_id?: string | null
          comprehensive_car_insurance?: boolean | null
          comprehensive_car_insurance_expiry?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          drivers_license?: boolean | null
          drivers_license_expiry?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type_id?: string | null
          hire_date?: string | null
          hobbies?: string | null
          id?: string
          manager_id?: string | null
          name?: string | null
          ndis_code_of_conduct?: boolean | null
          ndis_code_of_conduct_expiry?: string | null
          ndis_infection_control_training?: boolean | null
          ndis_infection_control_training_expiry?: string | null
          ndis_orientation_module?: boolean | null
          ndis_orientation_module_expiry?: string | null
          ndis_worker_screening_check?: boolean | null
          ndis_worker_screening_check_expiry?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          role_id?: string | null
          separation_date?: string | null
          status?: Database["public"]["Enums"]["ic_status_enum"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          auth_user_id?: string | null
          availability?: string | null
          branch_id?: string | null
          comprehensive_car_insurance?: boolean | null
          comprehensive_car_insurance_expiry?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          drivers_license?: boolean | null
          drivers_license_expiry?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type_id?: string | null
          hire_date?: string | null
          hobbies?: string | null
          id?: string
          manager_id?: string | null
          name?: string | null
          ndis_code_of_conduct?: boolean | null
          ndis_code_of_conduct_expiry?: string | null
          ndis_infection_control_training?: boolean | null
          ndis_infection_control_training_expiry?: string | null
          ndis_orientation_module?: boolean | null
          ndis_orientation_module_expiry?: string | null
          ndis_worker_screening_check?: boolean | null
          ndis_worker_screening_check_expiry?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          role_id?: string | null
          separation_date?: string | null
          status?: Database["public"]["Enums"]["ic_status_enum"]
          updated_at?: string | null
        }
        Relationships: [
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
      ic_staff_compliance: {
        Row: {
          completion_date: string | null
          compliance_name: string
          created_at: string | null
          expiry_date: string | null
          id: string
          staff_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          compliance_name: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          staff_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          compliance_name?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          staff_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_compliance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "ic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_staff_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_restricted: boolean | null
          mime_type: string | null
          staff_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_restricted?: boolean | null
          mime_type?: string | null
          staff_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_restricted?: boolean | null
          mime_type?: string | null
          staff_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
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
        }
        Insert: {
          created_at?: string | null
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
        }
        Update: {
          created_at?: string | null
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
        }
        Relationships: [
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
        }
        Relationships: [
          {
            foreignKeyName: "staff_training_created_by_fkey"
            columns: ["created_by"]
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
        }
        Relationships: [
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
          id: string
          permissions: Json | null
          role_name: string
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_date?: string | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role_name: string
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_date?: string | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role_name?: string
          staff_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
      ic_jwt_get_staff_id: { Args: never; Returns: string }
      ic_jwt_has_house: { Args: { p_house_id: string }; Returns: boolean }
      ic_jwt_is_admin: { Args: never; Returns: boolean }
      ic_jwt_manages_staff: { Args: { p_staff_id: string }; Returns: boolean }
      ic_sync_staff_role_to_metadata_for_staff: {
        Args: { p_staff_id: string }
        Returns: undefined
      }
    }
    Enums: {
      ic_access_level_enum:
        | "full"
        | "context_read_write"
        | "context_read_only"
        | "read_only"
        | "none"
      ic_shift_period_enum: "morning" | "day" | "night" | "all"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ic_access_level_enum: [
        "full",
        "context_read_write",
        "context_read_only",
        "read_only",
        "none",
      ],
      ic_shift_period_enum: ["morning", "day", "night", "all"],
      ic_status_enum: ["draft", "active", "inactive", "archived"],
    },
  },
} as const
