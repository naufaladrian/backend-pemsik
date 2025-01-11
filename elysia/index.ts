
import { Elysia, t } from 'elysia'
import { messageController } from './controllers/message'
import { authController } from './controllers/auth'
import { reportController } from './controllers/report'
import cors from '@elysiajs/cors'


export const elysiaApp = new Elysia({ prefix: '/api' })
    .use(cors())
    .use(messageController).onError(({ code, error }) => {
        console.log(code)
        return new Response(JSON.stringify({ error: error.toString() }), { status: 500 })
    })
    .use(cors())
    .use(authController).onError(({ code, error }) => {
        console.log(code)
        return new Response(JSON.stringify({ error: error.toString() }), { status: 500 })
    })
    .use(cors())
    .use(reportController).onError(({ code, error }) => {
        console.log(code)
        return new Response(JSON.stringify({ error: error.toString() }), { status: 500 })
    })



export type TElysiaApp = typeof elysiaApp