package de.arbeitsagentur.pushmfasim.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWT;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.JWTParser;
import com.nimbusds.jwt.SignedJWT;
import java.util.Map;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestTemplate;

@Controller
@RequestMapping("/enroll")
public class EnrollController {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("classpath:static/keys/rsa-jwk.json")
    private Resource jwkResource;

    @Value("${app.enroll.complete.url:http://localhost:8080/realms/demo/push-mfa/enroll/complete}")
    private String defaultIamUrl;

    @GetMapping
    public String showEnrollPage() {
        return "enroll-page";
    }

    @PostMapping(path = "/complete")
    @ResponseBody
    public ResponseEntity<String> completeEnrollProcess(
            @RequestParam String token,
            @RequestParam(required = false) String context,
            @RequestParam(required = false) String iamUrl)
            throws Exception {

        if (iamUrl == null || iamUrl.isEmpty()) {
            iamUrl = defaultIamUrl;
        }
        JWT jwt = JWTParser.parse(token);
        JWTClaimsSet claims = jwt.getJWTClaimsSet();

        // Unpack token
        String enrollmentId =
                claims.getClaims().containsKey("enrollmentId") ? claims.getStringClaim("enrollmentId") : null;
        String nonce = claims.getClaims().containsKey("nonce") ? claims.getStringClaim("nonce") : null;
        String userId = claims.getClaims().containsKey("sub") ? claims.getStringClaim("sub") : null;

        if (enrollmentId == null || nonce == null || userId == null) {
            return ResponseEntity.badRequest().body("Invalid token: missing required claims");
        }

        ObjectMapper objectMapper = new ObjectMapper();
        ClassPathResource jwkResource = new ClassPathResource("static/keys/rsa-jwk.json");

        JsonNode root = objectMapper.readTree(jwkResource.getInputStream());
        JsonNode publicNode = root.get("public");
        JsonNode privateNode = root.get("private");

        Map<String, Object> publicMap =
                objectMapper.convertValue(publicNode, new TypeReference<Map<String, Object>>() {});
        Map<String, Object> privateMap =
                objectMapper.convertValue(privateNode, new TypeReference<Map<String, Object>>() {});
        RSAKey publicJwk = RSAKey.parse(publicMap);
        RSAKey privateJwk = RSAKey.parse(privateMap);

        Map<String, Object> cnf = Map.of("jwk", publicJwk.toPublicJWK().toJSONObject());

        // Build enrollment JWT
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .claim("enrollmentId", enrollmentId)
                .claim("nonce", nonce)
                .subject(userId)
                .claim("deviceType", "ios")
                .claim("deviceId", "device-static-id")
                .claim("deviceLabel", "Demo Phone")
                .claim("pushProviderId", "demo-push-provider-token")
                .claim("pushProviderType", "log")
                .claim("credentialId", userId + "-device-alias-" + context)
                .claim("cnf", cnf)
                .build();

        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                .keyID("DEVICE_KEY_ID")
                .type(new JOSEObjectType("JWT"))
                .build();

        SignedJWT signedJWT = new SignedJWT(header, claimsSet);
        signedJWT.sign(new RSASSASigner(privateJwk));
        String enrollmentToken = signedJWT.serialize();

        Map<String, Object> body = Map.of("token", enrollmentToken);

        String jsonBody = objectMapper.writeValueAsString(body);

        // POST to Keycloak
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

        Objects.requireNonNull(iamUrl, "iamUrl must not be null");
        Objects.requireNonNull(HttpMethod.POST, "httpMethod must not be null");
        ResponseEntity<String> response = restTemplate.exchange(iamUrl, HttpMethod.POST, entity, String.class);

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }
}
