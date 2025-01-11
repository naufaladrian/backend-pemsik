import { Elysia, t } from 'elysia';
import bcrypt from 'bcrypt';
import { jwt } from '@elysiajs/jwt'
import { turso } from '../turso';

export const authController = new Elysia({ prefix: '/auth' })
    .use(
        jwt({
            secret: `${process.env.JWT_SECRET}`,
            expiresIn: '1d',
        })
    )
    .post(
        '/register',
        async ({ body }) => {
            const hashedPassword = await bcrypt.hash(body.password, 10);

            await turso.execute({
                sql: `INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)`,
                args: [crypto.randomUUID(), body.name, body.email, hashedPassword]
            });

            return { success: true };
        },
        {
            body: t.Object({
                name: t.String(),
                email: t.String(),
                password: t.String(),
            }),
        }
    )
    .post(
        '/login',
        async ({ body, jwt }) => {
            const result = await turso.execute({
                sql: 'SELECT * FROM users WHERE email = ?',
                args: [body.email],
            });

            const user = result.rows[0]; // Ambil user pertama dari hasil query

            // Validasi email dan password
            if (!user || !(await bcrypt.compare(body.password, String(user.password_hash)))) {
                return { error: 'Invalid credentials' };
            }

            // Pastikan nilai di-convert menjadi string atau number
            const userId = String(user.id); // Konversi id menjadi string
            const userEmail = String(user.email); // Konversi email menjadi string

            // Buat token menggunakan context.jwt.sign
            const token = await jwt.sign({
                id: userId,
                email: userEmail,
            });

            // Return token dan informasi user
            return {
                token,
                user: {
                    id: userId,
                    name: String(user.name), // Konversi ke string jika diperlukan
                    email: userEmail,
                },
            };
        },
        {
            body: t.Object({
                email: t.String(),
                password: t.String(),
            }),
        }
    );

