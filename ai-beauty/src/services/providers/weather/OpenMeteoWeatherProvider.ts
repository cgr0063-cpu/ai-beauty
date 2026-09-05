import { WeatherProvider, WeatherReading } from "./WeatherProvider";
import { seasonFromDate, WeatherCondition } from "@/data/context";


/**
 * Open-Meteo (open-meteo.com) is a free, public weather API that requires
 * NO API key and has no vendor lock-in — safe to call directly from the
 * client, unlike AI/paid vendors. This is real, live weather with zero
 * configuration required.
 */
function mapWeatherCode(code: number, windKph: number): WeatherCondition {
  if (code >= 71 && code <= 77) return "snowy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return "rainy";
  if (windKph > 30) return "windy";
  return "warm"; // temperature bucket is refined by caller using actual temp
}

export class OpenMeteoWeatherProvider implements WeatherProvider {
  async getCurrentWeather(
    args: { regionCountryCode: string },
    coords?: { latitude: number; longitude: number }
  ): Promise<WeatherReading> {
    if (!coords) throw new Error("weather_coordinates_required");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code,wind_speed_10m`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
      const data = await res.json();
      const temp = data?.current?.temperature_2m;
      const code = data?.current?.weather_code ?? 0;
      const wind = data?.current?.wind_speed_10m ?? 0;
      if (typeof temp !== "number") throw new Error("Open-Meteo: missing temperature");

      let condition = mapWeatherCode(code, wind);
      if (condition === "warm") {
        if (temp >= 27) condition = "hot";
        else if (temp <= 8) condition = "cold";
        else condition = "warm";
      }

      return {
        condition,
        temperatureC: Math.round(temp),
        season: seasonFromDate(new Date()),
        source: "device-location",
      };
    } catch (error) {
      // Never label a seasonal estimate as current live weather. Automatic
      // weather either returns a verified Open-Meteo reading or becomes
      // unavailable so Today's Look can continue without a weather claim.
      throw error instanceof Error ? error : new Error("weather_fetch_failed");
    }
  }
}
