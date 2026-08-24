export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PinMediaType = "photo" | "video";

export type Pin = {
  id: string;
  uri: string;
  mediaType: PinMediaType;
  /** Durable static thumbnail for video pins (grids/map markers can't render a video frame directly). Unset for photos, which are their own thumbnail. */
  thumbnailUri?: string;
  coordinates: Coordinates;
  createdAt: number;
};

export type Note = {
  id: string;
  text: string;
  coordinates: Coordinates;
  createdAt: number;
};
