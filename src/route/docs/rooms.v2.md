## `/rooms`

- 방 생성/수정/삭제/조회 기능을 지원하는 API.
- 로그인된 상태에서만 접근 가능
- Request form에서 요구하는 property 이름에 ? 이 붙은 경우 필수가 아니라는 뜻
- 방을 반환할 경우 그 type은 다음과 같다.

```javascript
Room {
  _id: ObjectId, //ObjectID
  name: String, // 1~50글자로 구성되며 영어 대소문자, 숫자, 한글, "-", ",", ".", "?", "!", "_"로만 이루어져야 함.
  from: {
    _id: ObjectId // 출발지 document의 ObjectId
    koName: String, // 출발지의 한국어 명칭
    enName: String, // 출발지의 영어 명칭
  }, 
  to: {
    _id: ObjectId // 도착지 document의 ObjectId
    koName: String, // 도착지의 한국어 명칭
    enName: String, // 도착지의 영어 명칭
  }, 
  time: String(ISO 8601), // ex) 방 출발 시각. '2022-01-12T13:58:20.180Z'
  part: [
    {
      id: String, // 참여 중인 사용자 id
      name: String, // 참여 중인 사용자 이름
      nickname: String // 참여 중인 사용자 닉네임
    }
  ], 
  maxPartLength: Number(2~4), //방의 최대 인원 수
  madeat: String(ISO 8601), // ex) 방 생성 시각. '2022-01-12T13:58:20.180Z'
  settlement: [
    {
      id: String, // 참여 중인 사용자 id
      name: String, // 참여 중인 사용자 이름
      nickname: String, // 참여 중인 사용자 닉네임
      isSettlement: Boolean //해당 사용자의 정산이 완료됐는지 여부
    }
  ]
  __v: Number, // 문서 버전. mongoDB 내부적으로 사용됨.
}
```

### `info/` **(GET)**

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
  name : String, // 방 이름. 문서 상단에 명시된 규칙을 만족시켜야 함
  from : ObjectId, // 출발지 Document의 ObjectId
  to : ObjectId, // 도착지 Document의 ObjectId
  time : Date, // 방 출발 시각. 현재 이후여야 함.
  part? : String[],  // 방 사람들의 ObjectId. 따라서 빈 배열로 요청하시면 됩니다.
  maxPartLength: Number(2~4), //방의 최대 인원 수
}
```

#### Errors

- 400 "bad request"
- 400 "locations are same"
- 400 "no corresponding locations"
- 500 "internal server error"

#### Response

- 새로이 만들어진 방

### `/invite` (POST)

room의 ID와 user들의 ID list를 받아 해당 room의 participants에 추가한다.

#### request JSON form

```javascript
{
    roomId : ObjectId, // 초대 혹은 참여하려는 방 Document의 ObjectId
    users : [String(userId)], // user.id (not ObjectID)
}
```

#### Errors

- 400 "Bad request"
- 400 "no corresponding room"
- 400 "{userID} Already in room"
- 400 "You cannot invite other user(s) when you are not joining the room"
- 400 "The room is full"
- 500 "internal server error"

### `/search` **(GET)**

출발지/도착지/날짜를 받아 해당하는 room들을 반환한다.

- name: String, //검색할 방의 이름. 주어진 경우 해당 텍스트가 방의 이름에 포함된 방들만 반환. 주어지지 않은 경우 임의의 이름을 가지는 방들을 검색.
- from : String, // 출발지. 주어진 경우 출발지가 일치하는 방들만 반환. 주어지지 않은 경우 임의의 출발지를 가지는 방들을 검색.
- to : String, // 도착지. 주어진 경우 도착지가 일치하는 방들만 반환. 주어지지 않은 경우 임의의 도착지를 가지는 방들을 검색.
- time? : Date, // 출발 시각. 주어진 경우 주어진 시간부터 주어진 시간부터 그 다음에 찾아오는 오전 5시 전에 출발하는 방들만 반환. 주어지지 않은 경우 현재 시각부터 그 다음으로 찾아오는 오전 5시 전까지의 방들을 반환.
- maxPartLength: Number(2~4), // 방의 최대 인원 수. 주어진 경우 최대 인원 수가 일치하는 방들만 반환. 주어지지 않은 경우 임의의 최대 인원 수를 가지는 방들을 검색.


#### Response

조건에 맞는 방**들**의 정보: `Room[]`

#### Errors

- 400 "Bad request"
- 400 "no corresponding locations"
- 500 "Internal server error"

### `/searchByUser` **(GET)**

로그인된 사용자가 참여 중인 room들을 반환한다.

#### URL parameters

없음.

#### Response

```javascript
{
  ongoing: [Room], //이미 출발한 방
  done: [Room], //아직 출발 안 한 방
}
```

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
  name : String, // 방 이름. 문서 상단에 명시된 규칙을 만족시켜야 함
  from : ObjectId, // 출발지 Document의 ObjectId
  to : ObjectId, // 도착지 Document의 ObjectId
  time : Date, // 방 출발 시각. 현재 이후여야 함.
  part? : String[]  // 방 사람들의 ObjectId. 따라서 빈 배열로 요청하시면 됩니다.
  maxPartLength: Number(2~4), // 방의 최대 인원 수.
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
  id: ObjectId, // 삭제할 방 Document의 ObjectId
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

### `:id/settlement/` **(POST)**

- ID를 받아 해당 룸의 요청을 보낸 유저의 정산을 완료로 처리
- 방에 참여한 멤버들이 모두 정산완료를 하면 방은 과거방으로 변경됨

#### URL Parameters

- id : 정산할 room의 ID

#### Response

- 멤버들의 정산정보가 반영된 방의 정보

#### Errors

- 400 "Bad request"
- 404 "cannot find settlement info"
- 500 "internal server error"