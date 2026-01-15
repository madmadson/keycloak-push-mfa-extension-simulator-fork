import { getById, onReady, setMessage } from "../shared.js";
import { unpackLoginConfirmToken, 
  extractUserIdFromCredentialId,
  createChallengeToken,
  createDpopProof
} from "../util/token-util.js";
import { TOKEN_ENDPOINT, LOGIN_PENDING_ENDPOINT, CHALLENGE_ENDPOINT } from "../util/urls.js";
import { postAccessToken, getPendingChallenges, postChallengesResponse } from "../util/http-util.js";

const CHALLENGE_ID = 'CHALLENGE_ID';

onReady(() => {
  const qs = new URLSearchParams(location.search);

  const tokenEl = getById<HTMLInputElement>("token");
  const confirmBtnEl = getById<HTMLFormElement>("confirmBtn");
  const confirmBtnBackendEl = getById<HTMLFormElement>("confirmBtnBackend");
  const iamUrlEl = getById<HTMLInputElement>("iam-url");
  const messageEl = getById<HTMLElement>("message");
  const actionEl = getById<HTMLSelectElement>("action");
  const contextEl = getById<HTMLSelectElement>("context");
  const userVerificationEl = getById<HTMLSelectElement>("userVerification");

  tokenEl.value = qs.get("token") ?? "";
  iamUrlEl.value = qs.get("url") ?? "";
  actionEl.value = qs.get("action") ?? "";
  contextEl.value = qs.get("context") ?? "";
  userVerificationEl.value = qs.get("userVerification") ?? "";

  confirmBtnBackendEl.addEventListener("click", async (e) => {
   const _token = tokenEl.value.trim();
    const _context = contextEl.value.trim();
    let _iamUrl: string | URL = iamUrlEl.value.trim();
    if (!_token) {
      setMessage(messageEl, "token required...", "error");
      return;
    }
    if (_iamUrl) {
      try {
        _iamUrl = new URL(_iamUrl);
      } catch (e) {
        setMessage(messageEl, "Not a valid url...", "error");
        return;
      }
    }

    setMessage(messageEl, "Starting backend enrollment..." );

    try {
      const formData = new FormData();
      formData.append("token", _token);
      if (_context) formData.append("context", _context);
      formData.append("_iamUrl", _iamUrl ? _iamUrl.toString() : "http://localhost:8080/realms/demo");

      const response = await fetch("/confirm/login", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        setMessage(messageEl, error, "error");
        return;
      }
      const data = await response.text();
      setMessage(messageEl, data, "success");
    } catch (e) {
       etMessage(messageEl, e instanceof Error ? e.message : String(e), "error");
    }
  
  });

  confirmBtnEl.addEventListener("click", async (e) => {
    e.preventDefault();
    setMessage(messageEl, "Logging in...", "info");

    try {
      const _action = actionEl.value.trim();
      const _token = tokenEl.value.trim();
      const _context = contextEl.value.trim();
      const _userVerification = userVerificationEl.value.trim();
      const _iamUrl: string | URL = iamUrlEl.value.trim();

      if (!_token) {
        setMessage(messageEl, "token required...", "error");
        return;
      }
      const confirmValues = unpackLoginConfirmToken(_token);
      if (confirmValues === null) {
        setMessage(messageEl, "invalid confirm token payload...", "error");
        return;
      }
      const effectiveAction = (_action ?? 'approve').trim().toLowerCase();
      const tokenUserVerification = confirmValues.userVerification;
      const effectiveUserVerification = firstNonBlank(_userVerification, tokenUserVerification, _context);

      const credentialId = confirmValues.userId;
      const challengeId = confirmValues.challengeId;
      const userId = extractUserIdFromCredentialId(credentialId);
    
       if (!userId) {
        setMessage(messageEl, "unable to extract user id from credential id...", "error");
        return;
      }
      
      const dPopAccessToken = await createDpopProof(credentialId, 'POST',  _iamUrl?.toString() + TOKEN_ENDPOINT);
      const accessTokenResponse = await postAccessToken(dPopAccessToken);

      if (!accessTokenResponse.ok) {
        setMessage(messageEl, `${await accessTokenResponse.text()}`, "error");
        return;
      }
      const accessTokenJson = (await accessTokenResponse.json()) as any;
      const accessToken = accessTokenJson['access_token'];
      const pendingUrl = new URL(_iamUrl?.toString() + LOGIN_PENDING_ENDPOINT);
      pendingUrl.searchParams.set('userId', userId);
      const pendingHtu = pendingUrl.toString();
      const pendingDpop = await createDpopProof(credentialId, 'GET', pendingHtu);
      const pendingResponse = await getPendingChallenges(pendingHtu, pendingDpop, accessToken);
      if (!pendingResponse.ok) {
        setMessage(messageEl, `${await pendingResponse.text()}`, "error");
        return;
      }
      const pendingJson = (await pendingResponse.json()) as any;
      const pendingChallenge =
        pendingJson?.challenges?.find((candidate: any) => candidate?.cid === challengeId) ?? null;
      const pendingUserVerification = pendingChallenge?.userVerification ?? null;

      if (
        effectiveAction === 'approve' &&
        pendingUserVerification != null &&
        (!effectiveUserVerification || effectiveUserVerification.trim().length === 0)
      ) {
        setMessage(messageEl, `userVerification required ...`, "error");
        return;
      }
      const url = CHALLENGE_ENDPOINT.replace(CHALLENGE_ID, challengeId);
      const dpopChallengeToken = await createDpopProof(credentialId, 'POST', url);
      const challengeToken = await createChallengeToken(
        credentialId,
        challengeId,
        effectiveAction,
        effectiveAction === 'approve' ? effectiveUserVerification : undefined,
      );

      const challangeResponse = await postChallengesResponse(
        url,
        dpopChallengeToken,
        accessToken,
        challengeToken,
      );

      if (!challangeResponse.ok) {
        setMessage(messageEl, `${await challangeResponse.text()}`, "error");
        return;
      }
 
      setMessage(messageEl, 
        `userId: ${userId}; responseStatus: ${challangeResponse.status}; userVerification: ${pendingUserVerification}; `, 
        "success");

    } catch (e) {
      setMessage(
        messageEl,
        "Error: " + (e instanceof Error ? e.message : String(e)),
        "error"
      );
    }
  });
});

const firstNonBlank = (...values: Array<string | undefined | null>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};