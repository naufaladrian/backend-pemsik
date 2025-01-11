import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { turso } from '../turso';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const jwtSecret = `${process.env.JWT_SECRET}`;

const options = {
    public_id: `report_images/report_${Date.now()}`,
    folder: 'report_images',
    unique_filename: true,
    use_filename: true,
};

export const reportController = new Elysia({ prefix: '/reports' })
    // Tambahkan plugin JWT di aplikasi
    .use(
        jwt({
            secret: jwtSecret,
            expiresIn: '1d',
        })
    )

    // Mendapatkan semua laporan atau laporan berdasarkan radius
    .get('/', async ({ query }) => {
        if (query.latitude && query.longitude && query.radius) {
            const latitude = Number(query.latitude);
            const longitude = Number(query.longitude);
            const radius = Number(query.radius);

            if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
                return { error: 'Invalid query parameters' };
            }

            const reports = await turso.execute({
                sql: `SELECT * FROM reports WHERE (latitude BETWEEN ? AND ?) AND (longitude BETWEEN ? AND ?)`,
                args: [
                    latitude - radius,
                    latitude + radius,
                    longitude - radius,
                    longitude + radius,
                ],
            });

            return reports.rows; // Mengembalikan baris hasil query
        }

        const allReports = await turso.execute('SELECT * FROM reports');
        return allReports.rows; // Mengembalikan semua baris
    })

    // Membuat laporan baru (auth required)
    .post(
        '/',
        async ({ headers, body, jwt }) => {
            const token = headers?.authorization?.split(" ")[1];
            const user = await jwt.verify(token);

            if (!user || !user.id) {
                return { error: 'Unauthorized' };
            }

            const arrayBuffer = await body.photo.arrayBuffer();
            const fileBuffer = Buffer.from(arrayBuffer);


            const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    options,
                    (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                        if (error) return reject(error);
                        if (result) resolve(result);
                    }
                );
                uploadStream.end(fileBuffer);
            });

            console.log('Image uploaded to Cloudinary:', uploadResult.secure_url);


            await turso.execute({
                sql: `
                INSERT INTO reports (id, user_id, latitude, longitude, description, photo_url, title)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                args: [
                    crypto.randomUUID(),
                    user.id, // ID pengguna dari token
                    parseFloat(body.latitude), // Convert to number
                    parseFloat(body.longitude), // Convert to number
                    body.description,
                    uploadResult.secure_url, // Use the URL from the upload result
                    body.title,
                ],
            });

            return { success: true };
        },
        {
            body: t.Object({
                latitude: t.String(),
                longitude: t.String(),
                description: t.String(),
                photo: t.File(),
                title: t.String(),
            }),
        }
    )

    // Memperbarui status laporan berdasarkan ID (auth required)
    .patch(
        '/:id',
        async ({ params, headers, body, jwt }) => {
            const token = headers?.authorization?.split(" ")[1];
            const user = await jwt.verify(token);

            if (!user || !user.id) {
                return { error: 'Unauthorized' };
            }

            const { id } = params;
            const { status } = body;


            const updateArgs = [status, id];
            const updateSql = 'UPDATE reports SET status = ? WHERE id = ?';

            await turso.execute({
                sql: updateSql,
                args: updateArgs,
            });

            return { success: true };
        },
        {
            body: t.Object({
                status: t.String(),
            }),
        }
    )

    // Mendapatkan laporan berdasarkan ID (auth required)
    .get(
        '/:id',
        async ({ params }) => {


            const { id } = params;

            const result = await turso.execute({
                sql: 'SELECT * FROM reports WHERE id = ?',
                args: [id],
            });

            const report = result.rows[0];

            if (!report) {
                return { error: 'Report not found' };
            }

            return report; // Mengembalikan laporan berdasarkan ID
        }
    )

    // Menghapus laporan berdasarkan ID (auth required)
    .delete(
        '/:id',
        async ({ params, headers, jwt }) => {
            const token = headers?.authorization?.split(" ")[1];
            const user = await jwt.verify(token);

            if (!user || !user.id) {
                return { error: 'Unauthorized' };
            }

            const { id } = params;

            // Periksa apakah laporan ada
            const result = await turso.execute({
                sql: 'SELECT * FROM reports WHERE id = ?',
                args: [id],
            });

            const report = result.rows[0];

            if (!report) {
                return { error: 'Report not found' };
            }

            // Hapus laporan
            await turso.execute({
                sql: 'DELETE FROM reports WHERE id = ?',
                args: [id],
            });

            return { success: true }; // Mengembalikan pesan sukses
        }
    );
