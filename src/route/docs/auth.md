## `/auth` **(for production)**

- 사용자 생성, 로그인, 로그아웃 등 사용자 상태 관리를 지원하는 API.
- SPARCS SSO를 사용하는 프로덕션 용 API.

### `/sparcssso` **(GET)**

- SPARCS SSO 로그인 페이지로 리다이렉트.

#### URL Parameters

- 없음

#### Response

- SPARCS SSO 로그인 페이지로 리다이렉트.

#### Errors

- 없음

### `/sparcssso/callback` **(GET)**

- SPARCS SSO 로그인 페이지로부터 다시 리다이렉트되었을 때 로그인을 시도함

#### URL Parameters

- state
- code

#### Response

- DB에 존재하는 id면 로그인 진행 후 프론트엔드의 첫 페이지로 리다이렉트
- DB에 존재하지 않는 id면 새로운 사용자를 만들고 로그인을 진행한 후 프론트엔드의 첫 페이지로 리다이렉트

#### Errors

- 없음

### `/logout` **(GET)**

- 세션을 삭제하여 사용자를 로그아웃시킴

#### URL Parameters

- 없음

#### Response

```javascript
{
    ssoLogoutUrl: String, // sso 로그아웃 url
}
```

#### Errors

- 500 / "internal server error"

### `/getToken` **(GET)**

- 세션의 로그인 정보를 토큰으로 만들어 반환

#### URL Parameters

- 없음

#### Response

```javascript
{
    status: 200,
    data: String, //JSON Web Token
}
```

#### Errors

- 403 "not logged in"

### `/app/token/generate` **(GET)**

- SPARCSSSO로 로그인을 진행하고 로그인 정보를 담아 ACCESSTOKEN, REFRESHTOKEN을 반환

#### URL Parameters

- None

#### Response

app's deep link
형식 APP_URI_SCHEME + ://login?accessToken=[ACCESSTOKEN]&refreshToken=[REFRESHTOKEN]

#### Errors

- 없음

### `/app/token/refresh` **(GET)**

- 만료된 access token을 refresh token을 활용하여 갱신

#### URL Parameters

- accessToken / 만료된 유효한 JWT Access Token이어야 함
- refreshToken / 만료되지 않은 유효한 JWT Refresh Token 이어야 함.

#### Response

```javascript
{
    accessToken: [newAccessToken], // JSON Web Token
    refreshToken: [newRefreshToken], //JSON Web Token
}
```

#### Errors

- 401 / Invalid Access Token
- 401 / Invalid Token
- 401 / Expired Token
- 401 / Not Refresh Token
- 501 / Server Error

### `/app/token/login` **(GET)**

- access token을 사용하여 로그인

#### URL Parameters

- accessToken / 만료 되지 않은 유효한 JWT accessToken 이어야 함

#### Response

None / 세션 기록

#### Errors

- 401 / Invalid Access Token
- 401 / Invalid Token
- 401 / Expired Token
- 401 / Not Refresh Token
- 501 / Server Error

### `/app/device` **(POST)**

- 기기의 deviceToken을 데이터베이스에 등록

#### URL Parameters

- accessToken / 만료 되지 않은 유효한 JWT accessToken 이어야 함
- deviceToken / Firebase 라이브러리에서 제공해주는 DeviceToken 이어야 함

#### Response

None

#### Errors

- 400 / invalid request ( URL Parameters가 누락되어 있음 )
- 401 / unauthorized ( 토큰이 유효하지 않음 )
- 500 / server error

### `/app/device` **(DELETE)**

- 기기의 deviceToken을 데이터베이스에서 삭제

#### URL Parameters

- accessToken / 만료 되지 않은 유효한 JWT accessToken 이어야 함
- deviceToken / Firebase 라이브러리에서 제공해주는 DeviceToken 이어야 함

#### Response

None

#### Errors

- 400 / invalid request ( URL Parameters가 누락되어 있음 )
- 401 / unauthorized ( 토큰이 유효하지 않음 )
- 500 / server error
