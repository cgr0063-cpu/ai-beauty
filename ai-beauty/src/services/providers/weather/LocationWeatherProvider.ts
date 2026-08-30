import * as Location from "expo-location";
import { WeatherProvider, WeatherReading, DemoWeatherProvider } from "./WeatherProvider";
import { OpenMeteoWeatherProvider } from "./OpenMeteoWeatherProvider";

const demo = new DemoWeatherProvider();
const openMeteo = new OpenMeteoWeatherProvider();

/** Automatic weather is honest: it either returns live device-location weather or throws. */
export class LocationWeatherProvider implements WeatherProvider {
  async getCurrentWeather({ regionCountryCode }: { regionCountryCode: string }): Promise<WeatherReading> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") throw new Error("location-permission-denied");
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    return openMeteo.getCurrentWeather({ regionCountryCode }, { latitude: position.coords.latitude, longitude: position.coords.longitude });
  }
}

export function getWeatherProvider(useAuto: boolean): WeatherProvider {
  return useAuto ? new LocationWeatherProvider() : demo;
}
