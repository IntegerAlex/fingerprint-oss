import Hasty from 'hasty-server';
import {getIpInfo} from './geo';
const server = new Hasty();
server.cors(true);

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || '123';


 
server.get('/', (req, res) => {
	if(req.headers['x-api-key'] !== API_KEY){ 
		res.status(403).send('Forbidden');
		return;
	}
	try{
		res.json(getIpInfo(req.ip));	
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
