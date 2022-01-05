## `/rooms`

- 방 생성/수정/삭제/조회 기능을 지원하는 API.
- 로그인된 상태에서만 접근 가능
- Request form에서 요구하는 property 이름에 ? 이 붙은 경우 필수가 아니라는 뜻
- 방을 반환할 경우 그 type은 다음과 같다.

```javascript
Room {
  _id: String,
  name: String,
  from: String,
  to: String,
  time: String(ISO 8601),
  part: String[],
  madeat: String(ISO 8601),
  __v: Number,
}
```

### `:id/info/` **(GET)**

ID를 parameter로 받아 해당 ID의 room의 정보 출력

#### URL parameters

- id : 조회할 room의 ID

#### Response

- 해당 방의 정보

#### Errors

- 403 "not logged in"
- 403 "did not joined the room"
- 404 "id does not exist"
- 500 "internal server error"

### `/create` **(POST)**

요청을 받아 room을 생성

#### POST request form

`Request body`

```javascript
{
  name : String,
  from : String,
  to : String,
  time : Date,
  part? : String[]  // 방 안의 사람들의 고유 id
}
```

#### Errors

- 400 "bad request"
- 500 "internal server error"

#### Response

- 새로이 만들어진 방

### `/invite` (POST) (검증 안됨)

room의 ID와 user들의 ID list를 받아 해당 room의 participants에 추가한다.

#### request JSON form

```javascript
{
    roomId : ObjectID,
    users : List[userID], //user.id (not ObjectID)
}
```

#### Errors

- 400 "Bad request"
- 404 "no corresponding room"
- 409 "{userID} Already in room"
- 500 "internal server error"

### `/search` **(GET)**

출발지/도착지/날짜를 받아 해당하는 room들을 반환한다.

#### GET request body

```javascript
{
    from : String, // 출발지
    to : String, // 도착지
    time? : Date, // 날짜
}
```

#### Response

조건에 맞는 방**들**의 정보: `Room[]`

#### Errors

- 400 "Bad request, from/to location not given"
- 404 "no corresponding location"
- 500 "internal server error"

### `/searchByName/:name` **(GET)**

방 이름을 받아 해당하는 room들을 반환한다.

#### URL parameters

- name : 검색할 방의 이름

#### Response

- 해당 방의 정보
- **동명의 방이 있을 시, 해당 방들을 모두 반환한다.**

#### Errors

- 400 "Bad request"
- 404 "no matching room(s)"
- 500 "internal server error"

### `/searchByUser` **(GET)**

로그인된 사용자가 참여 중인 room들을 반환한다.

#### URL parameters

없음.

#### Response

- 해당 방의 정보

#### Errors

- 403 "not logged in"
- 500 "internal server error"

### `:id/edit/` **(POST)** **(for dev)**

- ID와 수정할 데이터를 JSON으로 받아 해당 ID의 room을 수정
- 주의 : 주어진 데이터로 그 방 데이터를 모두 덮어씌움, 특정 property를 주지 않으면 Undefined로 씌움
- 프론트엔드에서 쓰일 일은 없어 보임.

#### URL Parameters

- id : 수정할 room의 ID

#### POST request form

```javascript
{
    name : String,
    from : String,
    to : String,
    time : Date,
    part : String[]
}
```

#### Response

- 변경된 방의 정보

#### Errors

- 400 "Bad request"
- 404 "id does not exist"
- 500 "internal server error"

### `:id/delete/` **(GET)** **(for dev)**

ID를 받아 해당 ID의 room을 제거

#### URL Parameters

- id : 삭제할 room의 ID

#### Response

```javascript
{
  id: String,
  isDeleted: true
}
```

#### Errors

- 404 "ID does not exist"
- 500 "Internal server error"

### `/searchByUser` **(GET)**

로그인된 사용자가 참여 중인 room들을 반환한다.

#### URL parameters

없음.

#### Response

- 해당 방의 정보

#### Errors

- 403 "not logged in"
- 500 "internal server error"

### `/getAllRoom` **(GET)** (for dev)

모든 방 가져옴

### `/removeAllRoom` **(GET)** (for dev)

모든 방 삭제
