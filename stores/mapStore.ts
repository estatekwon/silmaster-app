import { create } from "zustand";
import type { MarkerData, FilterState, LayerType, MapType, MeasureMode } from "@/types";

interface Layers {
  factory_register: boolean;
  factory_tx: boolean;
  land_tx: boolean;
}

interface MapStore {
  layers: Layers;
  filters: FilterState;
  selectedMarker: MarkerData | null;
  zoomLevel: number;
  markers: MarkerData[];
  loading: boolean;
  mapType: MapType;
  useDistrict: boolean;
  measureMode: MeasureMode;

  toggleLayer: (layer: LayerType) => void;
  setFilter: (key: keyof FilterState, value: string) => void;
  selectMarker: (marker: MarkerData | null) => void;
  setZoom: (zoom: number) => void;
  setMarkers: (markers: MarkerData[]) => void;
  setLoading: (loading: boolean) => void;
  resetFilters: () => void;
  setMapType: (type: MapType) => void;
  toggleDistrict: () => void;
  setMeasureMode: (mode: MeasureMode) => void;
}

const defaultFilters: FilterState = {
  sigungu: "",
  industryType: "",
  areaMin: "",
  areaMax: "",
  priceMin: "",
  priceMax: "",
  yearFrom: "",
  yearTo: "",
  dateFrom: "",
  dateTo: "",
};

export const useMapStore = create<MapStore>((set) => ({
  layers: {
    factory_register: true,
    factory_tx: false,
    land_tx: false,
  },
  filters: defaultFilters,
  selectedMarker: null,
  zoomLevel: 9,
  markers: [],
  loading: false,
  mapType: "ROADMAP",
  useDistrict: false,
  measureMode: "none",

  toggleLayer: (layer) =>
    set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  selectMarker: (marker) => set({ selectedMarker: marker }),

  setZoom: (zoomLevel) => set({ zoomLevel }),

  setMarkers: (markers) => set({ markers }),

  setLoading: (loading) => set({ loading }),

  resetFilters: () => set({ filters: defaultFilters }),

  setMapType: (mapType) => set({ mapType }),

  toggleDistrict: () => set((s) => ({ useDistrict: !s.useDistrict })),

  setMeasureMode: (measureMode) => set({ measureMode }),
}));
