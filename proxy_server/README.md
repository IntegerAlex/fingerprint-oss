# Proxy + GeoIp2 + Docker


## Description

This application is a Explicit part(Doesn't have part on original source code of package) of fingerprint-oss project. This application is a proxy server that uses the GeoIP2 database to determine the country of origin of the request and then forwards the request to the appropriate server. This application is built using the Hasty-server [https://github.com/IntegerAlex/hasty-server](https://github.com/IntegerAlex/Hasty-server) package.


## LICENSE 
 
The source code is released under GPL v3.0 LICENSE

The GeoIP2 database is not included in the repository and must be downloaded from [https://dev.maxmind.com/geoip/geoip2/geolite2/](https://dev.maxmind.com/geoip/geoip2/geolite2/) and place in the appropriate directory.

## Running the application

`podman run -d -p 8080:8080 --name proxy-container localhost/proxy:latest npm start`

