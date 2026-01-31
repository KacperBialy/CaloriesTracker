import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { ApiKeyDto } from "../../types";
import { randomBytes } from "crypto";

/**
 * Service for managing user API keys
 * Handles generating, retrieving, and revoking API keys
 */
export class ApiKeyService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Generates a secure random API key
   * @returns A random API key string
   */
  private generateKey(): string {
    return randomBytes(32).toString("hex");
  }

  /**
   * Retrieves the current API key for a user
   * @param userId - The authenticated user's ID
   * @returns The user's API key DTO or null if no key exists
   * @throws Error if the database query fails
   */
  async getUserApiKey(userId: string): Promise<ApiKeyDto | null> {
    const { data: apiKey, error } = await this.supabase
      .from("api_keys")
      .select("id, key, created_at")
      .eq("user_id", userId)
      .single();

    if (error) {
      throw new Error(`Database error fetching api key: ${error.message}`);
    }

    return {
      apiKeyId: apiKey.id,
      key: apiKey.key,
      createdAt: apiKey.created_at ?? "",
    };
  }

  /**
   * Creates a new API key for a user, replacing any existing key
   * @param userId - The authenticated user's ID
   * @returns The newly generated API key DTO
   * @throws Error if the database operation fails
   */
  async generateApiKey(userId: string): Promise<ApiKeyDto> {
    // Delete any existing key for this user
    await this.supabase.from("api_keys").delete().eq("user_id", userId);

    // Generate new key
    const key = this.generateKey();

    // Insert the new key
    const { data: apiKey, error } = await this.supabase
      .from("api_keys")
      .insert({
        user_id: userId,
        key,
      })
      .select("id, key, created_at")
      .single();

    if (error) {
      throw error;
    }

    return {
      apiKeyId: apiKey.id,
      key: apiKey.key,
      createdAt: apiKey.created_at ?? "",
    };
  }

  /**
   * Revokes (deletes) a user's API key
   * @param userId - The authenticated user's ID
   * @throws Error if the database operation fails
   */
  async revokeApiKey(userId: string): Promise<void> {
    const { error } = await this.supabase.from("api_keys").delete().eq("user_id", userId);

    if (error) {
      throw new Error(`Database error revoking api key: ${error.message}`);
    }
  }
}
