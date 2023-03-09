import {
  GatewayActivity,
  GatewayActivityAssets as ActivityAssets,
  GatewayActivityButton as ActivityButton,
  GatewayActivityTimestamps as ActivityTimestamps,
  ActivityFlags,
  ActivityType,
} from "discord-api-types/v10";

export { ActivityFlags, ActivityType, ActivityAssets, ActivityButton, ActivityTimestamps };

export type Activity = Omit<GatewayActivity, "id" | "created_at"> & {
  metadata?: {
    button_urls?: string[];
  };
};
