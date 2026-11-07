export type Table = { n: number; name: string; x: number; y: number };
export type WeddingConfig = { names: string; date: string; venue: string; address: string; mapUrl: string; deadline: string; tablesPublished: boolean; scheduleConfirmed: boolean; timeline: { time: string; title: string; detail: string }[]; tables: Table[]; example: boolean; giftEnabled:boolean; giftHolder:string; giftIban:string };
export const defaults: WeddingConfig = {
 names:'Andrea + Alberto', date:'2027-09-16', venue:'El lugar de la celebración', address:'Ubicación pendiente de los novios', mapUrl:'', deadline:'', tablesPublished:false, scheduleConfirmed:false, example:false, giftEnabled:false, giftHolder:'', giftIban:'',
 timeline:[{time:'17:30',title:'El sí, quiero',detail:'La ceremonia'},{time:'19:00',title:'Chin, chin',detail:'Cóctel y abrazos'},{time:'21:00',title:'A la mesa',detail:'Una cena con nuestra gente'},{time:'23:00',title:'Hasta que el cuerpo aguante',detail:'La fiesta'}],
 tables:Array.from({length:12},(_,i)=>({n:i+1,name:i===6?'Los Olivos':`Mesa ${i+1}`,x:17+(i%4)*22,y:22+Math.floor(i/4)*29}))
};

export function normalizeIban(value:string){return value.replace(/\s/g,'').toUpperCase();}
export function validIban(value:string){const iban=normalizeIban(value);if(!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)||(iban.startsWith('ES')&&iban.length!==24))return false;const moved=iban.slice(4)+iban.slice(0,4);let mod=0;for(const c of moved){for(const digit of (/[A-Z]/.test(c)?String(c.charCodeAt(0)-55):c))mod=(mod*10+Number(digit))%97;}return mod===1;}
