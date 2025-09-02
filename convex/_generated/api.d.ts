/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from 'convex/server';
import type * as assets from '../assets.js';
import type * as attendances from '../attendances.js';
import type * as concerts from '../concerts.js';
import type * as events from '../events.js';
import type * as http from '../http.js';
import type * as lib_role from '../lib/role.js';
import type * as lib_utils from '../lib/utils.js';
import type * as memberships from '../memberships.js';
import type * as organizations from '../organizations.js';
import type * as partMemberships from '../partMemberships.js';
import type * as parts from '../parts.js';
import type * as programs from '../programs.js';
import type * as seatings from '../seatings.js';
import type * as users from '../users.js';

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  attendances: typeof attendances;
  concerts: typeof concerts;
  events: typeof events;
  http: typeof http;
  'lib/role': typeof lib_role;
  'lib/utils': typeof lib_utils;
  memberships: typeof memberships;
  organizations: typeof organizations;
  partMemberships: typeof partMemberships;
  parts: typeof parts;
  programs: typeof programs;
  seatings: typeof seatings;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>;
