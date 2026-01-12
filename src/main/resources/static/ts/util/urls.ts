declare global {
    interface Window {
        ENV: {
            basePath: string;
            apiUrl: string;
            realmBase: string;
            enrollCompleteUrl: string;
            tokenEndpoint: string;
            challengeUrl: string;
        };
    }
}


export const REALM_BASE = window.ENV.realmBase ?? "http://localhost:8080/realms/OCP";
export const ENROLL_COMPLETE_URL =
  window.ENV.enrollCompleteUrl ?? `${REALM_BASE}/push-mfa/enroll/complete`;
export const TOKEN_ENDPOINT =
  window.ENV.tokenEndpoint ?? `${REALM_BASE}/protocol/openid-connect/token`;
export const CHALLENGE_URL =
  window.ENV.challengeUrl ??
  `${REALM_BASE}/push-mfa/login/challenges/CHALLENGE_ID/respond`;