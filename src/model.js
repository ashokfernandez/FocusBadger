/** @typedef {{id?:string,title:string,done?:boolean,project?:string,due?:string,importance?:number,urgency?:number,effort?:number,tags?:string[],notes?:string,created?:string,updated?:string}} Task */

/** Compute priority score. */
export function score(t) {
  const imp = t.importance ?? 0;
  const urg = t.urgency ?? 0;
  const eff = t.effort ?? 1;
  return 2 * imp + urg - eff;
}

/** Bucket by due date for simple views: Today, Week, Later, No date, Done. */
export function bucket(t, now=new Date()) {
  if (t.done) return "Done";
  if (!t.due) return "No date";
  const d = new Date(t.due);
  const start = new Date(now); start.setHours(0,0,0,0);
  const endToday = new Date(start); endToday.setDate(start.getDate()+1);
  const endWeek = new Date(start); endWeek.setDate(start.getDate()+7);
  if (d >= start && d < endToday) return "Today";
  if (d < endWeek) return "This week";
  return "Later";
}
