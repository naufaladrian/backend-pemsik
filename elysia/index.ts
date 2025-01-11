
import { Elysia, t } from 'elysia'
import { messageController } from './controllers/message'
import { authController } from './controllers/auth'
import { reportController } from './controllers/report'
import cors from '@elysiajs/cors'


export const elysiaApp = new Elysia({ prefix: '/api' })
    .use(cors({
        origin: '*', // Allow all origins for development. Change this to your React app's origin in production.
        methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Allow specific HTTP methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
    }))
    .use(messageController)
    .use(authController)
    .use(reportController)
    .onError(({ code, error }) => {
        console.log(code);
        return new Response(JSON.stringify({ error: error.toString() }), { status: 500 });
    });



export type TElysiaApp = typeof elysiaApp