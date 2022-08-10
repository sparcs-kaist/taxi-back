## `/locations`

- 출발지/도착지로 사용 가능한 장소 목록 조회 기능을 지원하는 API.
- 로그인된 상태에서만 접근 가능
- Location의 type은 아래와 같다.
  
```javascript
Location: {
    _id: String, // ObjectID
    koName: String, // 장소의 한국어 명칭 (e.g.) "택시승강장")
    enName: String, // 장소의 영어 명칭 (e.g.) "Taxi Stand")
}
```

### `/` **(GET)**

출발지/도착지로 사용 가능한 장소 목록 및 요청 처리 당시 서버 시각을 제공하는 API.

#### URL parameters

- 없음.

#### Response

- 서버에 저장된 location이 없을 경우에는 locations에 빈 배열을 반환함

```javascript
{
  locations: [Location], // 출발지/도착지로 이용 가능한 장소 목록
  time: String(ISO 8601), // ex) '2022-01-12T13:58:20.180Z'
}
```

#### Errors

- 500 "internal server error"