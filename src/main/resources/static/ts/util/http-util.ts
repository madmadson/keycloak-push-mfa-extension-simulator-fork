import { ENROLL_COMPLETE, TOKEN_ENDPOINT } from './urls.js';

export async function postEnrollComplete(enrollReplyToken: string, url?: URL) {
  return await post(
    url?.toString() + ENROLL_COMPLETE,
    { 'Content-Type': 'application/json' },
    JSON.stringify({ token: enrollReplyToken })
  );
}

export async function postAccessToken(url: string, dPop: string) {
  const header = {
    'Content-Type': 'application/x-www-form-urlencoded',
    DPoP: dPop,
  };
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: window.ENV.clientId,
    client_secret: window.ENV.clientSecret,
  });
  return await post(url + TOKEN_ENDPOINT, header, body);
}

export async function postChallengesResponse(
  url: string,
  dPop: string,
  accessToken: string,
  token: string
) {
  const header = {
    Authorization: `DPoP ${accessToken}`,
    'Content-Type': 'application/json',
    DPoP: dPop,
  };
  const body = {
    token: token,
  };
  return await post(url, header, JSON.stringify(body));
}

export async function getPendingChallenges(url: string, dPop: string, accessToken: string) {
  const header = {
    Authorization: `DPoP ${accessToken}`,
    Accept: 'application/json',
    DPoP: dPop,
  };
  return await fetch(url, {
    method: 'GET',
    headers: header,
  });
}

async function post(
  url: string,
  headers?: HeadersInit,
  body?: string | BodyInit
): Promise<Response> {
  return await fetch(url, {
    method: 'POST',
    headers: headers,
    body: body,
  });
}
