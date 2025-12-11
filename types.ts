export interface Alumni {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  timestamp?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export enum AppState {
  LOADING,
  READY,
  ERROR
}
