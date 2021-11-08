## `/json/logininfo`

- 로그인 정보 제공을 지원하는 API.

### `/` **(GET)**

- 사용자의 로그인 세션이 유효한 경우 사용자의 정보를 반환하는 API.

#### URL Parameters

- 없음

#### Response

- 현재 로그인된 사용자의 정보

```javascript
{
  id: String,
  sid: String,
  name: String,
}
```

- 로그인되어있지 않은 경우 아래 정보를 반환함.

```javascript
{
  id: undefined,
  sid: undefined,
  name: undefined,
}
```

#### Errors

- 없음

### `/detail` **(GET)**

- 사용자의 로그인 세션이 유효한 경우 사용자의 **상세한** 정보를 반환하는 API.

#### URL Parameters

- 없음

#### Response

- 현재 로그인된 사용자의 정보

```javascript
{
  id: String,
  nickname: String,
  withdraw: Boolean,
  ban: Boolean,
  joinat: Date,
  subinfo: {
      kaist: String,
      sparcs: String,
      facebook: String,
      twitter: String,
  },
}
```

- 로그인되어있지 않은 경우 아래 정보를 반환함.

```javascript
{
  id: undefined,
}
```

#### Errors

- 백엔드에서 오류가 발생했을 때

```javascript
{
  err: true,
}
```
