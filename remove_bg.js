const { Jimp } = require('jimp');
const fs = require('fs');

async function processImages() {
    const images = [
        'apps/client/public/images/illus_about.png',
        'apps/client/public/images/illus_b2b.png',
        'apps/client/public/images/illus_blog.png',
        'apps/client/public/images/illus_contact.png',
        'apps/client/public/images/illus_faq.png',
        'apps/client/public/images/illus_service.png'
    ];

    const jimpInstance = Jimp || require('jimp');

    for (const imgPath of images) {
        try {
            console.log(`Processing ${imgPath}...`);
            if (!fs.existsSync(imgPath)) {
                console.log(`File not found: ${imgPath}`);
                continue;
            }

            const image = await jimpInstance.read(imgPath);

            // Convert to transparent where the background is white
            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                const r = this.bitmap.data[idx + 0];
                const g = this.bitmap.data[idx + 1];
                const b = this.bitmap.data[idx + 2];

                // If the pixel is close to white, make it transparent
                if (r > 230 && g > 230 && b > 230) {
                    this.bitmap.data[idx + 3] = 0; // Alpha channel to 0
                }
            });

            // Overwrite the original image
            await image.writeAsync(imgPath);
            console.log(`Success! Updated ${imgPath}`);
        } catch (err) {
            console.error(`Error processing ${imgPath}:`, err);
        }
    }
}

processImages();
