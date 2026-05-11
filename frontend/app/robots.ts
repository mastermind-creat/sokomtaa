import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/', 
        '/trader/dashboard/', 
        '/trader/products/', 
        '/trader/reservations/', 
        '/trader/payments/', 
        '/trader/analytics/',
        '/profile/',
        '/reservations/'
      ],
    },
    sitemap: 'https://sokomtaa.co.ke/sitemap.xml',
  };
}
