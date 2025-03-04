import Hasty from 'hasty-server';
import {getIpInfo} from './geo';
import { get } from 'http';
const server = new Hasty();
const PORT = 8080;
server.cors(true);

server.get('/', (req, res) => {
	if(req.headers['x-api-key'] !== '123') {
		res.status(403).send('Forbidden');
		return;
	}
	if(req.headers['x-api-key'] === '123') {
		res.json(getIpInfo(req.ip));	
	}

});


server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);


});
