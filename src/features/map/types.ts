export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Pin = {
  id: string;
  uri: string;
  coordinates: Coordinates;
  createdAt: number;
};

export type Note = {
  id: string;
  text: string;
  coordinates: Coordinates;
  createdAt: number;
};
