import { test, expect } from '@playwright/test';
test("fingerprint-oss geoInfo test",async({page})=>{
	await page.goto("http://localhost:8080/");

	page.on("console",(msg)=>console.log(`BROWSER LOG: ${msg.text()}`));

	await page.waitForFunction(()=>window.test !== undefined,{timeout:60000});

	const testData = await page.evaluate(()=>window.test);	

	expect(testData).toBeDefined();

	expect(typeof testData).toBe("object");


	expect(testData.geolocation).toBeDefined();
	
	expect(testData.geolocation.ip).toBeDefined();
	expect(typeof testData.geolocation.ip).toBe("string");

	expect(testData.geolocation.city).toBeDefined();
	expect(typeof testData.geolocation.city).toBe("string");

	expect(testData.geolocation.region).toBeDefined();
	expect(typeof testData.geolocation.region.isoCode).toBe("string");
	expect(typeof testData.geolocation.region.name).toBe("string");

	expect(testData.geolocation.country).toBeDefined();
	expect(typeof testData.geolocation.country.isoCode).toBe("string");
	expect(typeof testData.geolocation.country.name).toBe("string");

	expect(testData.geolocation.location).toBeDefined();
	expect(typeof testData.geolocation.location.latitude).toBe("number");
	expect(typeof testData.geolocation.location.longitude).toBe("number");
	expect(typeof testData.geolocation.location.accuracyRadius).toBe("number");	
	expect(typeof testData.geolocation.location.timeZone).toBe("string");

	expect(testData.geolocation.traits).toBeDefined();
	expect(typeof testData.geolocation.traits.isAnonymous).toBe("boolean");
	expect(typeof testData.geolocation.traits.isAnonymousProxy).toBe("boolean");
	expect(typeof testData.geolocation.traits.isAnonymousVpn).toBe("boolean");
	expect(typeof testData.geolocation.traits.network).toBe("string");

})
