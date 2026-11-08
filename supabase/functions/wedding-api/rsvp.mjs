export const MENU_LABELS={standard:'Menú general',vegetarian:'Vegetariano',vegan:'Vegano',child:'Infantil'};
export function emptyDiet(){return {menu:'standard',allergies:'',intolerances:'',other:''};}
const text=(v,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
export function normalizeRsvp(value,count){
 if(!Array.isArray(value?.attending)||value.attending.length!==count||value.attending.some(v=>typeof v!=='boolean'))throw Error('Indica si asiste cada persona de la invitación.');
 if(value.dietary!==undefined&&(!Array.isArray(value.dietary)||value.dietary.length!==count))throw Error('Revisa las necesidades alimentarias de cada persona.');
 const dietary=Array.from({length:count},(_,i)=>{const d=value.dietary?.[i];if(!value.attending[i])return emptyDiet();if(d!==undefined&&(!d||typeof d!=='object'||Array.isArray(d)||!Object.hasOwn(MENU_LABELS,d.menu)||['allergies','intolerances','other'].some(k=>typeof d[k]!=='string'||d[k].length>500)))throw Error('Revisa el menú y las indicaciones de alimentación.');return d?{menu:d.menu,allergies:text(d.allergies),intolerances:text(d.intolerances),other:text(d.other)}:emptyDiet();});
 return {attending:[...value.attending],dietary,allergies:value.attending.some(Boolean)?text(value.allergies,1000):'',bus:value.attending.some(Boolean)&&value.bus===true,note:text(value.note,1000)};
}
export function dietFor(response,index){return {...emptyDiet(),...(response?.dietary?.[index]||{})};}
export function needsDiet(d){return !!(d&&(d.allergies?.trim()||d.intolerances?.trim()||d.other?.trim()||d.menu&&d.menu!=='standard'));}
