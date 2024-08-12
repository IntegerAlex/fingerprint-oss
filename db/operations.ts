import database from './main'


export async function getDeployments(userName:string){
	return new Promise((resolve, reject) => {
	database.dbQuery(`SELECT * FROM deployments where user_name = ${userName}`)
		.then((res) => {
			resolve(res)
		})
		.catch((err:Error) => {
			reject(err)
		})
	})
}

export async function postDeployment(userName: string, containerId: string) {
    const query = `
        INSERT INTO deployments (user_name, container_id,status)
        VALUES ($1, $2 , 'deployed');
    `;

    try {
        // Use parameterized query to avoid SQL injection and syntax issues
        await database.dbQuery(query, [userName, containerId]);
        console.log("Deployment inserted successfully.");
    } catch (error) {
        console.error('Error inserting deployment:', error);
        throw error; // Re-throw the error to handle it in the calling function
    }
}
export async function deleteDeployment(userName:string, containerId:string){
	database.dbQuery(`DELETE FROM deployments WHERE user_name = ${userName} AND container_id = ${containerId}`)
}
