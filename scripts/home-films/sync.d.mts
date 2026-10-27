export type HomeFilmPlan={status:string;candidate?:unknown;[key:string]:unknown};
export function planHomeFilm(root:string,candidate:unknown):Promise<HomeFilmPlan>;
export function applyHomeFilm(root:string,plan:HomeFilmPlan):Promise<HomeFilmPlan>;
export function main(args?:string[]):Promise<void>;
