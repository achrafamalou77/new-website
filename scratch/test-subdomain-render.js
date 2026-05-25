const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/',
  method: 'GET',
  headers: {
    'Host': 'goldenbird.localhost:3000'
  }
};

console.log("Sending GET request to local dev server with Host: goldenbird.localhost:3000...");

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`BODY LENGTH: ${body.length} bytes`);
    if (body.includes("Sahara Golden Dunes Expedition")) {
      console.log("✅ SUCCESS: Found trip 'Sahara Golden Dunes Expedition' in the HTML response!");
    } else {
      console.log("❌ FAILURE: Could not find trip 'Sahara Golden Dunes Expedition' in the HTML!");
    }
    if (body.includes("Cinematic Bejaia Coastal Getaway")) {
      console.log("✅ SUCCESS: Found trip 'Cinematic Bejaia Coastal Getaway' in the HTML response!");
    } else {
      console.log("❌ FAILURE: Could not find trip 'Cinematic Bejaia Coastal Getaway' in the HTML!");
    }
    if (body.includes("GoldenBird Voyages E.U.R.L") || body.includes("GoldenBird Travel Agency")) {
      console.log("✅ SUCCESS: Found agency name in the HTML response!");
    } else {
      console.log("❌ FAILURE: Could not find agency name in the HTML!");
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
