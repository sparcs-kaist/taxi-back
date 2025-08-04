import { RequestHandler } from "express";

/**
 * @description It is same interface with core.ParamsDictionary at express.
 * Use this type if you can't import core.ParamsDictionary from express
 */
export interface ParamsDictionary {
  [key: string]: string;
}

/**
 * @template Q - ReqQuery Type
 * @template P - Url Params type (default: core.ParamsDictionary)
 * @template ResBody - Response Body Type (default: any)
 * @template ReqBody - Request Body Type (default: any)
 * @template Local - res.locals type (default: Record<string, any>)
 * @description RequestHandler에서 Query를 바꾸기 위한 Custom Handler
 */
export type QueryHandler<
  Q,
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  Local extends Record<string, any> = Record<string, any>
> = RequestHandler<P, ResBody, ReqBody, Q, Local>;
