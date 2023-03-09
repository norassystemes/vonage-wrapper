import { z } from "zod";

const dateLike = z.string().or(z.number()).or(z.date());
/**
 * @description Coerce a date-like string, number, or Date to a Date
 */
const ToDate = dateLike.pipe(z.coerce.date());

export { ToDate };
