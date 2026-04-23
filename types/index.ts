export type LayerType = "factory_register" | "factory_tx" | "land_tx";

export interface FactoryRegister {
  id: string;
  compny_grp_nm: string;
  administ_inst_nm: string;
  indutype_desc_dtcont: string;
  emply_cnt: string;
  lot_ar: string;
  subfaclt_ar: string;
  factry_scale_div_nm: string;
  factry_regist_de: string;
  refine_roadnm_addr: string;
  lat: number;
  lng: number;
  layer: "factory_register";
}

export interface FactoryTransaction {
  id: string;
  signgu_nm: string;
  emd_li_nm: string;
  contract_day: string;
  prvtuse_ar: string;
  delng_amt: string;
  buldng_wk_purpos_nm: string;
  build_yy: string;
  lat: number;
  lng: number;
  layer: "factory_tx";
}

export interface LandTransaction {
  id: string;
  signgu_nm: string;
  emd_li_nm: string;
  contract_day: string;
  land_delng_ar: string;
  delng_amt: string;
  purpos_region_nm: string;
  landcgr_nm: string;
  lat: number;
  lng: number;
  layer: "land_tx";
}

export type MarkerData = FactoryRegister | FactoryTransaction | LandTransaction;

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export type MapType = "ROADMAP" | "SKYVIEW" | "TERRAIN" | "HYBRID";
export type MeasureMode = "none" | "distance" | "area";

export interface FilterState {
  sigungu: string;
  industryType: string;
  areaMin: string;
  areaMax: string;
  priceMin: string;
  priceMax: string;
  yearFrom: string;
  yearTo: string;
  dateFrom: string;
  dateTo: string;
}
