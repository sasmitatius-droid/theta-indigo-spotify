export interface D1QueryResult {
  results?: any[];
  success: boolean;
  meta?: any;
}

export async function queryD1<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const dbId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !dbId || !apiToken) {
    console.error('⚠️ D1 configuration keys are missing in environment variables.');
    return [];
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        sql,
        params,
      }),
      // Disable Next.js caching for DB calls to always get fresh data
      cache: 'no-store',
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      const errorMsg = body.errors?.[0]?.message || `HTTP ${res.status}`;
      throw new Error(`D1 HTTP Error: ${errorMsg}`);
    }

    const queryResult = body.result?.[0];
    if (!queryResult) return [];
    if (!queryResult.success) {
      throw new Error(`D1 query execution failed`);
    }
    return (queryResult.results || []) as T[];
  } catch (error) {
    console.error(`D1 Query Error (${sql}):`, error);
    throw error;
  }
}

export async function executeD1(sql: string, params: any[] = []): Promise<D1QueryResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const dbId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !dbId || !apiToken) {
    throw new Error('Cloudflare D1 credentials are not fully configured in environment variables.');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        sql,
        params,
      }),
      cache: 'no-store',
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      const errorMsg = body.errors?.[0]?.message || `HTTP ${res.status}`;
      throw new Error(`D1 HTTP Error: ${errorMsg}`);
    }

    const queryResult = body.result?.[0];
    if (!queryResult) {
      throw new Error('No query result returned from D1');
    }
    return queryResult;
  } catch (error) {
    console.error(`D1 Execute Error (${sql}):`, error);
    throw error;
  }
}
