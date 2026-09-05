import { Season, WeatherCondition, seasonFromDate } from "@/data/context";

export interface WeatherReading {
  condition: WeatherCondition;
  temperatureC: number;
  season: Season;
  source: "demo" | "device-location";
}

export interface WeatherProvider {
  getCurrentWeather(
    opts: { regionCountryCode: string },
    coords?: { latitude: number; longitude: number }
  ): Promise<WeatherReading>;
}

/**
 * Deterministic, offline seasonal estimate used only when the user turns
 * automatic weather OFF. It must never be presented as a live/current reading.
 */
export class DemoWeatherProvider implements WeatherProvider {
  async getCurrentWeather({ regionCountryCode }: { regionCountryCode: string }): Promise<WeatherReading> {
    const southernHemisphere = ["AU", "NZ", "AR", "CL", "ZA", "BR", "UY", "PY"].includes(
      regionCountryCode.toUpperCase()
    );
    const season = seasonFromDate(new Date(), southernHemisphere);
    const map: Record<Season, WeatherReading> = {
      spring: { condition: "warm", temperatureC: 17, season, source: "demo" },
      summer: { condition: "hot", temperatureC: 29, season, source: "demo" },
      autumn: { condition: "windy", temperatureC: 14, season, source: "demo" },
      winter: { condition: "cold", temperatureC: 4, season, source: "demo" },
    };
    return map[season];
  }
}
