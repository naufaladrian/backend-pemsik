import Elysia, { t } from "elysia";

export const messageController = new Elysia({ prefix: '/message' })
    .get('/', () => 'Hello From Elysia 🦊')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })