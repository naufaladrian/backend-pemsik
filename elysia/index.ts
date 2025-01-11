
import { Elysia, t } from 'elysia'
import { messageController } from './controllers/message'
import { authController } from './controllers/auth'
import { reportController } from './controllers/report'


export const elysiaApp = new Elysia({ prefix: '/api' })
    .use(messageController).onError(({ code, error }) => {
        console.log(code)
        return new Response(JSON.stringify({ error: error.toString() }), { status: 500 })
    })
    .use(authController).onError(({ code, error }) => {
        console.log(code)
        return new Response(JSON.stringify({ error: error.toString() }), { status: 500 })
    })
    .use(reportController).onError(({ code, error }) => {
        console.log(code)
        return new Response(JSON.stringify({ error: error.toString() }), { status: 500 })
    })



export type TElysiaApp = typeof elysiaApp