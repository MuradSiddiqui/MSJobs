export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      ai_cache: {
        Row: {
          created_at: string
          id: string
          input_hash: string
          model: string
          output: Json
          task: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_hash: string
          model: string
          output: Json
          task: string
        }
        Update: {
          created_at?: string
          id?: string
          input_hash?: string
          model?: string
          output?: Json
          task?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          cache_hit: boolean
          created_at: string
          error: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string
          ok: boolean
          output_tokens: number | null
          task: string
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model: string
          ok?: boolean
          output_tokens?: number | null
          task: string
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string
          ok?: boolean
          output_tokens?: number | null
          task?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_at: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          application_id: string
          changed_at?: string
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          application_id?: string
          changed_at?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string | null
          created_at: string
          id: string
          interview_at: string | null
          job_id: string
          next_action: string | null
          notes: string | null
          opened_apply_at: string | null
          resume_version_id: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: string
          interview_at?: string | null
          job_id: string
          next_action?: string | null
          notes?: string | null
          opened_apply_at?: string | null
          resume_version_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: string
          interview_at?: string | null
          job_id?: string
          next_action?: string | null
          notes?: string | null
          opened_apply_at?: string | null
          resume_version_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ats_type: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          normalized_name: string
          website: string | null
        }
        Insert: {
          ats_type?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          normalized_name: string
          website?: string | null
        }
        Update: {
          ats_type?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          normalized_name?: string
          website?: string | null
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          content: Json
          created_at: string
          id: string
          job_id: string
          kind: Database["public"]["Enums"]["document_kind"]
          language: string | null
          user_id: string
          variant: string | null
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          job_id: string
          kind: Database["public"]["Enums"]["document_kind"]
          language?: string | null
          user_id: string
          variant?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          job_id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          language?: string | null
          user_id?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ignored_jobs: {
        Row: {
          created_at: string
          job_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ignored_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ignored_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_locks: {
        Row: {
          holder: string | null
          locked_until: string
          name: string
        }
        Insert: {
          holder?: string | null
          locked_until: string
          name: string
        }
        Update: {
          holder?: string | null
          locked_until?: string
          name?: string
        }
        Relationships: []
      }
      ingestion_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          jobs_created: number
          jobs_failed: number
          jobs_fetched: number
          jobs_updated: number
          source: string
          started_at: string
          status: Database["public"]["Enums"]["ingestion_status"]
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          jobs_created?: number
          jobs_failed?: number
          jobs_fetched?: number
          jobs_updated?: number
          source: string
          started_at?: string
          status?: Database["public"]["Enums"]["ingestion_status"]
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          jobs_created?: number
          jobs_failed?: number
          jobs_fetched?: number
          jobs_updated?: number
          source?: string
          started_at?: string
          status?: Database["public"]["Enums"]["ingestion_status"]
        }
        Relationships: []
      }
      job_boards: {
        Row: {
          adapter: string
          board_token: string
          company_name: string | null
          consecutive_failures: number
          de_relevant: boolean
          enabled: boolean
          id: string
          last_error: string | null
          last_ok_at: string | null
        }
        Insert: {
          adapter: string
          board_token: string
          company_name?: string | null
          consecutive_failures?: number
          de_relevant?: boolean
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_ok_at?: string | null
        }
        Update: {
          adapter?: string
          board_token?: string
          company_name?: string | null
          consecutive_failures?: number
          de_relevant?: boolean
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_ok_at?: string | null
        }
        Relationships: []
      }
      job_skills: {
        Row: {
          job_id: string
          kind: string
          skill: string
        }
        Insert: {
          job_id: string
          kind?: string
          skill: string
        }
        Update: {
          job_id?: string
          kind?: string
          skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_source_postings: {
        Row: {
          first_seen_at: string
          id: string
          job_id: string
          last_seen_at: string
          raw_payload: Json | null
          source: string
          source_job_id: string
          source_url: string
        }
        Insert: {
          first_seen_at?: string
          id?: string
          job_id: string
          last_seen_at?: string
          raw_payload?: Json | null
          source: string
          source_job_id: string
          source_url: string
        }
        Update: {
          first_seen_at?: string
          id?: string
          job_id?: string
          last_seen_at?: string
          raw_payload?: Json | null
          source?: string
          source_job_id?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_source_postings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          analysis: Json | null
          analysis_version: string | null
          apply_url: string | null
          canonical_url: string
          city: string | null
          company_id: string | null
          content_fingerprint: string
          country: string
          created_at: string
          description_html: string | null
          description_text: string
          effective_posted_at: string | null
          employment_category: Database["public"]["Enums"]["employment_category"]
          first_seen_at: string
          id: string
          is_active: boolean
          language_requirements: Json
          last_seen_at: string
          max_weekly_hours: number | null
          min_weekly_hours: number | null
          normalized_title: string
          posted_at: string | null
          posted_at_is_estimated: boolean
          posting_language: string
          preferred_skills: string[]
          remote_type: Database["public"]["Enums"]["remote_type"]
          required_experience_years: number | null
          required_skills: string[]
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          search_tsv: unknown | null
          seniority: Database["public"]["Enums"]["seniority"]
          source_url: string
          state_code: string | null
          student_enrollment_required: boolean
          title: string
          visa_sponsorship_signal: Database["public"]["Enums"]["visa_signal"]
        }
        Insert: {
          analysis?: Json | null
          analysis_version?: string | null
          apply_url?: string | null
          canonical_url: string
          city?: string | null
          company_id?: string | null
          content_fingerprint: string
          country?: string
          created_at?: string
          description_html?: string | null
          description_text?: string
          effective_posted_at?: string | null
          employment_category?: Database["public"]["Enums"]["employment_category"]
          first_seen_at?: string
          id?: string
          is_active?: boolean
          language_requirements?: Json
          last_seen_at?: string
          max_weekly_hours?: number | null
          min_weekly_hours?: number | null
          normalized_title: string
          posted_at?: string | null
          posted_at_is_estimated?: boolean
          posting_language?: string
          preferred_skills?: string[]
          remote_type?: Database["public"]["Enums"]["remote_type"]
          required_experience_years?: number | null
          required_skills?: string[]
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          search_tsv?: unknown | null
          seniority?: Database["public"]["Enums"]["seniority"]
          source_url: string
          state_code?: string | null
          student_enrollment_required?: boolean
          title: string
          visa_sponsorship_signal?: Database["public"]["Enums"]["visa_signal"]
        }
        Update: {
          analysis?: Json | null
          analysis_version?: string | null
          apply_url?: string | null
          canonical_url?: string
          city?: string | null
          company_id?: string | null
          content_fingerprint?: string
          country?: string
          created_at?: string
          description_html?: string | null
          description_text?: string
          effective_posted_at?: string | null
          employment_category?: Database["public"]["Enums"]["employment_category"]
          first_seen_at?: string
          id?: string
          is_active?: boolean
          language_requirements?: Json
          last_seen_at?: string
          max_weekly_hours?: number | null
          min_weekly_hours?: number | null
          normalized_title?: string
          posted_at?: string | null
          posted_at_is_estimated?: boolean
          posting_language?: string
          preferred_skills?: string[]
          remote_type?: Database["public"]["Enums"]["remote_type"]
          required_experience_years?: number | null
          required_skills?: string[]
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          search_tsv?: unknown | null
          seniority?: Database["public"]["Enums"]["seniority"]
          source_url?: string
          state_code?: string | null
          student_enrollment_required?: boolean
          title?: string
          visa_sponsorship_signal?: Database["public"]["Enums"]["visa_signal"]
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_education: string | null
          full_name: string | null
          headline: string | null
          id: string
          is_approved: boolean
          location: string | null
          onboarding_completed_at: string | null
          preferred_working_language: string | null
          student_status: boolean
          updated_at: string
          visa_sponsorship_needed: boolean
          years_of_experience: number | null
        }
        Insert: {
          created_at?: string
          current_education?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          is_approved?: boolean
          location?: string | null
          onboarding_completed_at?: string | null
          preferred_working_language?: string | null
          student_status?: boolean
          updated_at?: string
          visa_sponsorship_needed?: boolean
          years_of_experience?: number | null
        }
        Update: {
          created_at?: string
          current_education?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          is_approved?: boolean
          location?: string | null
          onboarding_completed_at?: string | null
          preferred_working_language?: string | null
          student_status?: boolean
          updated_at?: string
          visa_sponsorship_needed?: boolean
          years_of_experience?: number | null
        }
        Relationships: []
      }
      resume_versions: {
        Row: {
          byte_size: number
          created_at: string
          extracted_text: string | null
          file_name: string
          id: string
          mime_type: string
          parse_error: string | null
          parse_status: Database["public"]["Enums"]["parse_status"]
          parsed: Json | null
          resume_id: string
          storage_path: string
          user_edited: Json | null
          user_id: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          extracted_text?: string | null
          file_name: string
          id?: string
          mime_type: string
          parse_error?: string | null
          parse_status?: Database["public"]["Enums"]["parse_status"]
          parsed?: Json | null
          resume_id: string
          storage_path: string
          user_edited?: Json | null
          user_id: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          id?: string
          mime_type?: string
          parse_error?: string | null
          parse_status?: Database["public"]["Enums"]["parse_status"]
          parsed?: Json | null
          resume_id?: string
          storage_path?: string
          user_edited?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          created_at: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_job_matches: {
        Row: {
          breakdown: Json
          concerns: string[]
          created_at: string
          explanation: Json | null
          id: string
          job_id: string
          label: Database["public"]["Enums"]["match_label"]
          matched_skills: string[]
          missing_skills: string[]
          overall_score: number
          recommendation: Database["public"]["Enums"]["recommendation"]
          resume_version_id: string | null
          scorer_version: string
          strengths: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          breakdown: Json
          concerns?: string[]
          created_at?: string
          explanation?: Json | null
          id?: string
          job_id: string
          label: Database["public"]["Enums"]["match_label"]
          matched_skills?: string[]
          missing_skills?: string[]
          overall_score: number
          recommendation: Database["public"]["Enums"]["recommendation"]
          resume_version_id?: string | null
          scorer_version?: string
          strengths?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          breakdown?: Json
          concerns?: string[]
          created_at?: string
          explanation?: Json | null
          id?: string
          job_id?: string
          label?: Database["public"]["Enums"]["match_label"]
          matched_skills?: string[]
          missing_skills?: string[]
          overall_score?: number
          recommendation?: Database["public"]["Enums"]["recommendation"]
          resume_version_id?: string | null
          scorer_version?: string
          strengths?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_job_matches_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_job_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          desired_roles: string[]
          employment_types: Database["public"]["Enums"]["employment_category"][]
          excluded_companies: string[]
          excluded_keywords: string[]
          german_states: string[]
          languages: Json
          min_match_score: number
          preferred_cities: string[]
          preferred_keywords: string[]
          relocation_ok: boolean
          remote_preference: Database["public"]["Enums"]["remote_type"][]
          salary_currency: string | null
          salary_min: number | null
          scoring_weights: Json
          seniority_preference: Database["public"]["Enums"]["seniority"] | null
          technical_skills: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          desired_roles?: string[]
          employment_types?: Database["public"]["Enums"]["employment_category"][]
          excluded_companies?: string[]
          excluded_keywords?: string[]
          german_states?: string[]
          languages?: Json
          min_match_score?: number
          preferred_cities?: string[]
          preferred_keywords?: string[]
          relocation_ok?: boolean
          remote_preference?: Database["public"]["Enums"]["remote_type"][]
          salary_currency?: string | null
          salary_min?: number | null
          scoring_weights?: Json
          seniority_preference?: Database["public"]["Enums"]["seniority"] | null
          technical_skills?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          desired_roles?: string[]
          employment_types?: Database["public"]["Enums"]["employment_category"][]
          excluded_companies?: string[]
          excluded_keywords?: string[]
          german_states?: string[]
          languages?: Json
          min_match_score?: number
          preferred_cities?: string[]
          preferred_keywords?: string[]
          relocation_ok?: boolean
          remote_preference?: Database["public"]["Enums"]["remote_type"][]
          salary_currency?: string | null
          salary_min?: number | null
          scoring_weights?: Json
          seniority_preference?: Database["public"]["Enums"]["seniority"] | null
          technical_skills?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_status:
        | "interested"
        | "saved"
        | "preparing"
        | "applied"
        | "recruiter_contact"
        | "interview"
        | "technical_interview"
        | "offer"
        | "rejected"
        | "withdrawn"
      document_kind: "cover_letter" | "cv_variant" | "cv_suggestions"
      employment_category:
        | "hiwi"
        | "working_student"
        | "full_time"
        | "internship"
        | "thesis"
        | "part_time"
        | "contract"
        | "unknown"
      ingestion_status: "running" | "succeeded" | "failed" | "cancelled"
      match_label: "excellent" | "strong" | "good" | "possible" | "weak"
      parse_status: "pending" | "processing" | "succeeded" | "failed"
      recommendation:
        | "apply"
        | "worth_applying"
        | "possible_stretch"
        | "low_priority"
      remote_type: "remote" | "hybrid" | "onsite" | "unknown"
      seniority: "intern" | "junior" | "mid" | "senior" | "lead" | "unknown"
      visa_signal:
        | "unknown"
        | "mentioned"
        | "not_mentioned"
        | "required"
        | "provided"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS"
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
      application_status: [
        "interested",
        "saved",
        "preparing",
        "applied",
        "recruiter_contact",
        "interview",
        "technical_interview",
        "offer",
        "rejected",
        "withdrawn",
      ],
      document_kind: ["cover_letter", "cv_variant", "cv_suggestions"],
      employment_category: [
        "hiwi",
        "working_student",
        "full_time",
        "internship",
        "thesis",
        "part_time",
        "contract",
        "unknown",
      ],
      ingestion_status: ["running", "succeeded", "failed", "cancelled"],
      match_label: ["excellent", "strong", "good", "possible", "weak"],
      parse_status: ["pending", "processing", "succeeded", "failed"],
      recommendation: [
        "apply",
        "worth_applying",
        "possible_stretch",
        "low_priority",
      ],
      remote_type: ["remote", "hybrid", "onsite", "unknown"],
      seniority: ["intern", "junior", "mid", "senior", "lead", "unknown"],
      visa_signal: [
        "unknown",
        "mentioned",
        "not_mentioned",
        "required",
        "provided",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const

