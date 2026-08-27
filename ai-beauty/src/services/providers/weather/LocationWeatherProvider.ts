import * as Location from "expo-location";
import { WeatherProvider, WeatherReading, DemoWeatherProvider } from "./WeatherProvider";
import { OpenMeteoWeatherProvider } from "./OpenMeteoWeatherProvider";

const demo = new DemoWeatherProvider();
const openMeteo = new OpenMeteoWeatherProvider();

/**
 * Real live weather path: requests foreground location permission ONLY
 * when the user opts into automatic weather (Profile → weatherAuto —
 * never during onboarding), reads device coordinates, and calls
 * Open-Meteo (free, no key). Falls back to DemoWeatherProvider's seasonal
 * estimate at any failure point — permission denied, location unavailable,
 * offline, or the request failing — so the app never breaks.
 */
export class LocationWeatherProvider implements WeatherProvider {
  async getCurrentWeather({ regionCountryCode }: { regionCountryCode: string }): Promise<WeatherReading> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return demo.getCurrentWeather({ regionCountryCode });

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });

      return openMeteo.getCurrentWeather(
        { regionCountryCode },
        { latitude: position.coords.latitude, longitude: position.coords.longitude }
      );
    } catch {
      return demo.getCurrentWeather({ regionCountryCode });
    }
  }
}

export function getWeatherProvider(useAuto: boolean): WeatherProvider {
  return useAuto ? new LocationWeatherProvider() : demo;
}
