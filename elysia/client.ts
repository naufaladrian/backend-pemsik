import type { TElysiaApp } from '@/elysia'
import { treaty } from '@elysiajs/eden'

const url = process.env.URL_DOMAIN ?? "localhost:3000"
export const elysia = treaty<TElysiaApp>(url)