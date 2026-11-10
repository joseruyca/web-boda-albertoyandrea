export type WeddingPhase='auto'|'before'|'during'|'after';
export type StoryMoment={photo:string;caption:string;text:string};
export type PracticalInfo={bus:string;accommodation:string;dressCode:string;contact:string};
export type Prewedding = {venue:string;address:string;mapUrl:string;date:string;startTime:string;endTime:string};
export type Table = { n: number; name: string; x: number; y: number };
export type WeddingConfig = { names: string; date: string; venue: string; address: string; mapUrl: string; dinner:{venue:string;address:string;mapUrl:string;menu:string}; prewedding:Prewedding; deadline: string; tablesPublished: boolean; scheduleConfirmed: boolean; timeline: { time: string; title: string; detail: string }[]; tables: Table[]; example: boolean; giftEnabled:boolean; giftHolder:string; giftIban:string; phase:WeddingPhase; story:StoryMoment[]; practical:PracticalInfo; faq:{question:string;answer:string}[]; thankYou:string };
export const defaults: WeddingConfig = {
 names:'Andrea + Alberto', date:'2027-09-18', venue:'Casa Palacio Huerta del Conde', address:'Ronda de San Francisco, 27 · Cáceres', mapUrl:'https://www.google.com/maps/dir/?api=1&destination=Casa%20Palacio%20Huerta%20del%20Conde%2C%20Ronda%20de%20San%20Francisco%2027%2C%20C%C3%A1ceres', dinner:{venue:'Casa Palacio Huerta del Conde',address:'Ronda de San Francisco, 27 · Cáceres',mapUrl:'https://www.google.com/maps/dir/?api=1&destination=Casa%20Palacio%20Huerta%20del%20Conde%2C%20Ronda%20de%20San%20Francisco%2027%2C%20C%C3%A1ceres',menu:''}, prewedding:{venue:'El Corral de las Cigüeñas',address:'Cuesta de Aldana, 6 · Cáceres',mapUrl:'https://www.google.com/maps/dir/?api=1&destination=El%20Corral%20de%20las%20Cig%C3%BCe%C3%B1as%2C%20Cuesta%20de%20Aldana%206%2C%20C%C3%A1ceres',date:'',startTime:'20:30',endTime:'23:00'}, deadline:'', tablesPublished:false, scheduleConfirmed:false, example:false, giftEnabled:false, giftHolder:'', giftIban:'', phase:'auto', story:[], practical:{bus:'',accommodation:'',dressCode:'',contact:''}, faq:[], thankYou:'Gracias por acompañarnos y por llenar este día de recuerdos.',
 timeline:[{time:'18:30–19:00',title:'El sí, quiero',detail:'Hora orientativa, según el tiempo. Confirmaremos la hora exacta.'},{time:'',title:'Chin, chin',detail:'Cóctel · horario por confirmar'},{time:'',title:'A la mesa',detail:'La cena · horario por confirmar'},{time:'',title:'A bailar',detail:'La fiesta · horario por confirmar'}],
 tables:Array.from({length:12},(_,i)=>({n:i+1,name:i===6?'Los Olivos':`Mesa ${i+1}`,x:17+(i%4)*22,y:22+Math.floor(i/4)*29}))
};

export function normalizeIban(value:string){return value.replace(/\s/g,'').toUpperCase();}
export function validIban(value:string){const iban=normalizeIban(value);if(!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)||(iban.startsWith('ES')&&iban.length!==24))return false;const moved=iban.slice(4)+iban.slice(0,4);let mod=0;for(const c of moved){for(const digit of (/[A-Z]/.test(c)?String(c.charCodeAt(0)-55):c))mod=(mod*10+Number(digit))%97;}return mod===1;}

export function weddingPhase(config:{phase?:WeddingPhase;date:string},now=Date.now()):Exclude<WeddingPhase,'auto'>{
 if(config.phase&&config.phase!=='auto')return config.phase;
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 return day<config.date?'before':day===config.date?'during':'after';
}
export function safePhoto(value:string){return /^\/(?!\/)[^\s]*$/.test(value)||/^https:\/\//.test(value);}
