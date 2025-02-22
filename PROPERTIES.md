# Properties of user-info-logger

This document outlines the properties and interfaces used in the user-info-logger library.

## `IpInfo` Interface

The `IpInfo` interface represents the structure of IP address information.

| Property             | Type     | Description                                   |
|----------------------|----------|-----------------------------------------------|
| ip                   | string   | The IP address of the user.                   |
| network              | string   | The network of the IP address.                |
| version              | string   | The version of the IP address.                |
| city                 | string   | The city associated with the IP address.      |
| region               | string   | The region associated with the IP address.    |
| region_code          | string   | The region code associated with the IP address.|
| country              | string   | The country associated with the IP address.   |
| country_name         | string   | The name of the country associated with the IP address.|
| country_code         | string   | The ISO country code associated with the IP address.|
| country_code_iso3    | string   | The ISO3 country code associated with the IP address.|
| country_capital      | string   | The capital of the country associated with the IP address.|
| country_tld          | string   | The top-level domain of the country associated with the IP address.|
| continent_code       | string   | The continent code associated with the IP address.|
| in_eu                | boolean  | Indicates whether the IP address is in the EU (European Union).|
| postal               | string   | The postal code associated with the IP address.|
| latitude             | number   | The latitude coordinate of the IP address location.|
| longitude            | number   | The longitude coordinate of the IP address location.|
| timezone             | string   | The timezone of the IP address location.      |
| utc_offset           | string   | The UTC offset of the IP address location.    |
| country_calling_code | string   | The country calling code associated with the IP address.|
| currency             | string   | The currency used in the country associated with the IP address.|
| currency_name        | string   | The name of the currency used in the country associated with the IP address.|
| languages            | string[] | An array of languages spoken in the country associated with the IP address.|
| country_area         | number   | The area of the country associated with the IP address.|
| country_population   | number   | The population of the country associated with the IP address.|
| asn                  | string   | The autonomous system number associated with the IP address.|
| org                  | string   | The organization associated with the IP address.|

## `GeolocationInfo` Interface

The `GeolocationInfo` interface represents the structure of geolocation information.

| Property             | Type     | Description                                   |
|----------------------|----------|-----------------------------------------------|
| ip                   | string   | The IP address of the user.                   |
| country_code         | string   | The country code associated with the IP address.|
| country_name         | string   | The name of the country associated with the IP address.|
| region_code          | string   | The region code associated with the IP address.|
| region_name          | string   | The name of the region associated with the IP address.|
| city                 | string   | The city associated with the IP address.      |
| zip_code             | string   | The ZIP code associated with the IP address.  |
| time_zone            | string   | The timezone of the IP address location.      |
| latitude             | number   | The latitude coordinate of the IP address location.|
| longitude            | number   | The longitude coordinate of the IP address location.|
| metro_code           | number   | The metro code associated with the IP address.|

## `SystemInfo` Interface

The `SystemInfo` interface represents the structure of system information.

| Property             | Type     | Description                                   |
|----------------------|----------|-----------------------------------------------|
| userAgent            | string   | The user agent string of the browser.        |
| platform             | string   | The platform of the user's device.           |
| languages            | string[] | An array of languages configured in the user's browser.|
| cookieEnabled        | boolean  | Indicates whether cookies are enabled in the user's browser.|
| doNotTrack           | string \| null | The Do Not Track status of the user's browser.|
| screenWidth          | number   | The width of the user's screen in pixels.    |
| screenHeight         | number   | The height of the user's screen in pixels.   |
| colorDepth           | number   | The color depth of the user's screen.        |
| timeZone             | string   | The timezone configured in the user's browser.|
| browserPlugins       | any[]    | An array of browser plugins installed in the user's browser.|
| javaEnabled          | boolean  | Indicates whether Java is enabled in the user's browser.|
| battery              | { charging: boolean; level: number } \| null | Battery information of the user's device, if available.|
| hardwareConcurrency  | number   | The number of logical processors available to run threads on the user's device.|
| deviceMemory         | number   | The amount of memory installed on the user's device.|
| webGLRenderer        | string   | The WebGL renderer information of the user's device.|

These interfaces define the structure of the data objects used in the user-info-logger library. You can use these interfaces to ensure consistency when working with user information in your applications.
