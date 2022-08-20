# `/rooms` API

## Table of contents

- [`/rooms` API](#rooms-api)
  - [Table of contents](#table-of-contents)
  - [Description](#description)
  - [Available endpoints](#available-endpoints)
    - [`info/` **(GET)**](#info-get)
      - [URL parameters](#url-parameters)
      - [Response](#response)
      - [Errors](#errors)
    - [`/create` **(POST)**](#create-post)
      - [POST request form](#post-request-form)
      - [Errors](#errors-1)
      - [Response](#response-1)
    - [`/join` (POST)](#join-post)
      - [request JSON form](#request-json-form)
      - [Errors](#errors-2)
    - [`/search` **(GET)**](#search-get)
      - [URL parameters](#url-parameters-1)
      - [Response](#response-2)
      - [Errors](#errors-3)
    - [`/searchByUser` **(GET)**](#searchbyuser-get)
      - [URL parameters](#url-parameters-2)
      - [Response](#response-3)
      - [Errors](#errors-4)
    - [`/:id/commitPayment` **(POST)**](#idcommitpayment-post)
      - [URL Parameters](#url-parameters-3)
      - [Response](#response-4)
      - [Errors](#errors-5)
    - [`/:id/settlement/` **(POST)**](#idsettlement-post)
      - [URL Parameters](#url-parameters-4)
      - [Response](#response-5)
      - [Errors](#errors-6)
    - [`/:id/edit/` **(POST)** **(for dev)**](#idedit-post-for-dev)
      - [URL Parameters](#url-parameters-5)
      - [POST request form](#post-request-form-1)
      - [Response](#response-6)
      - [Errors](#errors-7)
    - [`/getAllRoom` **(GET)** (for dev)](#getallroom-get-for-dev)
    - [`/removeAllRoom` **(GET)** (for dev)](#removeallroom-get-for-dev)
    - [`/:id/delete/` **(GET)** **(for dev)**](#iddelete-get-for-dev)
      - [URL Parameters](#url-parameters-6)
      - [Response](#response-7)
      - [Errors](#errors-8)

## Description

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
  isDeparted: Boolean, // 이미 출발한 택시인지 여부 (출발했으면 true)
  part: [
    {
      _id: ObjectId, // 참여 중인 사용자 Document의 ObjectId
      id: String, // 참여 중인 사용자 id
      name: String, // 참여 중인 사용자 이름
      nickname: String, // 참여 중인 사용자 닉네임
      profileImageUrl: String, // 프로필 사진 url 
      isSettlement: String, //해당 사용자의 정산이 완료됐는지 여부("not-departed" | "paid" | "send-required" | "sent") (주의: rooms/search에서는 isSettlement 속성을 반환하지 않음(undefined를 반환함).
    }
  ], 
  maxPartLength: Number(2~4), //방의 최대 인원 수
  madeat: String(ISO 8601), // ex) 방 생성 시각. '2022-01-12T13:58:20.180Z'
  settlementTotal: Number(2~4), // 정산이 완료된 사용자 수
  isOver: Boolean, // 해당 방의 정산이 완료됐는지 여부(완료 시 true)
  __v: Number, // 문서 버전. mongoDB 내부적으로 사용됨.
}
```

## Available endpoints

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

### `/join` (POST)

room의 ID를 받아 해당 room의 참가자 목록에 요청을 보낸 사용자를 추가한다.

#### request JSON form

```javascript
{
    roomId : ObjectId, // 초대 혹은 참여하려는 방 Document의 ObjectId
}
```

#### Errors

- 400 "Bad request"
- 400 "no corresponding room"
- 400 "The room is full"
- 409 "{userID} Already in room"
- 500 "internal server error"

### `/search` **(GET)**

출발지/도착지/날짜를 받아 해당하는 room들을 반환한다.

#### URL parameters

- name?: String, //검색할 방의 이름. 주어진 경우 해당 텍스트가 방의 이름에 포함된 방들만 반환. 주어지지 않은 경우 임의의 이름을 가지는 방들을 검색.
- from? : ObjectId, // 출발지 Document의 ObjectId. 주어진 경우 출발지가 일치하는 방들만 반환. 주어지지 않은 경우 임의의 출발지를 가지는 방들을 검색.
- to? : ObjectId, // 도착지 Document의 ObjectId. 주어진 경우 도착지가 일치하는 방들만 반환. 주어지지 않은 경우 임의의 도착지를 가지는 방들을 검색.
- time? : Date, // 출발 시각. 주어진 경우 주어진 시간부터 주어진 시간부터 그 다음에 찾아오는 오전 5시 전에 출발하는 방들만 반환. 주어지지 않은 경우 현재 시각부터 그 다음으로 찾아오는 오전 5시 전까지의 방들을 반환.
- maxPartLength?: Number(2~4), // 방의 최대 인원 수. 주어진 경우 최대 인원 수가 일치하는 방들만 반환. 주어지지 않은 경우 임의의 최대 인원 수를 가지는 방들을 검색.


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
  ongoing: [Room], // 정산이 완료되지 않은 방 (방의 isDone 속성이 false인 방)
  done: [Room], // 정산이 완료된 방 (방의 isDone 속성이 true인 방)
}
```

#### Errors

- 403 "not logged in"
- 500 "internal server error"


### `/:id/commitPayment` **(POST)**

- ID를 받아 해당 방에 요청을 보낸 유저를 결제자로 처리
- 방의 part 배열에서 요청을 보낸 유저의 isSettlement 속성을 `paid`로 설정하고, 나머지 유저들의 isSettlement 속성을 `"send-required"`로 설정함.

#### URL Parameters

- id : 정산할 room의 ID

#### Response

- 멤버들의 정산정보가 반영된 방의 정보

#### Errors

- 400 "Bad request": 로그인이 되어있지 않은 경우
- 404 "cannot find settlement info": 사용자가 참여 중인 방이 아니거나, 이미 다른 사람이 결제자인 경우
- 500 "internal server error"



### `/:id/settlement/` **(POST)**

- ID를 받아 해당 방에 요청을 보낸 유저의 정산을 완료로 처리
- 방의 part 배열에서 요청을 보낸 유저의 isSettlement 속성을 `send-required`에서 `"sent"`로 변경함.
- 방에 참여한 멤버들이 모두 정산완료를 하면 방의 `isDone` 속성이 `true`로 변경되며, 과거 방으로 취급됨

#### URL Parameters

- id : 정산할 room의 ID

#### Response

- 멤버들의 정산정보가 반영된 방의 정보

#### Errors

- 400 "Bad request" : 로그인이 되어있지 않은 경우
- 404 "cannot find settlement info": 사용자가 참여중인 방이 아니거나, 사용자가 결제를 했거나 이미 정산한 경우
- 500 "internal server error"

### `/:id/edit/` **(POST)** **(for dev)**

- ID와 수정할 데이터를 JSON으로 받아 해당 ID의 room을 수정
- 방에 참여중인 사용자만 정보를 수정할 수 있음.
- 프론트엔드에서 쓰일 일은 없어 보임.

#### URL Parameters

- id : 수정할 room의 ID

#### POST request form

```javascript
{
  name? : String, // 방 이름. 문서 상단에 명시된 규칙을 만족시켜야 함
  from? : ObjectId, // 출발지 Document의 ObjectId
  to? : ObjectId, // 도착지 Document의 ObjectId
  time? : Date, // 방 출발 시각. 현재 이후여야 함.
  maxPartLength?: Number(2~4), // 방의 최대 인원 수. 현재 참여 인원수보다 크거나 같은 값이어야 함.
}
```

#### Response

- 변경된 방의 정보

#### Errors

- 400 "Bad request"
- 404 "id does not exist"
- 500 "internal server error"

### `/getAllRoom` **(GET)** (for dev)

모든 방 가져옴

### `/removeAllRoom` **(GET)** (for dev)

모든 방 삭제

### `/:id/delete/` **(GET)** **(for dev)**

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