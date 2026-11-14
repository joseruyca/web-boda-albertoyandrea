import type { Metadata } from 'next';
import './globals.css';
import './identity.css';
import './natural.css';
import './materials.css';
import './botanical-pages.css';
import './stationery.css';
import './herbarium.css';
import './album-social.css';
import './desktop.css';
import './experience.css';
export const metadata:Metadata={title:'Andrea + Alberto · Nos casamos',description:'Nos haría mucha ilusión celebrarlo contigo. Invitación, confirmación de asistencia y recuerdos compartidos.',robots:{index:false,follow:false},referrer:'no-referrer',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="es"><head><link rel="preload" href="/assets/cormorant-garamond-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="preload" href="/assets/sans.woff" as="font" type="font/woff" crossOrigin="anonymous"/></head><body>{children}</body></html>;}
