import type { TElysiaApp } from '@/elysia'
import { treaty } from '@elysiajs/eden'

export const elysia = treaty<TElysiaApp>(`${process.env.NEXT_PUBLIC_API_URL}`, {
    fetch: {
        next: { revalidate: 0 }
    },
})

