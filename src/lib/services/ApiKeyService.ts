import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { ApiKeyDto } from "../../types";

/**
 * Service for managing user API keys
 * Handles generating, retrieving, and revoking API keys
 */
export class ApiKeyService {
  constructor(private supabase: SupabaseClient<Database>) {}

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

    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    // TODO - this is a hack to get the user access to the API from MCP
    // right now the "API_KEY" works only during the active session, we should find a better way to do this
    const jsonData = JSON.stringify({
      access_token: session?.access_token,
      refresh_token: session?.refresh_token,
    });
    const base64Key = Buffer.from(jsonData, "utf-8").toString("base64");

    const { data: apiKey, error } = await this.supabase
      .from("api_keys")
      .insert({
        user_id: userId,
        key: base64Key,
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
