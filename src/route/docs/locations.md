## `/json/logininfo`

- 출발지 / 도착지 정보를 제공하는 API.
- 로그인된 상태에서만 접근 가능

### `/` **(GET)**

- 사용 가능한 모든 출발지 / 도착지 목록을 반환하는 API.

#### URL Parameters

- 없음

#### Response

- 사용 가능한 모든 출발지 / 도착지 목록을 Array로 반환함.

```javascript
[
  {
    name: String,
  },
]
```

#### Errors

- 500 "internal server error"