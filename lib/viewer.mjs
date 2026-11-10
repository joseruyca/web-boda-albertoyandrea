export function swipeStep(start,end,zoomed=false){if(!start||!end||zoomed)return 0;const dx=end.x-start.x,dy=end.y-start.y;return Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.3?(dx>0?-1:1):0;}
export function memoryDate(value){const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'});}
