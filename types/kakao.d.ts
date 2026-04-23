/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace kakao {
  namespace maps {
    function load(callback: () => void): void;

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      getLevel(): number;
      setLevel(level: number): void;
      getCenter(): LatLng;
      getBounds(): LatLngBounds;
      addOverlayMapTypeId(mapTypeId: MapTypeId): void;
      removeOverlayMapTypeId(mapTypeId: MapTypeId): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    class LatLngBounds {
      getSouthWest(): LatLng;
      getNorthEast(): LatLng;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng;
    }

    class CustomOverlay {
      constructor(options: CustomOverlayOptions);
      setMap(map: Map | null): void;
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions);
      open(map: Map, marker: Marker): void;
      close(): void;
    }

    namespace event {
      function addListener(target: any, type: string, handler: (...args: any[]) => void): void;
      function removeListener(target: any, type: string, handler: (...args: any[]) => void): void;
    }

    namespace services {
      class Geocoder {
        addressSearch(address: string, callback: (result: any[], status: Status) => void): void;
      }
      enum Status {
        OK = "OK",
        ZERO_RESULT = "ZERO_RESULT",
        ERROR = "ERROR",
      }
    }

    interface MapOptions {
      center: LatLng;
      level: number;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map;
      image?: MarkerImage;
      title?: string;
    }

    interface CustomOverlayOptions {
      position: LatLng;
      content: string | HTMLElement;
      map?: Map;
      yAnchor?: number;
    }

    interface InfoWindowOptions {
      content: string | HTMLElement;
      removable?: boolean;
    }

    interface MarkerImage {
      // placeholder
    }

    enum MapTypeId {
      ROADMAP = 1,
      SKYVIEW = 2,
      HYBRID = 3,
      TRAFFIC = 4,
      TERRAIN = 5,
      BICYCLE = 6,
    }
  }
}

interface Window {
  kakao: typeof kakao;
}
