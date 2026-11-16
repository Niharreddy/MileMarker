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
  /**
   * Where the photo/video was taken, or null when that isn't known — media
   * added to a saved drive/trip after the fact only gets a position if the
   * file itself carries GPS metadata. A pin without one still shows in every
   * photo grid; it just has no marker on the map.
   */
  coordinates: Coordinates | null;
  createdAt: number;
};

export type Note = {
  id: string;
  text: string;
  coordinates: Coordinates;
  createdAt: number;
};
