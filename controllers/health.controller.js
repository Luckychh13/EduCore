import getDBStatus from "../database/db"

export const checkHealth = async(req,res) => {
    try {
        const dbStatus = getDBStatus();
    
        const healthStatus = {
            status:'ok',
            timestamp: new Date().toISOString(),
            services: {
                database:{
                    status:dbStatus.isConnected ? 'healthy' : 'unhealthy',
                    details:{
                        ...dbStatus,
                        readyState: getReadyStateText(dbStatus.readyState)
                    }
                },
                server:{
                    status:'healthy',
                    uptime:process.uptime(),
                    memoryUsage:process.memoryUsage()
                }
            }
        }
    
        const httpStatus = healthStatus.services.database.status === 'healthy' ? 200 : 503
    
        res.status(httpStatus).json(healthStatus)

    } catch (error) {
        console.error('Healthcheck failed',error);
        res.status(500).json({
            status:'Error',
            timestamp: new Date().toISOString(),
            error:error.message,
        })
    }
}


function getReadyStateText(state){
    switch (state) {
        case 0: return 'disconnected';
        case 1: return 'connected';
        case 2: return 'connecting';
        case 3: return 'disconnected';

        default: return 'unknown'

    }
}