export interface EVReading {
  id: string;
  timestamp: number;
  batteryPercentage: number;
  estimatedRangeKm: number;
  estimatedTimeHours: number;
  notes?: string;
}

export interface ChargingStation {
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  openNow?: boolean;
  uri?: string;
}

export interface StationResponse {
  text: string;
  stations: ChargingStation[];
}

export interface EstimationResponse {
  rangeKm: number;
  timeLeftHours: number;
  efficiencyNote: string;
}
