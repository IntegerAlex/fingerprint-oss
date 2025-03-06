//import Hasty from 'hasty-server';
import {getIpInfo} from './geo';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();
//const server = new Hasty();
//server.cors(true);
const server = express();
server.use(cors());
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || '123';

// Add OPTIONS handler for the preflight request
//server.options('*', (req, res) => {
  // This will handle all OPTIONS requests
//  res.handleOptions(req);
//});
const getClientIp = (req) => {
  // Check for x-forwarded-for header (used if behind a proxy or load balancer)
  const forwardedIps = req.headers['x-forwarded-for'];
  
  // If x-forwarded-for is present, use the first IP (the original client IP)
  if (forwardedIps) {
    // x-forwarded-for contains a list of IPs, take the first one
    const ipArray = forwardedIps.split(',');
    return ipArray[0]; // First IP in the list is the client IP
  } else {
    // If no x-forwarded-for, fall back to socket's remoteAddress
    return req.socket.remoteAddress;
  }
};
server.get('/', async(req, res) => {
 	const ip = getClientIp(req); 
  // Skip API key check for OPTIONS requests
    if(req.headers === undefined){
      console.log('headers undefined');
      res.status(403).send('Forbidden');
      return;
    }
    if(!req.headers['x-api-key']){
      console.log('api key not found');
      res.status(403).send('Forbidden');
      return;
    }
    if(req.headers['x-api-key'] !== API_KEY){
      console.log('api key not match');
      res.status(403).send('Forbidden');
      return;
  }

  try{
    const response = await getIpInfo(ip);
    res.json(response);
  }
  catch(e){
    res.json({error: null})
  }
  finally{
    // db.insert({ip: req.ip, date: new Date()});
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

