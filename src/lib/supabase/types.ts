// Database types generated from the AYSEL schema.
// Keep separate from frontend product types in src/data/products.ts.
//
// Each table entry includes a `Relationships` field (required by the
// GenericTable constraint in @supabase/postgrest-js). Without it the table
// type does not satisfy GenericSchema, Schema resolves to `never`, and every
// .from() call site collapses to `never` arguments.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          existing_product_id: number | null;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          sku: string | null;
          is_active: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          image_url: string;
          alt_text: string | null;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_images"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          colour: string;
          colour_code: string;
          size: string;
          sku: string | null;
          price_override: number | null;
          stock_quantity: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_variants"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["wishlists"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wishlists"]["Insert"]>;
        Relationships: [];
      };
      carts: {
        Row: {
          id: string;
          user_id: string;
          status: "active" | "abandoned" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["carts"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["carts"]["Insert"]>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          variant_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cart_items"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
        Relationships: [];
      };
      shopping_sync_operations: {
        Row: {
          user_id: string;
          operation_type: "cart" | "wishlist";
          operation_id: string;
          payload_hash: string;
          status: "pending" | "completed" | "failed";
          result: Json | null;
          attempt_count: number;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["shopping_sync_operations"]["Row"],
          "status" |
            "result" |
            "attempt_count" |
            "created_at" |
            "updated_at" |
            "completed_at"
        > & {
          status?: "pending" | "completed" | "failed";
          result?: Json | null;
          attempt_count?: number;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["shopping_sync_operations"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, unknown>;
    Functions: {
      canonicalize_shopping_payload: {
        Args: {
          p_operation_type: "cart" | "wishlist";
          p_payload: Json;
        };
        Returns: Json;
      };
      shopping_payload_sha256: {
        Args: {
          p_operation_type: "cart" | "wishlist";
          p_payload: Json;
        };
        Returns: string;
      };
      shopping_reserve_operation: {
        Args: {
          p_operation_type: "cart" | "wishlist";
          p_operation_id: string;
          p_payload: Json;
        };
        Returns: Json;
      };
      shopping_complete_operation: {
        Args: {
          p_operation_type: "cart" | "wishlist";
          p_operation_id: string;
          p_payload: Json;
          p_result: Json;
        };
        Returns: Json;
      };
      shopping_fail_operation: {
        Args: {
          p_operation_type: "cart" | "wishlist";
          p_operation_id: string;
          p_payload: Json;
          p_result: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      cart_status: "active" | "abandoned" | "completed";
    };
  };
}

// Convenience row types
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type WishlistRow = Database["public"]["Tables"]["wishlists"]["Row"];
export type CartRow = Database["public"]["Tables"]["carts"]["Row"];
export type CartItemRow = Database["public"]["Tables"]["cart_items"]["Row"];
export type ShoppingSyncOperationRow =
  Database["public"]["Tables"]["shopping_sync_operations"]["Row"];

// Convenience insert types — used by the cart and wishlist service layer
export type WishlistInsert = Database["public"]["Tables"]["wishlists"]["Insert"];
export type CartInsert = Database["public"]["Tables"]["carts"]["Insert"];
export type CartItemInsert = Database["public"]["Tables"]["cart_items"]["Insert"];
export type CartItemUpdate = Database["public"]["Tables"]["cart_items"]["Update"];

// Enum alias — avoids repeating the string union at call sites
export type CartStatus = Database["public"]["Enums"]["cart_status"];
