import './style.css'
import { userInfo } from '../../dist/index.js';

document.addEventListener('DOMContentLoaded', () => {
    const resultElement = document.getElementById('result');

    async function runTest() {
        try {
            const result = await userInfo();
            const formattedResult = JSON.stringify(result, null, 2);
            resultElement.textContent = formattedResult;
        } catch (error) {
            resultElement.classList.add('error');
            resultElement.textContent = `Error: ${error.message}`;
        }
    }

    runTest();
}); 