/*
 * PromiseMap: A data structure to memoize expensive requests and mitigate
 * the thundering herd.
 */
import type {UserProfile, PromiseMap} from './types';

let CACHE_MISS = 0;

/*
 * Sample data returned from an expensive computation.
 */
const accountData: UserProfile = {
  avatar: 'https://ahmedhashim.app/images/low_poly_avatar.png',
  bio: 'definitely not a bot',
  id: 1,
  joined: 1663424830,
  location: {
    latitude: -27.09962924203303,
    longitude: -109.34637304606693,
  },
  username: 'ahmed',
};

/*
 * Using a `PromiseMap` object to get profile data
 * @param cache A PromiseMap object
 * @param key The cache key
 */
const promiseMap = (
  cache: PromiseMap<string, UserProfile>,
  key: string
): Promise<UserProfile> | undefined => {
  // Caching the promise generated by the network call satisfies this condition
  // on the first network request.
  if (!cache.has(key)) cache.set(key, getUserProfile());

  return cache.get(key);
};

/*
 * Using an ordinary `Map` object to get account data
 * @param cache A Map used for caching
 * @param key The cache key
 */
const ordinaryMap = async (
  cache: Map<string, UserProfile>,
  key: string
): Promise<UserProfile | undefined> => {
  // Caching the value returned from the network call only satisfies this
  // condition when the promise resolves, thus forcing incoming requests to miss
  // the cache (.
  // NOTE: The tradeoff here is halting the thread until the caller finishes.
  if (!cache.has(key)) cache.set(key, await getUserProfile());

  return cache.get(key);
};

/*
 * Mocking an expensive network call to get account data.
 */
const getUserProfile = (): Promise<UserProfile> => {
  const latency = 50 + Math.floor(Math.random() * 100); // jitter

  CACHE_MISS++; // an expensive computation has occurred

  return new Promise(resolve =>
    setTimeout(() => resolve(accountData), latency)
  );
};

/*
 * Test a Map used to cache expensive queries.
 * @param getData A function using a cache object to get data.
 * @param cacheType Description of the type of cache used in printing results.
 */
const test = async (getData: Function, cacheType: string): Promise<void> => {
  let data;
  const cache = new Map();
  const key = 'accountData';
  const requestCount = 50;

  // reset counter
  CACHE_MISS = 0;

  // simulate a series of contiguous requests
  for (let i = 0; i < requestCount; i++) data = getData(cache, key);

  // print results
  process.stdout.write('\n');
  console.log('==============================================================');
  console.log(`Using ${cacheType}`);
  console.log('==============================================================');
  console.log('requests:', requestCount);
  console.log('cache misses:', CACHE_MISS);
  console.log('data:', await data);
  process.stdout.write('\n');
};

// run profiles
await test(ordinaryMap, 'an ordinary Map');
await test(promiseMap, 'a PromiseMap');
