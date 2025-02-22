import { userInfo } from '../dist/index.js'

async function runTest() {
    const data = await userInfo();
    console.log(JSON.stringify(data, null, 2));
}

runTest().catch(console.error);
