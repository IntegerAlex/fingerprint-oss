import Hasty from 'hasty-server';
import {getIpInfo} from './geo';
import dotenv from 'dotenv';
dotenv.config();
const server = new Hasty();
server.cors(true);

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || '123';

// Add OPTIONS handler for the preflight request
server.options('*', (req, res) => {
  // This will handle all OPTIONS requests
  res.handleOptions(req);
});

server.get('/', async(req, res) => {
  const ip = req.ip;
  
  // Skip API key check for OPTIONS requests
  if (req.method !== 'OPTIONS') {
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
  }

  try{
    const response = await getIpInfo(ip);
    res.json(response);
  }
  catch(e){
    res.json({error: null});
  }
  finally{
    // db.insert({ip: req.ip, date: new Date()});
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

