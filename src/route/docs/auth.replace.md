## `/auth` **(for dev)**

- 사용자 생성, 로그인, 로그아웃 등 사용자 상태 관리를 지원하는 API.
- SPARCS SSO 대신 자체 로그인 페이지를 사용하는 개발 전용 API.

### `/sparcssso` **(GET)**

- 자체 로그인 페이지의 html 소스를 반환.

#### URL Parameters

- 없음

#### Response

- 로그인 페이지의 html 소스

#### Errors

- 없음

### `/try` **(POST)**

- 요청받은 정보로 로그인을 시도

#### POST request form

```javascript
{
  id: String, // 로그인을 할 사용자의 id
}
```

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
    status: 200,
    data: "logged out successfully",
}
```

#### Errors

- 없음

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
