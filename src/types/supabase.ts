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
      categories: {
        Row: {
          created_at: string
          id: string
          nama: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
        }
        Relationships: []
      }
      modifiers: {
        Row: {
          created_at: string
          id: string
          nama: string
          tambahan_harga: number
          tambahan_modal: number
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
          tambahan_harga?: number
          tambahan_modal?: number
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
          tambahan_harga?: number
          tambahan_modal?: number
        }
        Relationships: []
      }
      packagings: {
        Row: {
          created_at: string
          harga_satuan: number
          id: string
          nama: string
        }
        Insert: {
          created_at?: string
          harga_satuan?: number
          id?: string
          nama: string
        }
        Update: {
          created_at?: string
          harga_satuan?: number
          id?: string
          nama?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          id: string
          nama: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          nama: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          nama?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "katalog_jual"
            referencedColumns: ["category_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transaksi: {
        Row: {
          created_at: string
          dibatalkan_at: string | null
          dibayar: number
          id: string
          kasir_id: string | null
          kasir_nama: string
          status: string
          total: number
        }
        Insert: {
          created_at?: string
          dibatalkan_at?: string | null
          dibayar?: number
          id?: string
          kasir_id?: string | null
          kasir_nama: string
          status?: string
          total: number
        }
        Update: {
          created_at?: string
          dibatalkan_at?: string | null
          dibayar?: number
          id?: string
          kasir_id?: string | null
          kasir_nama?: string
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_kasir_id_fkey"
            columns: ["kasir_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaksi_item: {
        Row: {
          harga_satuan: number
          hpp_satuan: number
          id: string
          jumlah_pcs: number | null
          modal_bahan_satuan: number
          modal_kemasan_satuan: number
          nama_produk: string
          nama_varian: string
          qty: number
          transaksi_id: string
          variant_id: string | null
        }
        Insert: {
          harga_satuan: number
          hpp_satuan?: number
          id?: string
          jumlah_pcs?: number | null
          modal_bahan_satuan: number
          modal_kemasan_satuan: number
          nama_produk: string
          nama_varian: string
          qty: number
          transaksi_id: string
          variant_id?: string | null
        }
        Update: {
          harga_satuan?: number
          hpp_satuan?: number
          id?: string
          jumlah_pcs?: number | null
          modal_bahan_satuan?: number
          modal_kemasan_satuan?: number
          nama_produk?: string
          nama_varian?: string
          qty?: number
          transaksi_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_item_transaksi_id_fkey"
            columns: ["transaksi_id"]
            isOneToOne: false
            referencedRelation: "transaksi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "katalog_jual"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "v_hpp_varian"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      transaksi_item_modifier: {
        Row: {
          id: string
          modifier_id: string | null
          nama: string
          tambahan_harga: number
          tambahan_modal: number
          transaksi_item_id: string
        }
        Insert: {
          id?: string
          modifier_id?: string | null
          nama: string
          tambahan_harga: number
          tambahan_modal: number
          transaksi_item_id: string
        }
        Update: {
          id?: string
          modifier_id?: string | null
          nama?: string
          tambahan_harga?: number
          tambahan_modal?: number
          transaksi_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_item_modifier_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "katalog_extra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_item_modifier_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "modifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_item_modifier_transaksi_item_id_fkey"
            columns: ["transaksi_item_id"]
            isOneToOne: false
            referencedRelation: "transaksi_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_item_modifier_transaksi_item_id_fkey"
            columns: ["transaksi_item_id"]
            isOneToOne: false
            referencedRelation: "v_penjualan_item"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_packagings: {
        Row: {
          jumlah: number
          packaging_id: string
          variant_id: string
        }
        Insert: {
          jumlah?: number
          packaging_id: string
          variant_id: string
        }
        Update: {
          jumlah?: number
          packaging_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_packagings_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "packagings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_packagings_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "katalog_jual"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_packagings_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "v_hpp_varian"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_packagings_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      variants: {
        Row: {
          aktif: boolean
          created_at: string
          harga_jual: number
          id: string
          jumlah_pcs: number | null
          modal_bahan: number
          nama: string
          product_id: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          harga_jual?: number
          id?: string
          jumlah_pcs?: number | null
          modal_bahan?: number
          nama: string
          product_id: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          harga_jual?: number
          id?: string
          jumlah_pcs?: number | null
          modal_bahan?: number
          nama?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "katalog_jual"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      katalog_extra: {
        Row: {
          id: string | null
          nama: string | null
          tambahan_harga: number | null
        }
        Insert: {
          id?: string | null
          nama?: string | null
          tambahan_harga?: number | null
        }
        Update: {
          id?: string | null
          nama?: string | null
          tambahan_harga?: number | null
        }
        Relationships: []
      }
      katalog_jual: {
        Row: {
          category_id: string | null
          harga_jual: number | null
          id: string | null
          jumlah_pcs: number | null
          kategori_nama: string | null
          product_id: string | null
          produk_nama: string | null
          varian_nama: string | null
        }
        Relationships: []
      }
      v_hpp_varian: {
        Row: {
          aktif: boolean | null
          harga_jual: number | null
          id: string | null
          jumlah_pcs: number | null
          kemasan: Json | null
          margin: number | null
          modal_bahan: number | null
          modal_kemasan: number | null
          modal_total: number | null
          nama: string | null
          product_id: string | null
          produk_nama: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "katalog_jual"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      v_penjualan_item: {
        Row: {
          created_at: string | null
          daftar_extra: string | null
          extra_harga_satuan: number | null
          extra_modal_satuan: number | null
          harga_satuan: number | null
          hpp_satuan: number | null
          id: string | null
          jumlah_pcs: number | null
          kasir_id: string | null
          kasir_nama: string | null
          laba: number | null
          modal: number | null
          modal_bahan: number | null
          modal_bahan_satuan: number | null
          modal_extra: number | null
          modal_kemasan: number | null
          modal_kemasan_satuan: number | null
          nama_produk: string | null
          nama_varian: string | null
          omzet: number | null
          pakai_extra: boolean | null
          qty: number | null
          status: string | null
          transaksi_id: string | null
          variant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_item_transaksi_id_fkey"
            columns: ["transaksi_id"]
            isOneToOne: false
            referencedRelation: "transaksi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "katalog_jual"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "v_hpp_varian"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_kasir_id_fkey"
            columns: ["kasir_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      batalkan_transaksi: { Args: { p_id: string }; Returns: undefined }
      daftar_pengguna: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
          name: string
          role: string
        }[]
      }
      simpan_transaksi: {
        Args: { p_dibayar: number; p_items: Json }
        Returns: string
      }
      simpan_varian: {
        Args: {
          p_aktif: boolean
          p_harga_jual: number
          p_id: string
          p_jumlah_pcs: number
          p_kemasan: Json
          p_modal_bahan: number
          p_nama: string
          p_product_id: string
        }
        Returns: string
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
    Enums: {},
  },
} as const

