import './style.css'
import { userInfo } from '../../dist/index.js';

document.addEventListener('DOMContentLoaded', () => {
    const resultElement = document.getElementById('result');
    
    // Show loading indicator
    resultElement.textContent = 'Running test, please wait...';
    
    async function runTest() {
        try {
            // Get user information
            const result = await userInfo();
            
            // Format the result for display with nice indentation
            const formattedResult = JSON.stringify(result, null, 2);
            
            // Update the result display with just the raw data
            resultElement.textContent = formattedResult;
            
            // Apply styles for clear reading
            addDisplayStyles();
            
        } catch (error) {
            resultElement.classList.add('error');
            resultElement.textContent = `Error: ${error.message}`;
            console.error('Fingerprinting error:', error);
        }
    }
    
    // Add styles for better data display
    function addDisplayStyles() {
        const style = document.createElement('style');
        style.textContent = `
            pre#result {
                font-weight: 500;
                font-size: 14px;
                line-height: 1.5;
                background-color: var(--bg-secondary);
                color: var(--text-primary);
                padding: var(--spacing-md);
                border-radius: var(--border-radius);
                box-shadow: 0 2px 8px var(--shadow-color);
                overflow: auto;
                max-height: 80vh;
                font-family: 'Fira Code', 'Roboto Mono', monospace;
            }
            
            .key-highlight {
                color: var(--accent-color);
                font-weight: 700;
            }
            
            .value-string {
                color: #2e7d32;
            }
            
            .value-number {
                color: #d32f2f;
            }
            
            .value-boolean {
                color: #1976d2;
            }
        `;
        document.head.appendChild(style);
    }

    // Run the test
    runTest();
}); 